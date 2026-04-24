"""
Patient views — profile access by health ID.
Patient data lives on the User model; no separate Patient table needed.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from core.permissions import IsPatient, IsDoctorOrAdmin
from apps.accounts.serializers import UserProfileSerializer
from apps.audit.utils import log_action

User = get_user_model()


class PatientMeView(APIView):
    """Get own patient profile + health ID + QR code."""
    permission_classes = [IsPatient]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)


class PatientByHealthIDView(APIView):
    """Lookup a patient by Health ID (doctors/admins only)."""
    permission_classes = [IsDoctorOrAdmin]

    def get(self, request, health_id):
        try:
            patient = User.objects.get(unique_health_id=health_id, role='patient')
        except User.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

        log_action(
            actor=request.user,
            patient_id=patient.id,
            patient_type='user',
            action='view_patient',
            request=request,
        )

        serializer = UserProfileSerializer(patient, context={'request': request})
        return Response(serializer.data)
