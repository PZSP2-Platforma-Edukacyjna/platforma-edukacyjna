from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MyChildrenView, MyChildrenScheduleView, CourseViewSet, LearningMaterialViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'learning-materials', LearningMaterialViewSet, basename='learningmaterial')

urlpatterns = [
    path('my-children/', MyChildrenView.as_view(), name='my-children'),
    path('my-children/schedule/', MyChildrenScheduleView.as_view(), name='my-children-schedule'),
    path('', include(router.urls)),
]
