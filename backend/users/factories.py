import factory
from factory.django import DjangoModelFactory
from users.models import User

class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    password = factory.PostGenerationMethodCall('set_password', 'testpassword123')

class AdminFactory(UserFactory):
    role = User.Role.ADMIN

class TeacherFactory(UserFactory):
    role = User.Role.TEACHER

class ParentFactory(UserFactory):
    role = User.Role.PARENT
