"""
Doctor verification views.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.permissions import IsAdmin, IsDoctor
from .models import DoctorProfile
from .serializers import DoctorProfileSerializer
from apps.audit.utils import log_action


class PendingDoctorsView(APIView):
    """List unverified doctors (Admin only)."""
    permission_classes = [IsAdmin]

    def get(self, request):
        doctors = DoctorProfile.objects.filter(is_verified=False)
        serializer = DoctorProfileSerializer(doctors, many=True, context={'request': request})
        return Response(serializer.data)


class VerifyDoctorView(APIView):
    """Verify a doctor (Admin only)."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            doctor = DoctorProfile.objects.get(pk=pk)
        except DoctorProfile.DoesNotExist:
            return Response({'error': 'Doctor profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if doctor.is_verified:
            return Response({'message': 'Doctor is already verified'}, status=status.HTTP_400_BAD_REQUEST)

        doctor.verify()
        
        # Log this action
        log_action(
            actor=request.user,
            action='verify_doctor',
            metadata={'doctor_id': str(doctor.id), 'doctor_user_id': str(doctor.user.id)},
            request=request
        )

        return Response({'message': 'Doctor successfully verified'})


class DoctorProfileCreateUpdateView(APIView):
    """Create or update own doctor profile."""
    # Custom permission: Must be authenticated and role must be doctor
    # (Don't use IsDoctor here, because IsDoctor requires being verified)
    
    def get(self, request):
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            profile = request.user.doctor_profile
            serializer = DoctorProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)
        except DoctorProfile.DoesNotExist:
            return Response({'message': 'Profile not created yet'}, status=status.HTTP_404_NOT_FOUND)
            
    def post(self, request):
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
            
        if hasattr(request.user, 'doctor_profile'):
            return Response({'error': 'Profile already exists. Use PATCH to update.'}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = DoctorProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def patch(self, request):
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            profile = request.user.doctor_profile
        except DoctorProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = DoctorProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
