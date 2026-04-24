"""
Family profile views — Add, List, Delete.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.permissions import IsPatient
from .models import FamilyProfile
from .serializers import FamilyProfileSerializer


class FamilyAddView(APIView):
    """Add a new family member profile."""
    permission_classes = [IsPatient]

    def post(self, request):
        serializer = FamilyProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FamilyListView(APIView):
    """List all family members for the authenticated patient."""
    permission_classes = [IsPatient]

    def get(self, request):
        members = FamilyProfile.objects.filter(owner=request.user, is_active=True)
        serializer = FamilyProfileSerializer(members, many=True, context={'request': request})
        return Response(serializer.data)


class FamilyDeleteView(APIView):
    """Soft-delete a family member profile."""
    permission_classes = [IsPatient]

    def delete(self, request, pk):
        try:
            member = FamilyProfile.objects.get(pk=pk, owner=request.user)
        except FamilyProfile.DoesNotExist:
            return Response({'error': 'Family member not found'}, status=status.HTTP_404_NOT_FOUND)

        member.is_active = False
        member.save(update_fields=['is_active'])
        return Response({'message': 'Family member removed'}, status=status.HTTP_200_OK)
