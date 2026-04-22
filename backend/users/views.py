from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import TeacherSerializer

class TeacherListView(generics.ListAPIView):
    """
    This view returns a list of all users with the 'TEACHER' role.
    """
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role=User.Role.TEACHER)
