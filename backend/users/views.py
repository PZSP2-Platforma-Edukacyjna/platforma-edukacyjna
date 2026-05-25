from django.db.models import Q
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import User, Message
from .serializers import TeacherSerializer, UserSerializer, MessageSerializer
from school.permissions import IsAdmin
from school.models import Course

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

class ContactsView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == User.Role.PARENT:
            return User.objects.filter(role=User.Role.TEACHER).order_by(
                "last_name",
                "first_name",
                "email",
            )

        if user.role == User.Role.TEACHER:
            return (
                User.objects
                .filter(
                    role=User.Role.PARENT,
                    students__enrolled_courses__teacher=user,
                )
                .distinct()
                .order_by("last_name", "first_name", "email")
            )

        if user.role == User.Role.ADMIN:
            return (
                User.objects
                .exclude(id=user.id)
                .order_by("role", "last_name", "first_name", "email")
            )

        return User.objects.none()