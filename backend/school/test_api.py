import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from users.factories import ParentFactory, TeacherFactory, AdminFactory
from school.factories import StudentFactory, CourseFactory, LessonFactory
from school.models import Student

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
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 0

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
