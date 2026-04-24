"""
Emergency data serializers.
"""
from rest_framework import serializers
from .models import EmergencyData
from django.contrib.auth import get_user_model

User = get_user_model()


class EmergencyDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyData
        fields = [
            'id', 'patient_id', 'patient_type', 'blood_group', 
            'allergies', 'chronic_conditions', 'current_medications',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'is_emergency_mode_enabled', 'token_expires_at', 'updated_at'
        ]
        read_only_fields = ['id', 'patient_id', 'patient_type', 'is_emergency_mode_enabled', 'token_expires_at', 'updated_at']

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class PublicEmergencyDataSerializer(serializers.ModelSerializer):
    """Limited serializer for public emergency access."""
    patient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EmergencyData
        fields = [
            'patient_id', 'patient_name', 'blood_group', 'allergies', 'chronic_conditions', 
            'current_medications', 'emergency_contact_name', 
            'emergency_contact_phone', 'emergency_contact_relation'
        ]

    def get_patient_name(self, obj):
        if obj.patient_type == 'user':
            try:
                return User.objects.get(id=obj.patient_id).name
            except User.DoesNotExist:
                return "Unknown"
        else:
            from apps.family.models import FamilyProfile
            try:
                return FamilyProfile.objects.get(id=obj.patient_id).member_name
            except FamilyProfile.DoesNotExist:
                return "Unknown"
