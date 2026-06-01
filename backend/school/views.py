from rest_framework import generics, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Student, Lesson, Course, LearningMaterial, Payment, User
from .serializers import (
    StudentSerializer,
    LessonSerializer,
    CourseSerializer,
    CourseDetailSerializer,
    LearningMaterialSerializer,
    PaymentSerializer,
    PaymentStatusSerializer
)
from .permissions import IsParent, IsAdmin


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
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated, IsParent]

    def get_queryset(self):
        return (
            Lesson.objects.filter(course__students__parent=self.request.user)
            .order_by("date")
            .distinct()
        )

class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer

class LearningMaterialViewSet(viewsets.ModelViewSet):
    queryset = LearningMaterial.objects.all()
    serializer_class = LearningMaterialSerializer
    permission_classes = [IsAuthenticated]

class AdminStudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAdmin]

class AdminCourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdmin]

class AdminLessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAdmin]

class TeacherScheduleView(generics.ListAPIView):

    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role != "TEACHER":
            return Lesson.objects.none()

        return (
            Lesson.objects
            .filter(course__teacher=user)
            .order_by("date")
            .distinct()
        )

class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return Payment.objects.all().order_by('-date')
        return Payment.objects.filter(user=user).order_by('-date')

    def partial_update(self, request, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only administrators can update payment status.")

        payment = self.get_object()
        serializer = PaymentStatusSerializer(payment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(PaymentSerializer(payment, context=self.get_serializer_context()).data)
