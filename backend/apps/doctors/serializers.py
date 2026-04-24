"""
Doctor profile serializers.
"""
from rest_framework import serializers
from .models import DoctorProfile
from apps.accounts.serializers import UserProfileSerializer


class DoctorProfileSerializer(serializers.ModelSerializer):
    user_details = UserProfileSerializer(source='user', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'user', 'user_details', 'hospital_name', 
            'specialization', 'license_number', 'is_verified', 
            'verified_at', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'is_verified', 'verified_at', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        profile = DoctorProfile.objects.create(user=user, **validated_data)
        return profile
