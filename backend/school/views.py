from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Student, Lesson, Course, LearningMaterial
from .serializers import (
    StudentSerializer,
    LessonSerializer,
    CourseSerializer,
    CourseDetailSerializer,
    LearningMaterialSerializer,
)
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
        return (
            Lesson.objects.filter(course__students__parent=self.request.user)
            .order_by("date")
            .distinct()
        )

class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A simple ViewSet for viewing courses.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer

class LearningMaterialViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and editing learning materials.
    """
    queryset = LearningMaterial.objects.all()
    serializer_class = LearningMaterialSerializer
    permission_classes = [IsAuthenticated]
