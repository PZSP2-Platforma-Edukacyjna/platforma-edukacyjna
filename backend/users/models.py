from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        TEACHER = "TEACHER", "Nauczyciel"
        PARENT = "PARENT", "Rodzic"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50, choices=Role.choices, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
