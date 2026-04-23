from rest_framework import serializers
from .models import Student, Lesson, Course, LearningMaterial

class LearningMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningMaterial
        fields = ['id', 'title', 'description', 'url']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'course_code', 'name', 'description', 'teacher']

class CourseDetailSerializer(CourseSerializer):
    learning_materials = LearningMaterialSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = list(CourseSerializer.Meta.fields) + ['learning_materials']

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
