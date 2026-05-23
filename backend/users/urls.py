from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeacherListView, UserViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path('teachers/', TeacherListView.as_view(), name='teacher-list'),
    path('manage/', include(router.urls)),
]
