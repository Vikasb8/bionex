"""
Emergency views.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from core.permissions import IsPatient, IsOwnerOrDoctorOrAdmin
from .models import EmergencyData
from .serializers import EmergencyDataSerializer, PublicEmergencyDataSerializer
from core.qr import generate_emergency_qr
from apps.audit.utils import log_action


class EmergencyDataManageView(APIView):
    """Manage emergency data for a patient (owner)."""
    permission_classes = [IsOwnerOrDoctorOrAdmin]
    
    def get(self, request, patient_id):
        # We need to verify the user owns this patient_id, but IsOwnerOrDoctorOrAdmin
        # only handles object-level permission. We do a manual check if they are not doctor/admin
        is_doctor_or_admin = request.user.role in ['doctor', 'admin']
        
        patient_type = 'user'
        if not is_doctor_or_admin:
            if str(patient_id) != str(request.user.id):
                from apps.family.models import FamilyProfile
                if FamilyProfile.objects.filter(id=patient_id, owner=request.user).exists():
                    patient_type = 'family'
                else:
                    return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        else:
            # Check if it's a user or family profile
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(id=patient_id).exists():
                patient_type = 'user'
            else:
                patient_type = 'family'

        data, created = EmergencyData.objects.get_or_create(
            patient_id=patient_id,
            defaults={'patient_type': patient_type}
        )
        
        serializer = EmergencyDataSerializer(data)
        return Response(serializer.data)
        
    def patch(self, request, patient_id):
        # Verify ownership
        if str(patient_id) != str(request.user.id):
            from apps.family.models import FamilyProfile
            if not FamilyProfile.objects.filter(id=patient_id, owner=request.user).exists():
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        try:
            data = EmergencyData.objects.get(patient_id=patient_id)
        except EmergencyData.DoesNotExist:
            return Response({'error': 'Emergency data not found'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = EmergencyDataSerializer(data, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmergencyModeToggleView(APIView):
    """Enable or disable emergency mode for a patient."""
    # Only the owner (patient) can toggle this
    
    def post(self, request, patient_id):
        if request.user.role != 'patient':
            return Response({'error': 'Only patients can do this'}, status=status.HTTP_403_FORBIDDEN)
            
        # Verify ownership
        patient_type = 'user'
        if str(patient_id) != str(request.user.id):
            from apps.family.models import FamilyProfile
            if FamilyProfile.objects.filter(id=patient_id, owner=request.user).exists():
                patient_type = 'family'
            else:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action') # 'enable' or 'disable'
        hours = request.data.get('hours', 24)
        
        try:
            data, created = EmergencyData.objects.get_or_create(
                patient_id=patient_id,
                defaults={'patient_type': patient_type}
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'enable':
            raw_token = data.enable_emergency_mode(hours=int(hours))
            
            # Generate Health ID for the QR code
            health_id = ""
            if patient_type == 'user':
                from django.contrib.auth import get_user_model
                User = get_user_model()
                health_id = User.objects.get(id=patient_id).unique_health_id
            else:
                from apps.family.models import FamilyProfile
                health_id = FamilyProfile.objects.get(id=patient_id).unique_health_id
                
            qr_path = generate_emergency_qr(raw_token, health_id)
            
            log_action(
                actor=request.user,
                patient_id=patient_id,
                patient_type=patient_type,
                action='enable_emergency_mode',
                request=request
            )
            
            return Response({
                'message': 'Emergency mode enabled',
                'token': raw_token,
                'expires_at': data.token_expires_at,
                'qr_code_url': request.build_absolute_uri(f'/media/{qr_path}')
            })
            
        elif action == 'disable':
            data.disable_emergency_mode()
            
            log_action(
                actor=request.user,
                patient_id=patient_id,
                patient_type=patient_type,
                action='disable_emergency_mode',
                request=request
            )
            
            return Response({'message': 'Emergency mode disabled'})
            
        return Response({'error': 'Invalid action. Must be "enable" or "disable".'}, status=status.HTTP_400_BAD_REQUEST)


class PublicEmergencyView(APIView):
    """Public, unauthenticated access to emergency data via token."""
    permission_classes = [AllowAny]

    def get(self, request, token):
        # We need to find the EmergencyData record that has this token
        # Since we only store the hash, we can't look it up directly by raw token
        # We must iterate through all active emergency records and validate.
        # This is a bit inefficient for a large DB, but secure.
        # A more scalable approach would be token = id:raw_token
        
        active_records = EmergencyData.objects.filter(is_emergency_mode_enabled=True)
        
        valid_record = None
        for record in active_records:
            if record.validate_emergency_token(token):
                valid_record = record
                break
                
        if not valid_record:
            return Response({'error': 'Invalid or expired emergency token'}, status=status.HTTP_404_NOT_FOUND)

        # Log the emergency access
        log_action(
            actor=None, # Public access
            patient_id=valid_record.patient_id,
            patient_type=valid_record.patient_type,
            action='emergency_access',
            request=request
        )

        serializer = PublicEmergencyDataSerializer(valid_record)
        return Response(serializer.data)
