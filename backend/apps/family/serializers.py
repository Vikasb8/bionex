"""
Family profile serializers.
"""
from rest_framework import serializers
from .models import FamilyProfile
from core.qr import generate_standard_qr


class FamilyProfileSerializer(serializers.ModelSerializer):
    qr_code_full_url = serializers.SerializerMethodField()

    class Meta:
        model = FamilyProfile
        fields = [
            'id', 'member_name', 'date_of_birth', 'relation',
            'unique_health_id', 'qr_code_url', 'qr_code_full_url',
            'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'unique_health_id', 'qr_code_url', 'is_active', 'created_at']

    def get_qr_code_full_url(self, obj):
        if obj.qr_code_url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/media/{obj.qr_code_url}')
        return None

    def create(self, validated_data):
        owner = self.context['request'].user
        profile = FamilyProfile.objects.create(owner=owner, **validated_data)

        # Generate QR code
        qr_path = generate_standard_qr(profile.unique_health_id)
        profile.qr_code_url = qr_path
        profile.save(update_fields=['qr_code_url'])

        return profile
