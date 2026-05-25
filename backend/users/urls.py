from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeacherListView, UserViewSet, MessageViewSet, ContactsView

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

message_list = MessageViewSet.as_view({
    'get': 'list',
    'post': 'create',
})

message_detail = MessageViewSet.as_view({
    'get': 'retrieve',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = [
    path('teachers/', TeacherListView.as_view(), name='teacher-list'),
    path("contacts/", ContactsView.as_view(), name="contacts"),

    path('messages/', message_list, name='message-list'),
    path('messages/<int:pk>/', message_detail, name='message-detail'),

    path('manage/', include(router.urls)),
]