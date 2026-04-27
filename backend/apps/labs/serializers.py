"""
Lab Department serializers.
"""
from rest_framework import serializers
from .models import LabProfile, LabTest
from apps.accounts.serializers import UserProfileSerializer
from apps.doctors.serializers import DoctorProfileSerializer


class LabProfileSerializer(serializers.ModelSerializer):
    user_details = UserProfileSerializer(source='user', read_only=True)

    class Meta:
        model = LabProfile
        fields = [
            'id', 'user', 'user_details', 'lab_name',
            'department', 'license_number', 'is_verified',
            'verified_at', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'is_verified', 'verified_at', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        profile = LabProfile.objects.create(user=user, **validated_data)
        return profile


class LabTestSerializer(serializers.ModelSerializer):
    doctor_details = DoctorProfileSerializer(source='doctor', read_only=True)
    lab_technician_details = LabProfileSerializer(source='lab_technician', read_only=True)
    result_file_url = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = LabTest
        fields = [
            'id', 'patient_id', 'patient_type', 'doctor', 'doctor_details',
            'lab_technician', 'lab_technician_details',
            'test_name', 'test_description', 'result', 'result_file_key',
            'result_file_url', 'status', 'doctor_remarks',
            'prescribed_at', 'completed_at', 'verified_at', 'patient_name'
        ]
        read_only_fields = [
            'id', 'doctor', 'lab_technician', 'status',
            'prescribed_at', 'completed_at', 'verified_at'
        ]

    def get_result_file_url(self, obj):
        if obj.result_file_key:
            from core.storage import get_file_url
            url = get_file_url(obj.result_file_key)
            request = self.context.get('request')
            if request and url.startswith('/'):
                return request.build_absolute_uri(url)
            return url
        return None

    def get_patient_name(self, obj):
        try:
            if obj.patient_type == 'user':
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(id=obj.patient_id)
                return user.name
            elif obj.patient_type == 'family':
                from apps.accounts.models import FamilyMember
                member = FamilyMember.objects.get(id=obj.patient_id)
                return member.name
        except Exception:
            return "Unknown Patient"
        return "Unknown Patient"


class LabTestCreateSerializer(serializers.Serializer):
    """Used by doctors to prescribe tests."""
    patient_id = serializers.UUIDField()
    patient_type = serializers.ChoiceField(choices=['user', 'family'], default='user')
    test_name = serializers.CharField(max_length=255)
    test_description = serializers.CharField(required=False, allow_blank=True, default='')


class LabTestUpdateResultSerializer(serializers.Serializer):
    """Used by lab technicians to submit results."""
    result = serializers.CharField()
