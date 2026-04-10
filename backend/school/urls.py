from django.urls import path
from .views import MyChildrenView

urlpatterns = [
    path('my-children/', MyChildrenView.as_view(), name='my-children'),
]
