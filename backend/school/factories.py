import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from school.models import Student, Course, Lesson, LearningMaterial, Payment
from users.factories import ParentFactory, TeacherFactory

class StudentFactory(DjangoModelFactory):
    class Meta:
        model = Student

    parent = factory.SubFactory(ParentFactory)
    pesel = factory.Sequence(lambda n: f"{10000000000 + n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    date_of_birth = factory.Faker("date_of_birth")

class CourseFactory(DjangoModelFactory):
    class Meta:
        model = Course

    teacher = factory.SubFactory(TeacherFactory)
    course_code = factory.Sequence(lambda n: f"CS-{n}")
    name = factory.Faker("word")
    description = factory.Faker("text")

class LessonFactory(DjangoModelFactory):
    class Meta:
        model = Lesson

    course = factory.SubFactory(CourseFactory)
    topic = factory.Faker("sentence")
    date = factory.LazyFunction(timezone.now)

class LearningMaterialFactory(DjangoModelFactory):
    class Meta:
        model = LearningMaterial

    course = factory.SubFactory(CourseFactory)
    title = factory.Faker("sentence")
    url = factory.Faker("url")

class PaymentFactory(DjangoModelFactory):
    class Meta:
        model = Payment

    user = factory.SubFactory(ParentFactory)
    course = factory.SubFactory(CourseFactory)
    amount = "199.99"
    status = Payment.Status.PENDING
