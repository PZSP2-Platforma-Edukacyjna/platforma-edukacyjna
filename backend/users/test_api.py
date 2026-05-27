import pytest
from rest_framework.test import APIClient
from rest_framework import status
from users.factories import UserFactory, TeacherFactory, ParentFactory, MessageFactory, AdminFactory
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
