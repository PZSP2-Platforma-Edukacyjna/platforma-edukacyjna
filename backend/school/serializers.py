from rest_framework import serializers
from .models import Student, Lesson, Course, LearningMaterial, Payment, Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'lesson', 'student', 'status', 'date_marked']

class LearningMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningMaterial
        fields = ['id', 'title', 'description', 'url']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'course_code', 'name', 'description', 'teacher']

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'pesel', 'date_of_birth', 'parent', 'enrolled_courses']

class CourseDetailSerializer(CourseSerializer):
    learning_materials = LearningMaterialSerializer(many=True, read_only=True)
    students = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = list(CourseSerializer.Meta.fields) + ['learning_materials', 'students']

    def get_students(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.role in ['ADMIN', 'TEACHER']:
                return StudentSerializer(obj.students.all(), many=True).data
        return []

class LessonSerializer(serializers.ModelSerializer):
    course_name = serializers.StringRelatedField(source='course')
    teacher = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'course', 'course_name', 'topic', 'date', 'teacher']

    def get_teacher(self, obj):
        return obj.course.teacher.id

class PaymentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'course', 'course_name', 'course_code', 'amount', 'status', 'date']
