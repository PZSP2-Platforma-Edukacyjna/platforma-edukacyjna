from rest_framework import serializers
from .models import Student, Lesson, Course, LearningMaterial
from .models import Payment

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
        fields = ['id', 'first_name', 'last_name', 'pesel', 'date_of_birth', 'parent', 'enrolled_courses']

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
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id',
            'user',
            'user_email',
            'user_name',
            'course',
            'course_name',
            'course_code',
            'amount',
            'status',
            'date',
        ]

    def get_user_name(self, obj):
        full_name = f'{obj.user.first_name} {obj.user.last_name}'.strip()
        return full_name or obj.user.email

class PaymentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['status']
