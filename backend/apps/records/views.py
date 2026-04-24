"""
Medical records views.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from core.permissions import IsDoctor, IsOwnerOrDoctorOrAdmin
from .models import MedicalRecord
from .serializers import MedicalRecordSerializer
from core.storage import save_uploaded_file, get_file_url
from apps.audit.utils import log_action
import uuid


class AddMedicalRecordView(APIView):
    """Add a new medical record (Doctor only)."""
    permission_classes = [IsDoctor]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = MedicalRecordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Handle file upload if present
            report_file_key = None
            if 'report_file' in request.FILES:
                file_obj = request.FILES['report_file']
                patient_id = serializer.validated_data['patient_id']
                filename = f"{uuid.uuid4()}_{file_obj.name}"
                report_file_key = save_uploaded_file(
                    file_obj, 
                    f"medical_reports/{patient_id}", 
                    filename
                )

            record = serializer.save(
                doctor=request.user.doctor_profile,
                report_file_key=report_file_key
            )
            
            # Log the action
            log_action(
                actor=request.user,
                patient_id=record.patient_id,
                patient_type=record.patient_type,
                action='add_record',
                metadata={'record_id': str(record.id)},
                request=request
            )
            
            return Response(MedicalRecordSerializer(record, context={'request': request}).data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientRecordsListView(APIView):
    """List medical records for a specific patient."""
    permission_classes = [IsOwnerOrDoctorOrAdmin]

    def get(self, request, patient_id):
        # The permission class ensures the user is either the owner, a doctor, or an admin
        # But we still need to check if the owner is actually the owner of THIS patient_id
        # (For family members)
        
        is_doctor_or_admin = request.user.role in ['doctor', 'admin']
        
        if not is_doctor_or_admin:
            # Check if patient_id is the user themselves
            if str(patient_id) != str(request.user.id):
                # Check if patient_id is a family member
                from apps.family.models import FamilyProfile
                if not FamilyProfile.objects.filter(id=patient_id, owner=request.user).exists():
                    return Response({'error': 'Not authorized to view these records'}, status=status.HTTP_403_FORBIDDEN)
        
        records = MedicalRecord.objects.filter(patient_id=patient_id)
        
        # Log view access
        log_action(
            actor=request.user,
            patient_id=patient_id,
            action='view_records',
            request=request
        )
        
        serializer = MedicalRecordSerializer(records, many=True, context={'request': request})
        return Response(serializer.data)


class RecordFileUrlView(APIView):
    """Get a signed URL for a medical record file."""
    permission_classes = [IsOwnerOrDoctorOrAdmin]

    def get(self, request, pk):
        try:
            record = MedicalRecord.objects.get(pk=pk)
        except MedicalRecord.DoesNotExist:
            return Response({'error': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Check authorization similar to list view
        is_doctor_or_admin = request.user.role in ['doctor', 'admin']
        if not is_doctor_or_admin:
            if str(record.patient_id) != str(request.user.id):
                from apps.family.models import FamilyProfile
                if not FamilyProfile.objects.filter(id=record.patient_id, owner=request.user).exists():
                    return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        if not record.report_file_key:
            return Response({'error': 'No file attached to this record'}, status=status.HTTP_404_NOT_FOUND)
            
        url = get_file_url(record.report_file_key)
        
        # Log file access
        log_action(
            actor=request.user,
            patient_id=record.patient_id,
            patient_type=record.patient_type,
            action='view_record_file',
            metadata={'record_id': str(record.id)},
            request=request
        )
        
        return Response({'url': request.build_absolute_uri(url)})
