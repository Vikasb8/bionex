"""
Audit views.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from core.permissions import IsAdmin
from .models import AccessLog


class AccessLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AccessLog
        fields = '__all__'
        
    def get_actor_name(self, obj):
        return obj.actor.name if obj.actor else "Anonymous"


class AuditLogsView(APIView):
    """View access logs (Admin only)."""
    permission_classes = [IsAdmin]

    def get(self, request):
        logs = AccessLog.objects.all()[:100] # Limit to last 100 for dev
        serializer = AccessLogSerializer(logs, many=True)
        return Response(serializer.data)
