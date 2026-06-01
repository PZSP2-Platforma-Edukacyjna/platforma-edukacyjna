from django.db import models
from users.models import User
from django.utils import timezone

class Student(models.Model):
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='students', limit_choices_to={'role': User.Role.PARENT})
    pesel = models.CharField(max_length=11)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

class Course(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses_taught', limit_choices_to={'role': User.Role.TEACHER})
    course_code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    students = models.ManyToManyField('Student', related_name='enrolled_courses', blank=True)

    def __str__(self) -> str:
        return str(self.name)

class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    topic = models.CharField(max_length=200)
    date = models.DateTimeField()

    def __str__(self) -> str:
        return str(self.topic)

class LearningMaterial(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='learning_materials')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    url = models.URLField()

    def __str__(self) -> str:
        return str(self.title)

class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Oczekująca'
        COMPLETED = 'COMPLETED', 'Zakończona'
        FAILED = 'FAILED', 'Nieudana'

    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.COMPLETED
    )
    date = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f'Płatność {self.id} - {self.user.email} - {self.course.name} ({self.amount} PLN)'
