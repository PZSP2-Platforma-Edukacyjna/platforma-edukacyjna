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

class Message(models.Model):
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_messages"
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.sender} -> {self.recipient}: {self.body[:30]}"
