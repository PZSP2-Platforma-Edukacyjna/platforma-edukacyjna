from urllib.parse import urlparse
from rest_framework import serializers
from .models import Student, Lesson, Course, LearningMaterial, Payment, Attendance, Announcement

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'lesson', 'student', 'status', 'date_marked']

    def validate(self, attrs):
        lesson = attrs.get('lesson', self.instance.lesson if self.instance else None)
        student = attrs.get('student', self.instance.student if self.instance else None)

        if lesson and student and not lesson.course.students.filter(pk=student.pk).exists():
            raise serializers.ValidationError(
                "Student is not enrolled in the lesson course."
            )

        return attrs

class LearningMaterialSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)

    class Meta:
        model = LearningMaterial
        fields = ['id', 'course', 'course_name', 'course_code', 'title', 'description', 'url']

    def validate_url(self, value):
        host = urlparse(value).netloc.lower()
        if host.startswith('www.'):
            host = host[4:]

        if host not in {'drive.google.com', 'docs.google.com'}:
            raise serializers.ValidationError(
                'Learning material URL must be a Google Drive or Google Docs link.'
            )

        return value

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'body', 'image_url', 'date', 'created_at']

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
            if request.user.role == 'ADMIN' or (
                request.user.role == 'TEACHER' and obj.teacher_id == request.user.id
            ):
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
