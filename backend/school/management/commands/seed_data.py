import datetime
import random

from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from school.models import Announcement, Attendance, Course, LearningMaterial, Lesson, Payment, Student
from users.models import User


class Command(BaseCommand):
    help = 'Seeds the database with a larger set of initial data'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        random.seed(0)
        self.stdout.write('Deleting old data...')

        Attendance.objects.all().delete()
        Payment.objects.all().delete()
        LearningMaterial.objects.all().delete()
        Lesson.objects.all().delete()
        Course.objects.all().delete()
        Student.objects.all().delete()
        Announcement.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        Group.objects.all().delete()

        self.stdout.write('Creating new data...')

        self.stdout.write('Creating groups...')
        admin_group, _ = Group.objects.get_or_create(name='Admin')
        teacher_group, _ = Group.objects.get_or_create(name='Teacher')
        parent_group, _ = Group.objects.get_or_create(name='Parent')

        if not User.objects.filter(email='admin@example.com').exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='adminpassword',
            )
            self.stdout.write('Created admin user (admin@example.com / adminpassword)')
        else:
            admin_user = User.objects.get(email='admin@example.com')

        admin_user.role = User.Role.ADMIN
        admin_user.groups.add(admin_group)
        admin_user.save()

        teachers = []
        for i in range(5):
            user = User.objects.create_user(
                username=f'teacher{i + 1}',
                email=f'teacher{i + 1}@example.com',
                password='teacherpassword',
                first_name=f'Teacher_{i + 1}',
                last_name='User',
            )
            user.role = User.Role.TEACHER
            user.groups.add(teacher_group)
            user.save()
            teachers.append(user)
        self.stdout.write(f'Created {len(teachers)} teachers and assigned to Teacher group.')

        announcements = [
            (
                'Wycieczka szkolna',
                'Zapisy na wycieczkę szkolną są już dostępne. Szczegóły przekażą wychowawcy.',
            ),
            (
                'Zebranie z rodzicami',
                'Najbliższe zebranie z rodzicami odbędzie się w przyszłym tygodniu.',
            ),
            (
                'Nowe materiały edukacyjne',
                'Nauczyciele udostępnili nowe materiały w Google Drive dla wybranych kursów.',
            ),
        ]
        for days_ago, (title, body) in enumerate(announcements):
            Announcement.objects.create(
                title=title,
                body=body,
                date=timezone.now() - datetime.timedelta(days=days_ago),
            )
        self.stdout.write('Created sample announcements.')

        all_students = []
        for i in range(10):
            parent_user = User.objects.create_user(
                username=f'parent{i + 1}',
                email=f'parent{i + 1}@example.com',
                password='parentpassword',
                first_name=f'Parent_{i + 1}',
                last_name='User',
            )
            parent_user.role = User.Role.PARENT
            parent_user.groups.add(parent_group)
            parent_user.save()

            num_children = random.randint(1, 3)
            for j in range(num_children):
                student = Student.objects.create(
                    parent=parent_user,
                    pesel=str(random.randint(10000000000, 99999999999)),
                    first_name=f'Student_{i + 1}_{j + 1}',
                    last_name=parent_user.last_name,
                    date_of_birth=datetime.date(
                        2010,
                        random.randint(1, 12),
                        random.randint(1, 28),
                    ),
                )
                all_students.append(student)
        self.stdout.write(
            f'Created 10 parents with a total of {len(all_students)} students and assigned to Parent group.'
        )

        all_courses = []
        course_names = [
            'Matematyka',
            'Fizyka',
            'Chemia',
            'Biologia',
            'Historia',
            'Geografia',
            'Sztuka',
            'Muzyka',
            'Informatyka',
        ]
        course_code_counter = 1
        for teacher in teachers:
            num_courses = random.randint(1, 2)
            for _ in range(num_courses):
                course_name = random.choice(course_names)
                course_code = f'{course_name[:3].upper()}-{course_code_counter}'
                course_code_counter += 1
                course = Course.objects.create(
                    teacher=teacher,
                    course_code=course_code,
                    name=course_name,
                    description='',
                )
                all_courses.append(course)

                for material_index in range(random.randint(2, 4)):
                    drive_id = f'{course.course_code.lower()}-{material_index + 1}'
                    LearningMaterial.objects.create(
                        course=course,
                        title=f'Materiał Google Drive - {course.name}',
                        description='Link do materiału udostępnionego w Google Drive.',
                        url=f'https://drive.google.com/file/d/{drive_id}/view?usp=sharing',
                    )

                for k in range(random.randint(5, 10)):
                    days_to_add = random.randint(0, 4)
                    new_date = timezone.now() + datetime.timedelta(days=days_to_add)
                    if new_date.weekday() > 4:
                        new_date += datetime.timedelta(days=2)

                    Lesson.objects.create(
                        course=course,
                        topic=f'Lesson {k + 1}: {course_name}',
                        date=new_date.replace(
                            hour=random.randint(8, 16),
                            minute=0,
                            second=0,
                            microsecond=0,
                        ),
                    )
        self.stdout.write(f'Created {len(all_courses)} courses with lessons and learning materials.')

        if not all_courses:
            self.stdout.write(self.style.WARNING('No courses available to enroll students in.'))
        else:
            for student in all_students:
                k = min(random.randint(1, 3), len(all_courses))
                courses_to_enroll = random.sample(all_courses, k)

                course_names_in_sample = set()
                filtered_courses_to_enroll = []
                for course in courses_to_enroll:
                    if course.name not in course_names_in_sample:
                        course_names_in_sample.add(course.name)
                        filtered_courses_to_enroll.append(course)

                student.enrolled_courses.set(filtered_courses_to_enroll)
            self.stdout.write('Enrolled students in courses.')

        self.stdout.write('Creating payments...')
        for student in all_students:
            for course in student.enrolled_courses.all():
                Payment.objects.create(
                    user=student.parent,
                    course=course,
                    amount=random.choice([199.99, 249.99, 299.99, 399.00]),
                    status=random.choice([
                        Payment.Status.COMPLETED,
                        Payment.Status.COMPLETED,
                        Payment.Status.PENDING,
                        Payment.Status.FAILED,
                    ]),
                    date=timezone.now()
                    - datetime.timedelta(days=random.randint(1, 30), hours=random.randint(0, 23)),
                )
        self.stdout.write('Successfully seeded payments data.')

        self.stdout.write('Creating attendances...')
        all_lessons = list(Lesson.objects.select_related('course').prefetch_related('course__students').all())
        for lesson in all_lessons:
            for student in lesson.course.students.all():
                attendance_status = random.choices(
                    [
                        Attendance.Status.PRESENT,
                        Attendance.Status.ABSENT,
                        Attendance.Status.EXCUSED,
                        Attendance.Status.LATE,
                    ],
                    weights=[0.8, 0.05, 0.1, 0.05],
                    k=1,
                )[0]
                Attendance.objects.create(
                    lesson=lesson,
                    student=student,
                    status=attendance_status,
                )
        self.stdout.write('Successfully seeded attendances data.')

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with a larger dataset.'))
