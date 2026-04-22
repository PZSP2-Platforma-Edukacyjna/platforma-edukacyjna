from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Student, Lesson
from .serializers import StudentSerializer, LessonSerializer
from .permissions import IsParent

class MyChildrenView(generics.ListAPIView):
    """
    This view returns a list of all students (children)
    for the currently authenticated parent.
    """
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsParent]

    def get_queryset(self):
        return Student.objects.filter(parent=self.request.user)

class MyChildrenScheduleView(generics.ListAPIView):
    """
    This view returns a list of all lessons for all children
    of the currently authenticated parent.
    """
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated, IsParent]

    def get_queryset(self):
        return Lesson.objects.filter(
            course__students__parent=self.request.user
        ).order_by('date').distinct()
