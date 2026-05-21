from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MyChildrenView, MyChildrenScheduleView, CourseViewSet, LearningMaterialViewSet, AdminStudentViewSet, AdminCourseViewSet, AdminLessonViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'learning-materials', LearningMaterialViewSet, basename='learningmaterial')

admin_router = DefaultRouter()
admin_router.register(r'students', AdminStudentViewSet, basename='admin-student')
admin_router.register(r'courses', AdminCourseViewSet, basename='admin-course')
admin_router.register(r'lessons', AdminLessonViewSet, basename='admin-lesson')

urlpatterns = [
    path('my-children/', MyChildrenView.as_view(), name='my-children'),
    path('my-children/schedule/', MyChildrenScheduleView.as_view(), name='my-children-schedule'),
    path('manage/', include(admin_router.urls)),
    path('', include(router.urls)),
]
