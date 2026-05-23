from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import TeacherSerializer, UserSerializer
from school.permissions import IsAdmin
from django.db.models import Q
from .models import Student, Lesson, Course, LearningMaterial, Message
from .serializers import (
    StudentSerializer,
    LessonSerializer,
    CourseSerializer,
    CourseDetailSerializer,
    LearningMaterialSerializer,
    MessageSerializer,
)

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

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return (
            Message.objects
            .filter(Q(sender=user) | Q(recipient=user))
            .order_by("created_at")
        )

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
