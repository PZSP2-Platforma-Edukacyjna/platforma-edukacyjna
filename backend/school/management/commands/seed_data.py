import random
import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import Group
from users.models import User
from school.models import Student, Course, Lesson, LearningMaterial, Payment, Attendance

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
        LearningMaterial.objects.all().delete()
        Payment.objects.all().delete()
        Attendance.objects.all().delete()

        self.stdout.write('Creating new data...')

        self.stdout.write('Creating groups...')
        admin_group, _ = Group.objects.get_or_create(name='Admin')
        teacher_group, _ = Group.objects.get_or_create(name='Teacher')
        parent_group, _ = Group.objects.get_or_create(name='Parent')

        admin_user = None
        if not User.objects.filter(email='admin@example.com').exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='adminpassword'
            )
            self.stdout.write('Created admin user (admin@example.com / adminpassword)')
        else:
            admin_user = User.objects.get(email='admin@example.com')

        admin_user.role = User.Role.ADMIN
        admin_user.groups.add(admin_group)
        admin_user.save()

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
        course_names = ['Matematyka', 'Fizyka', 'Chemia', 'Biologia', 'Historia', 'Geografia', 'Sztuka', 'Muzyka', 'Informatyka']
        course_code_counter = 1
        for i, teacher in enumerate(teachers):
            num_courses = random.randint(1, 2)
            for j in range(num_courses):
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

                for _ in range(random.randint(2, 4)):
                    LearningMaterial.objects.create(
                        course=course,
                        title=f'Wikipedia - {course.name}',
                        description=f'Najlepiej zacząć od przeczytania artykułu na Wikipedii.',
                        url=f'https://pl.wikipedia.org/wiki/{course.name}'
                    )

                for k in range(random.randint(5, 10)):
                    days_to_add = random.randint(0, 4)
                    new_date = timezone.now() + datetime.timedelta(days=days_to_add)
                    # if the new date is a weekend, add 2 days to move it to monday
                    if new_date.weekday() > 4:
                        new_date += datetime.timedelta(days=2)

                    Lesson.objects.create(
                        course=course,
                        topic=f'Lesson {k+1}: {course_name}',
                        date=new_date.replace(hour=random.randint(8, 16), minute=0, second=0, microsecond=0)
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
                    status=random.choice([Payment.Status.COMPLETED, Payment.Status.COMPLETED, Payment.Status.FAILED]),

                    date=timezone.now() - datetime.timedelta(days=random.randint(1, 30), hours=random.randint(0, 23))
                )
        self.stdout.write('Successfully seeded payments data.')

        self.stdout.write('Creating attendances...')
        all_lessons = list(Lesson.objects.select_related('course').prefetch_related('course__students').all())
        for lesson in all_lessons:
            for student in lesson.course.students.all():
                status = random.choices(
                    [Attendance.Status.PRESENT, Attendance.Status.ABSENT, Attendance.Status.EXCUSED, Attendance.Status.LATE],
                    weights=[0.8, 0.05, 0.1, 0.05],
                    k=1
                )[0]
                Attendance.objects.create(
                    lesson=lesson,
                    student=student,
                    status=status
                )
        self.stdout.write('Successfully seeded attendances data.')

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with a larger dataset.'))
