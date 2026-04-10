import random
import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import Group
from users.models import User
from school.models import Student, Course, Lesson

class Command(BaseCommand):
    help = 'Seeds the database with a larger set of initial data'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        random.seed(0)
        self.stdout.write('Deleting old data...')
        User.objects.filter(is_superuser=False).delete()
        Group.objects.all().delete()
        Student.objects.all().delete()
        Course.objects.all().delete()
        Lesson.objects.all().delete()

        self.stdout.write('Creating new data...')

        self.stdout.write('Creating groups...')
        admin_group, _ = Group.objects.get_or_create(name='Admin')
        teacher_group, _ = Group.objects.get_or_create(name='Teacher')
        parent_group, _ = Group.objects.get_or_create(name='Parent')

        admin_user = None
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
            admin_user.groups.add(admin_group)
            self.stdout.write('Created admin user and assigned to Admin group.')

        teachers = []
        for i in range(5):
            first_name = f'Teacher_{i+1}'
            last_name = 'User'
            user = User.objects.create_user(
                username=f'teacher{i+1}',
                email=f'teacher{i+1}@example.com',
                password='teacherpassword',
                first_name=first_name,
                last_name=last_name,
            )
            user.role = User.Role.TEACHER
            user.groups.add(teacher_group)
            user.save()
            teachers.append(user)
        self.stdout.write(f'Created {len(teachers)} teachers and assigned to Teacher group.')

        all_students = []
        for i in range(10):
            parent_user = User.objects.create_user(
                username=f'parent{i+1}',
                email=f'parent{i+1}@example.com',
                password='parentpassword',
                first_name=f'Parent_{i+1}',
                last_name='User'
            )
            parent_user.role = User.Role.PARENT
            parent_user.groups.add(parent_group)
            parent_user.save()

            num_children = random.randint(1, 3)
            for j in range(num_children):
                student = Student.objects.create(
                    parent=parent_user,
                    pesel=str(random.randint(10000000000, 99999999999)),
                    first_name=f'Student_{i+1}_{j+1}',
                    last_name=parent_user.last_name,
                    date_of_birth=datetime.date(2010, random.randint(1, 12), random.randint(1, 28))
                )
                all_students.append(student)
        self.stdout.write(f'Created 10 parents with a total of {len(all_students)} students and assigned to Parent group.')

        all_courses = []
        course_names = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Art', 'Music', 'Physical Education', 'Computer Science']
        for i, teacher in enumerate(teachers):
            num_courses = random.randint(1, 2)
            for j in range(num_courses):
                course_name = f'{random.choice(course_names)} {101 + i}'
                course = Course.objects.create(
                    teacher=teacher,
                    name=course_name,
                    description=f'An introductory course on {course_name}.'
                )
                all_courses.append(course)

                for k in range(5):
                    Lesson.objects.create(
                        course=course,
                        topic=f'Lesson {k+1}: {course_name}',
                        date=timezone.now() + datetime.timedelta(days=k*7)
                    )
        self.stdout.write(f'Created {len(all_courses)} courses with lessons.')

        if not all_courses:
            self.stdout.write(self.style.WARNING('No courses available to enroll students in.'))
        else:
            for student in all_students:
                k = min(random.randint(1, 3), len(all_courses))
                courses_to_enroll = random.sample(all_courses, k)
                student.enrolled_courses.set(courses_to_enroll)
            self.stdout.write('Enrolled students in courses.')

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with a larger dataset.'))
