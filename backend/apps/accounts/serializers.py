"""
Serializers for authentication and user profile.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from core.qr import generate_standard_qr

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes user data in response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserProfileSerializer(self.user).data
        return data


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'name', 'role', 'password', 'password_confirm', 'phone', 'date_of_birth']

    def validate_role(self, value):
        if value not in ['patient', 'doctor', 'lab']:
            raise serializers.ValidationError("Role must be 'patient', 'doctor', or 'lab'.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)

        # Generate QR code for patients
        if user.role == 'patient' and user.unique_health_id:
            qr_path = generate_standard_qr(user.unique_health_id)
            user.qr_code_url = qr_path
            user.save(update_fields=['qr_code_url'])

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
    qr_code_full_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'unique_health_id',
            'qr_code_url', 'qr_code_full_url', 'phone', 'date_of_birth',
            'address', 'is_verified', 'created_at',
        ]
        read_only_fields = ['id', 'email', 'role', 'unique_health_id', 'is_verified', 'created_at']

    def get_qr_code_full_url(self, obj):
        if obj.qr_code_url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/media/{obj.qr_code_url}')
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    class Meta:
        model = User
        fields = ['name', 'phone', 'date_of_birth', 'address']
