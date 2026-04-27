"""
Lab Department views.
"""
import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.permissions import IsDoctor, IsLab, IsAdmin
from .models import LabProfile, LabTest
from .serializers import (
    LabProfileSerializer, LabTestSerializer,
    LabTestCreateSerializer, LabTestUpdateResultSerializer
)
from apps.doctors.models import DoctorProfile
from apps.audit.utils import log_action
from core.storage import save_uploaded_file

User = get_user_model()


class LabProfileCreateUpdateView(APIView):
    """Create or update own lab profile."""

    def get(self, request):
        if request.user.role != 'lab':
            return Response({'error': 'Only lab technicians can access this'}, status=status.HTTP_403_FORBIDDEN)

        try:
            profile = request.user.lab_profile
            serializer = LabProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)
        except LabProfile.DoesNotExist:
            return Response({'message': 'Profile not created yet'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        if request.user.role != 'lab':
            return Response({'error': 'Only lab technicians can access this'}, status=status.HTTP_403_FORBIDDEN)

        if hasattr(request.user, 'lab_profile'):
            return Response({'error': 'Profile already exists. Use PATCH to update.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = LabProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        if request.user.role != 'lab':
            return Response({'error': 'Only lab technicians can access this'}, status=status.HTTP_403_FORBIDDEN)

        try:
            profile = request.user.lab_profile
        except LabProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LabProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PendingLabsView(APIView):
    """List unverified lab profiles (Admin only)."""
    permission_classes = [IsAdmin]

    def get(self, request):
        labs = LabProfile.objects.filter(is_verified=False)
        serializer = LabProfileSerializer(labs, many=True, context={'request': request})
        return Response(serializer.data)


class VerifyLabView(APIView):
    """Verify a lab technician (Admin only)."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            lab = LabProfile.objects.get(pk=pk)
        except LabProfile.DoesNotExist:
            return Response({'error': 'Lab profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if lab.is_verified:
            return Response({'message': 'Lab technician is already verified'}, status=status.HTTP_400_BAD_REQUEST)

        lab.verify()

        log_action(
            actor=request.user,
            action='verify_lab',
            metadata={'lab_id': str(lab.id), 'lab_user_id': str(lab.user.id)},
            request=request
        )

        return Response({'message': 'Lab technician successfully verified'})


class PrescribeTestView(APIView):
    """Doctor prescribes a lab test for a patient."""
    permission_classes = [IsDoctor]

    def post(self, request):
        serializer = LabTestCreateSerializer(data=request.data)
        if serializer.is_valid():
            test = LabTest.objects.create(
                patient_id=serializer.validated_data['patient_id'],
                patient_type=serializer.validated_data['patient_type'],
                doctor=request.user.doctor_profile,
                test_name=serializer.validated_data['test_name'],
                test_description=serializer.validated_data.get('test_description', ''),
            )

            log_action(
                actor=request.user,
                patient_id=test.patient_id,
                patient_type=test.patient_type,
                action='prescribe_test',
                metadata={'test_id': str(test.id), 'test_name': test.test_name},
                request=request
            )

            return Response(
                LabTestSerializer(test, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DoctorPendingTestsView(APIView):
    """Doctor views all tests they've prescribed."""
    permission_classes = [IsDoctor]

    def get(self, request):
        tests = LabTest.objects.filter(doctor=request.user.doctor_profile)

        # Optional filter by status
        test_status = request.query_params.get('status')
        if test_status:
            tests = tests.filter(status=test_status)

        serializer = LabTestSerializer(tests, many=True, context={'request': request})
        return Response(serializer.data)


class LabSearchTestsView(APIView):
    """
    Lab searches for pending tests.
    Query params: patient_health_id, doctor_license (optional)
    Flow: Lab enters Patient Bionex ID + (Optional) Doctor Name & License Number.
    """
    permission_classes = [IsLab]

    def get(self, request):
        patient_health_id = request.query_params.get('patient_health_id', '').strip()
        doctor_license = request.query_params.get('doctor_license', '').strip()

        if not patient_health_id:
            return Response(
                {'error': 'Patient Bionex ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find the patient by Bionex Health ID
        try:
            patient = User.objects.get(unique_health_id=patient_health_id, role='patient')
        except User.DoesNotExist:
            return Response({'error': 'Patient not found with this Bionex ID'}, status=status.HTTP_404_NOT_FOUND)

        tests = LabTest.objects.filter(patient_id=patient.id)
        doctor_data = None

        if doctor_license:
            # Find the doctor by license number
            try:
                doctor = DoctorProfile.objects.get(license_number=doctor_license)
                tests = tests.filter(doctor=doctor)
                from apps.doctors.serializers import DoctorProfileSerializer
                doctor_data = DoctorProfileSerializer(doctor, context={'request': request}).data
            except DoctorProfile.DoesNotExist:
                return Response({'error': 'Doctor not found with this license number'}, status=status.HTTP_404_NOT_FOUND)

        # Optional filter by status (default: show all for context)
        test_status = request.query_params.get('status')
        if test_status:
            tests = tests.filter(status=test_status)

        # Return patient info + doctor info + tests
        from apps.accounts.serializers import UserProfileSerializer

        return Response({
            'patient': UserProfileSerializer(patient, context={'request': request}).data,
            'doctor': doctor_data,
            'tests': LabTestSerializer(tests, many=True, context={'request': request}).data,
        })


class LabUpdateResultView(APIView):
    """Lab technician submits results for a specific test."""
    permission_classes = [IsLab]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        try:
            test = LabTest.objects.get(pk=pk)
        except LabTest.DoesNotExist:
            return Response({'error': 'Test not found'}, status=status.HTTP_404_NOT_FOUND)

        if test.status != 'pending':
            return Response(
                {'error': f'Test is already {test.status}. Only pending tests can be updated.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result_text = request.data.get('result', '').strip()
        if not result_text:
            return Response({'error': 'Result text is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle file upload if present
        result_file_key = None
        if 'result_file' in request.FILES:
            file_obj = request.FILES['result_file']
            filename = f"{uuid.uuid4()}_{file_obj.name}"
            result_file_key = save_uploaded_file(
                file_obj,
                f"lab_results/{test.patient_id}",
                filename
            )

        test.result = result_text
        test.lab_technician = request.user.lab_profile
        test.status = 'completed'
        test.completed_at = timezone.now()
        if result_file_key:
            test.result_file_key = result_file_key
        test.save()

        log_action(
            actor=request.user,
            patient_id=test.patient_id,
            patient_type=test.patient_type,
            action='submit_lab_result',
            metadata={'test_id': str(test.id), 'test_name': test.test_name},
            request=request
        )

        return Response(LabTestSerializer(test, context={'request': request}).data)


class DoctorVerifyTestView(APIView):
    """Doctor verifies or rejects a completed test."""
    permission_classes = [IsDoctor]

    def post(self, request, pk):
        try:
            test = LabTest.objects.get(pk=pk)
        except LabTest.DoesNotExist:
            return Response({'error': 'Test not found'}, status=status.HTTP_404_NOT_FOUND)

        # Only the prescribing doctor can verify
        if test.doctor != request.user.doctor_profile:
            return Response(
                {'error': 'Only the prescribing doctor can verify this test'},
                status=status.HTTP_403_FORBIDDEN
            )

        if test.status != 'completed':
            return Response(
                {'error': f'Test is {test.status}. Only completed tests can be verified.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        action = request.data.get('action', 'verify')  # 'verify' or 'reject'
        remarks = request.data.get('remarks', '')

        if action == 'verify':
            test.status = 'verified'
            test.verified_at = timezone.now()
        elif action == 'reject':
            test.status = 'rejected'
        else:
            return Response({'error': "Action must be 'verify' or 'reject'"}, status=status.HTTP_400_BAD_REQUEST)

        test.doctor_remarks = remarks
        test.save()

        log_action(
            actor=request.user,
            patient_id=test.patient_id,
            patient_type=test.patient_type,
            action=f'{action}_lab_result',
            metadata={'test_id': str(test.id), 'test_name': test.test_name},
            request=request
        )

        return Response(LabTestSerializer(test, context={'request': request}).data)


class PatientTestResultsView(APIView):
    """Patient views their test results (only verified ones)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        # Patients can only view their own results
        is_doctor_or_admin = request.user.role in ['doctor', 'admin', 'lab']

        if not is_doctor_or_admin:
            if str(patient_id) != str(request.user.id):
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        tests = LabTest.objects.filter(patient_id=patient_id)

        # Patients only see verified tests; doctors/admin/lab see all
        if not is_doctor_or_admin:
            tests = tests.filter(status='verified')

        serializer = LabTestSerializer(tests, many=True, context={'request': request})
        return Response(serializer.data)
