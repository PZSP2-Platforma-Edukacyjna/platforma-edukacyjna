import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from users.factories import ParentFactory, TeacherFactory, AdminFactory
from school.factories import StudentFactory, CourseFactory, LessonFactory, LearningMaterialFactory, AttendanceFactory
from school.models import Attendance, Student, Course

pytestmark = pytest.mark.django_db

class TestSchoolAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_unauthenticated_access_denied(self):
        """All school endpoints should require authentication."""
        urls = [
            '/api/my-children/',
            '/api/my-children/schedule/',
            '/api/teacher/schedule/',
            '/api/courses/',
            '/api/manage/students/',
        ]
        for url in urls:
            response = self.client.get(url)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_parent_access_control(self):
        parent = ParentFactory()
        other_parent = ParentFactory()
        student = StudentFactory(parent=parent)
        StudentFactory(parent=other_parent)

        self.client.force_authenticate(user=parent)

        response = self.client.get('/api/my-children/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]['id'] == student.id

        response = self.client.get('/api/teacher/schedule/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

        response = self.client.get('/api/manage/students/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_teacher_access_control(self):
        teacher = TeacherFactory()
        course = CourseFactory(teacher=teacher)
        lesson = LessonFactory(course=course)

        other_teacher = TeacherFactory()
        other_course = CourseFactory(teacher=other_teacher)
        LessonFactory(course=other_course)

        self.client.force_authenticate(user=teacher)

        response = self.client.get('/api/teacher/schedule/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]['id'] == lesson.id

        response = self.client.get('/api/my-children/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_access_control(self):
        admin = AdminFactory()
        StudentFactory()
        CourseFactory()

        self.client.force_authenticate(user=admin)

        response = self.client.get('/api/manage/students/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        if isinstance(data, dict) and 'results' in data:
            results = data['results']
        else:
            results = data
        assert len(results) >= 1

    def test_parent_schedule(self):
        parent = ParentFactory()
        student = StudentFactory(parent=parent)
        course = CourseFactory()
        course.students.add(student)
        lesson = LessonFactory(course=course)

        LessonFactory()

        self.client.force_authenticate(user=parent)
        response = self.client.get('/api/my-children/schedule/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]['id'] == lesson.id

    def test_parent_schedule_does_not_duplicate_shared_family_course(self):
        parent = ParentFactory()
        first_child = StudentFactory(parent=parent)
        second_child = StudentFactory(parent=parent)
        course = CourseFactory()
        course.students.add(first_child, second_child)
        lesson = LessonFactory(course=course)

        self.client.force_authenticate(user=parent)
        response = self.client.get('/api/my-children/schedule/')

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert [item['id'] for item in data] == [lesson.id]

    def test_teacher_schedule_is_sorted_by_date(self):
        teacher = TeacherFactory()
        course = CourseFactory(teacher=teacher)
        later_lesson = LessonFactory(course=course, date=timezone.now() + timedelta(days=3))
        earlier_lesson = LessonFactory(course=course, date=timezone.now() + timedelta(days=1))

        self.client.force_authenticate(user=teacher)
        response = self.client.get('/api/teacher/schedule/')

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert [item['id'] for item in data] == [earlier_lesson.id, later_lesson.id]

    def test_admin_can_create_student(self):
        admin = AdminFactory()
        parent = ParentFactory()
        self.client.force_authenticate(user=admin)

        payload = {
            "parent": parent.id,
            "pesel": "12345678901",
            "first_name": "Test",
            "last_name": "Student",
            "date_of_birth": "2015-01-01"
        }
        response = self.client.post('/api/manage/students/', payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert Student.objects.filter(pesel="12345678901").exists()

    def test_admin_can_manage_courses(self):
        admin = AdminFactory()
        teacher = TeacherFactory()
        self.client.force_authenticate(user=admin)

        payload = {
            "teacher": teacher.id,
            "course_code": "NEW-101",
            "name": "New Course"
        }
        response = self.client.post('/api/manage/courses/', payload)
        assert response.status_code == status.HTTP_201_CREATED
        course_id = response.json()['id']

        response = self.client.patch(f'/api/manage/courses/{course_id}/', {"name": "Updated Name"})
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['name'] == "Updated Name"

        response = self.client.delete(f'/api/manage/courses/{course_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Course.objects.filter(id=course_id).exists()

    def test_non_admin_cannot_manage_courses(self):
        teacher = TeacherFactory()
        self.client.force_authenticate(user=teacher)

        response = self.client.post(
            '/api/manage/courses/',
            {
                'teacher': teacher.id,
                'course_code': 'NOPE-101',
                'name': 'Blocked Course',
            },
            format='json',
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not Course.objects.filter(course_code='NOPE-101').exists()

    def test_admin_can_manage_lessons(self):
        admin = AdminFactory()
        course = CourseFactory()
        self.client.force_authenticate(user=admin)

        payload = {
            "course": course.id,
            "topic": "Intro",
            "date": "2026-06-01T10:00:00Z"
        }
        response = self.client.post('/api/manage/lessons/', payload)
        assert response.status_code == status.HTTP_201_CREATED

    def test_course_detail_includes_learning_materials(self):
        user = TeacherFactory()
        course = CourseFactory(teacher=user)
        material = LearningMaterialFactory(course=course)

        self.client.force_authenticate(user=user)
        response = self.client.get(f'/api/courses/{course.id}/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'learning_materials' in data
        assert len(data['learning_materials']) == 1
        assert data['learning_materials'][0]['id'] == material.id

    def test_teacher_course_detail_only_includes_students_for_own_course(self):
        teacher = TeacherFactory()
        other_teacher = TeacherFactory()
        own_course = CourseFactory(teacher=teacher)
        other_course = CourseFactory(teacher=other_teacher)
        own_student = StudentFactory()
        other_student = StudentFactory()
        own_course.students.add(own_student)
        other_course.students.add(other_student)

        self.client.force_authenticate(user=teacher)

        own_response = self.client.get(f'/api/courses/{own_course.id}/')
        assert own_response.status_code == status.HTTP_200_OK
        own_data = own_response.json()
        assert [student['id'] for student in own_data['students']] == [own_student.id]

        other_response = self.client.get(f'/api/courses/{other_course.id}/')
        assert other_response.status_code == status.HTTP_200_OK
        other_data = other_response.json()
        assert other_data['students'] == []

    def test_teacher_can_manage_attendance_for_own_course(self):
        teacher = TeacherFactory()
        course = CourseFactory(teacher=teacher)
        student = StudentFactory()
        course.students.add(student)
        lesson = LessonFactory(course=course)

        self.client.force_authenticate(user=teacher)

        payload = {
            "lesson": lesson.id,
            "student": student.id,
            "status": "PRESENT"
        }
        response = self.client.post('/api/attendances/', payload)
        assert response.status_code == status.HTTP_201_CREATED
        attendance_id = response.json()['id']

        update_payload = {
            "lesson": lesson.id,
            "student": student.id,
            "status": "ABSENT"
        }
        response = self.client.put(f'/api/attendances/{attendance_id}/', update_payload)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == "ABSENT"

    def test_teacher_cannot_manage_attendance_for_other_course(self):
        teacher = TeacherFactory()
        other_teacher = TeacherFactory()
        course = CourseFactory(teacher=other_teacher)
        student = StudentFactory()
        course.students.add(student)
        lesson = LessonFactory(course=course)

        self.client.force_authenticate(user=teacher)

        payload = {
            "lesson": lesson.id,
            "student": student.id,
            "status": "PRESENT"
        }
        response = self.client.post('/api/attendances/', payload)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_teacher_cannot_mark_attendance_for_student_outside_lesson_course(self):
        teacher = TeacherFactory()
        course = CourseFactory(teacher=teacher)
        lesson = LessonFactory(course=course)
        other_student = StudentFactory()

        self.client.force_authenticate(user=teacher)

        payload = {
            "lesson": lesson.id,
            "student": other_student.id,
            "status": "PRESENT"
        }
        response = self.client.post('/api/attendances/', payload)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Attendance.objects.filter(lesson=lesson, student=other_student).exists()

    def test_teacher_cannot_update_attendance_to_student_outside_lesson_course(self):
        teacher = TeacherFactory()
        course = CourseFactory(teacher=teacher)
        enrolled_student = StudentFactory()
        other_student = StudentFactory()
        course.students.add(enrolled_student)
        lesson = LessonFactory(course=course)
        attendance = AttendanceFactory(
            lesson=lesson,
            student=enrolled_student,
            status="PRESENT",
        )

        self.client.force_authenticate(user=teacher)

        response = self.client.patch(
            f'/api/attendances/{attendance.id}/',
            {"student": other_student.id},
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        attendance.refresh_from_db()
        assert attendance.student_id == enrolled_student.id

    def test_parent_can_view_own_child_attendance(self):
        parent = ParentFactory()
        other_parent = ParentFactory()

        child = StudentFactory(parent=parent)
        other_child = StudentFactory(parent=other_parent)

        lesson1 = LessonFactory()
        lesson2 = LessonFactory()

        att1 = AttendanceFactory(lesson=lesson1, student=child, status="PRESENT")
        _ = AttendanceFactory(lesson=lesson2, student=other_child, status="ABSENT")

        self.client.force_authenticate(user=parent)
        response = self.client.get('/api/attendances/')

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        if isinstance(data, dict) and 'results' in data:
            results = data['results']
        else:
            results = data

        assert len(results) == 1
        assert results[0]['id'] == att1.id

    def test_admin_can_manage_all_attendances(self):
        admin = AdminFactory()
        teacher = TeacherFactory()
        course = CourseFactory(teacher=teacher)
        student = StudentFactory()
        course.students.add(student)
        lesson = LessonFactory(course=course)

        self.client.force_authenticate(user=admin)

        payload = {
            "lesson": lesson.id,
            "student": student.id,
            "status": "EXCUSED"
        }
        response = self.client.post('/api/attendances/', payload)
        assert response.status_code == status.HTTP_201_CREATED

    def test_attendance_filtering_by_lesson(self):
        teacher = TeacherFactory()
        course = CourseFactory(teacher=teacher)
        student = StudentFactory()
        course.students.add(student)

        lesson1 = LessonFactory(course=course)
        lesson2 = LessonFactory(course=course)

        att1 = AttendanceFactory(lesson=lesson1, student=student, status="PRESENT")
        _ = AttendanceFactory(lesson=lesson2, student=student, status="ABSENT")

        self.client.force_authenticate(user=teacher)

        response_all = self.client.get('/api/attendances/')
        assert response_all.status_code == status.HTTP_200_OK
        data_all = response_all.json()
        results_all = data_all.get('results', data_all) if isinstance(data_all, dict) else data_all
        assert len(results_all) == 2

        response_filtered = self.client.get(f'/api/attendances/?lesson={lesson1.id}')
        assert response_filtered.status_code == status.HTTP_200_OK
        data_filtered = response_filtered.json()
        results_filtered = data_filtered.get('results', data_filtered) if isinstance(data_filtered, dict) else data_filtered

        assert len(results_filtered) == 1
        assert results_filtered[0]['id'] == att1.id
