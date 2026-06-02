from rest_framework import generics, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Student, Lesson, Course, LearningMaterial, Payment, Attendance, User
from .serializers import (
    StudentSerializer,
    LessonSerializer,
    CourseSerializer,
    CourseDetailSerializer,
    LearningMaterialSerializer,
    PaymentSerializer,
    PaymentStatusSerializer,
    AttendanceSerializer,
)
from .permissions import IsParent, IsAdmin, IsTeacher

class AttendanceViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and editing attendances.
    Only teachers can create/update attendances for their own courses.
    Parents can view their children's attendances.
    """
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.none()

        if user.role == 'TEACHER':
            queryset = Attendance.objects.filter(lesson__course__teacher=user)
        elif user.role == 'PARENT':
            queryset = Attendance.objects.filter(student__parent=user)
        elif user.role == 'ADMIN':
            queryset = Attendance.objects.all()

        lesson_id = self.request.query_params.get('lesson')
        if lesson_id is not None:
            queryset = queryset.filter(lesson_id=lesson_id)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        lesson = serializer.validated_data['lesson']
        if user.role != 'ADMIN' and lesson.course.teacher != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to mark attendance for this lesson.")
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        lesson = serializer.validated_data.get('lesson', serializer.instance.lesson)
        if user.role != 'ADMIN' and lesson.course.teacher != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to modify attendance for this lesson.")
        serializer.save()

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
    serializer_class = LearningMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == User.Role.ADMIN:
            return LearningMaterial.objects.all().order_by('course__name', 'title')

        if user.role == User.Role.TEACHER:
            return LearningMaterial.objects.filter(course__teacher=user).order_by(
                'course__name',
                'title',
            )

        if user.role == User.Role.PARENT:
            return (
                LearningMaterial.objects
                .filter(course__students__parent=user)
                .order_by('course__name', 'title')
                .distinct()
            )

        return LearningMaterial.objects.none()

    def ensure_can_manage_material(self, user, course):
        if user.role == User.Role.ADMIN:
            return

        if user.role == User.Role.TEACHER and course.teacher_id == user.id:
            return

        raise PermissionDenied("You do not have permission to manage materials for this course.")

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        self.ensure_can_manage_material(self.request.user, course)
        serializer.save()

    def perform_update(self, serializer):
        course = serializer.validated_data.get('course', serializer.instance.course)
        self.ensure_can_manage_material(self.request.user, course)
        serializer.save()

    def perform_destroy(self, instance):
        self.ensure_can_manage_material(self.request.user, instance.course)
        instance.delete()

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
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_queryset(self):
        user = self.request.user

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
