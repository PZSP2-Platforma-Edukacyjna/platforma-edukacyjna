from rest_framework import permissions
from users.models import User

class IsParent(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'PARENT' role to access the view.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == User.Role.PARENT
