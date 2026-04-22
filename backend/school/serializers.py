from rest_framework import serializers
from .models import Student, Lesson

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'date_of_birth', 'enrolled_courses']

class LessonSerializer(serializers.ModelSerializer):
    course_name = serializers.StringRelatedField(source='course')
    teacher = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'course', 'course_name', 'topic', 'date', 'teacher']

    def get_teacher(self, obj):
        return obj.course.teacher.id
