from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Student
from .serializers import StudentSerializer
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
