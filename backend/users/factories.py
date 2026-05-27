import factory
from factory.django import DjangoModelFactory
from users.models import User, Message

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

class MessageFactory(DjangoModelFactory):
    class Meta:
        model = Message

    sender = factory.SubFactory(UserFactory)
    recipient = factory.SubFactory(UserFactory)
    body = factory.Faker("text")
