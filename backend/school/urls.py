from django.urls import path
from .views import MyChildrenView, MyChildrenScheduleView

urlpatterns = [
    path('my-children/', MyChildrenView.as_view(), name='my-children'),
    path('my-children/schedule/', MyChildrenScheduleView.as_view(), name='my-children-schedule'),
]
