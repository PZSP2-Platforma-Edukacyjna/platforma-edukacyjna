from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import TeacherSerializer, UserSerializer
from school.permissions import IsAdmin

class TeacherListView(generics.ListAPIView):
    """
    This view returns a list of all users with the 'TEACHER' role.
    """
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role=User.Role.TEACHER)

class UserViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for User model.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all()
