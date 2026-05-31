import pytest
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from users.factories import UserFactory, TeacherFactory, ParentFactory, MessageFactory, AdminFactory
from users.models import Message, User
from school.factories import StudentFactory, CourseFactory

pytestmark = pytest.mark.django_db

class TestUsersAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_messages_privacy(self):
        user_a = UserFactory()
        user_b = UserFactory()
        user_c = UserFactory()

        msg1 = MessageFactory(sender=user_a, recipient=user_b)
        msg2 = MessageFactory(sender=user_b, recipient=user_a)

        msg3 = MessageFactory(sender=user_b, recipient=user_c)

        self.client.force_authenticate(user=user_a)

        response = self.client.get('/api/users/messages/')
        assert response.status_code == status.HTTP_200_OK
        results = response.json()

        message_ids = [m['id'] for m in results]
        assert msg1.id in message_ids
        assert msg2.id in message_ids
        assert msg3.id not in message_ids
        assert len(results) == 2

    def test_parent_contacts_see_teachers(self):
        parent = ParentFactory()
        teacher1 = TeacherFactory()
        teacher2 = TeacherFactory()
        other_parent = ParentFactory()

        self.client.force_authenticate(user=parent)
        response = self.client.get('/api/users/contacts/')
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        emails = [u['email'] for u in data]

        assert teacher1.email in emails
        assert teacher2.email in emails
        assert other_parent.email not in emails

    def test_teacher_contacts_see_parents_of_enrolled_students(self):
        teacher = TeacherFactory()
        course = CourseFactory(teacher=teacher)

        parent_enrolled = ParentFactory()
        student_enrolled = StudentFactory(parent=parent_enrolled)
        course.students.add(student_enrolled)

        parent_not_enrolled = ParentFactory()

        self.client.force_authenticate(user=teacher)
        response = self.client.get('/api/users/contacts/')
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        emails = [u['email'] for u in data]

        assert parent_enrolled.email in emails
        assert parent_not_enrolled.email not in emails

    def test_admin_contacts_see_everyone(self):
        admin = AdminFactory()
        teacher = TeacherFactory()
        parent = ParentFactory()

        self.client.force_authenticate(user=admin)
        response = self.client.get('/api/users/contacts/')
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        emails = [u['email'] for u in data]

        assert teacher.email in emails
        assert parent.email in emails

    def test_message_create_uses_authenticated_user_as_sender(self):
        sender = ParentFactory()
        recipient = TeacherFactory()
        spoofed_sender = TeacherFactory()

        self.client.force_authenticate(user=sender)
        response = self.client.post(
            '/api/users/messages/',
            {
                'sender': spoofed_sender.id,
                'recipient': recipient.id,
                'body': 'Prosze o informacje o pracy domowej.',
            },
            format='json',
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        message = Message.objects.get(id=data['id'])

        assert message.sender == sender
        assert message.recipient == recipient
        assert message.body == 'Prosze o informacje o pracy domowej.'
        assert data['sender'] == sender.id
        assert data['recipient'] == recipient.id
        assert data['is_mine'] is True

    def test_user_cannot_retrieve_unrelated_message(self):
        sender = UserFactory()
        recipient = UserFactory()
        outsider = UserFactory()
        message = MessageFactory(sender=sender, recipient=recipient)

        self.client.force_authenticate(user=outsider)
        response = self.client.get(f'/api/users/messages/{message.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_can_create_user_with_hashed_password(self):
        admin = AdminFactory()
        self.client.force_authenticate(user=admin)

        response = self.client.post(
            '/api/users/manage/',
            {
                'email': 'new.parent@example.com',
                'first_name': 'New',
                'last_name': 'Parent',
                'role': User.Role.PARENT,
                'password': 'VeryStrongPass123',
            },
            format='json',
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        created_user = User.objects.get(email='new.parent@example.com')

        assert data['email'] == 'new.parent@example.com'
        assert 'password' not in data
        assert created_user.check_password('VeryStrongPass123')

    def test_non_admin_cannot_manage_users(self):
        parent = ParentFactory()
        self.client.force_authenticate(user=parent)

        response = self.client.get('/api/users/manage/')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_token_response_contains_user_role(self):
        parent = ParentFactory(email='login.parent@example.com')
        parent.set_password('TestPassword123')
        parent.save()

        response = self.client.post(
            '/api/token/',
            {'email': parent.email, 'password': 'TestPassword123'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        token = AccessToken(response.json()['access'])
        assert token['role'] == User.Role.PARENT
