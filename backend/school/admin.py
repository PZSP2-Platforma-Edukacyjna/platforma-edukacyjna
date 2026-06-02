from django.contrib import admin
from .models import Student, Course, Lesson, LearningMaterial, Announcement

admin.site.register(Student)
admin.site.register(Course)
admin.site.register(Lesson)
admin.site.register(LearningMaterial)
admin.site.register(Announcement)
