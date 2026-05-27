import pytest
from rest_framework.test import APIClient
from rest_framework import status
from users.factories import ParentFactory
from school.factories import StudentFactory

pytestmark = pytest.mark.django_db

class TestStudentAPI:
    def setup_method(self):
        self.client = APIClient()
        self.parent = ParentFactory()
        self.other_parent = ParentFactory()

        self.student = StudentFactory(parent=self.parent)
        self.client.force_authenticate(user=self.parent)
        self.list_url = '/api/my-children/'

    def test_parent_can_see_their_own_student(self):
        """A parent should only see students assigned to them."""
        response = self.client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK
        results = response.json()
        assert len(results) == 1
        assert results[0]['id'] == self.student.id

    def test_parent_cannot_see_other_parents_student(self):
        """If another parent logs in, they should not see the first parent's student."""
        self.client.force_authenticate(user=self.other_parent)
        response = self.client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK
        results = response.json()
        assert len(results) == 0  # they should see 0 students
