from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MyChildrenView,
    MyChildrenScheduleView,
    TeacherScheduleView,
    CourseViewSet,
    LearningMaterialViewSet,
    AdminStudentViewSet,
    AdminCourseViewSet,
    AdminLessonViewSet,
    PaymentViewSet
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'learning-materials', LearningMaterialViewSet, basename='learningmaterial')
router.register(r'payments', PaymentViewSet, basename='payment'),

admin_router = DefaultRouter()
admin_router.register(r'students', AdminStudentViewSet, basename='admin-student')
admin_router.register(r'courses', AdminCourseViewSet, basename='admin-course')
admin_router.register(r'lessons', AdminLessonViewSet, basename='admin-lesson')

urlpatterns = [
    path("my-children/", MyChildrenView.as_view(), name="my-children"),
    path("my-children/schedule/", MyChildrenScheduleView.as_view(), name="my-children-schedule"),
    path("teacher/schedule/", TeacherScheduleView.as_view(), name="teacher-schedule"),
    path("manage/", include(admin_router.urls)),
    path("", include(router.urls))
]

