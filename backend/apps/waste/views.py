from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, BasePermission
from django.db.models import Q, Sum, Count
from .models import WasteManagement, WasteRecommendation
from .serializers import WasteManagementSerializer, WasteRecommendationSerializer, UserWasteRecommendationSerializer
import logging

logger = logging.getLogger(__name__)

class IsStaff(BasePermission):
    """Allow access to staff users only."""
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class WasteManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing waste records.
    """
    queryset = WasteManagement.objects.all()
    serializer_class = WasteManagementSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['waste_type', 'reuse_possible', 'date_recorded']
    search_fields = ['waste_type', 'production_input__production_line']
    ordering_fields = ['date_recorded', 'waste_amount']

    def get_queryset(self):
        user = self.request.user
        
        # Staff and Admin see all waste records
        if user.is_staff or user.is_superuser:
            return WasteManagement.objects.all().order_by('-date_recorded')
            
        # Regular users only see waste records from their own inputs
        # that have been sent to them
        return WasteManagement.objects.filter(
            production_input__created_by=user,
            sent_to_user=True
        ).order_by('-date_recorded')

    def list(self, request, *args, **kwargs):
        """Override list to handle empty data gracefully"""
        try:
            response = super().list(request, *args, **kwargs)
            if response.data is None:
                response.data = []
            return response
        except Exception as e:
            logger.error(f"Error fetching waste records: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

class WasteRecommendationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing waste recommendations.
    """
    queryset = WasteRecommendation.objects.all()
    serializer_class = WasteRecommendationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ai_generated', 'created_at']
    ordering_fields = ['created_at', 'estimated_savings']

    def get_queryset(self):
        user = self.request.user
        
        # Staff and Admin see all recommendations
        if user.is_staff or user.is_superuser:
            return WasteRecommendation.objects.all().order_by('-created_at')
            
        # Regular users only see recommendations for their waste
        # that have been sent to them
        return WasteRecommendation.objects.filter(
            waste_record__production_input__created_by=user,
            sent_to_user=True
        ).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        """Override list to handle empty data gracefully"""
        try:
            response = super().list(request, *args, **kwargs)
            if response.data is None:
                response.data = []
            return response
        except Exception as e:
            logger.error(f"Error fetching waste recommendations: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

class UserWasteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/waste/user/
    Returns only waste records for request.user with sent_to_user=True
    """
    serializer_class = WasteManagementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return WasteManagement.objects.filter(
            production_input__created_by=user,
            sent_to_user=True
        ).order_by('-date_recorded')
    
    def list(self, request, *args, **kwargs):
        """Override list to handle empty data gracefully"""
        try:
            response = super().list(request, *args, **kwargs)
            if response.data is None:
                response.data = []
            return response
        except Exception as e:
            logger.error(f"Error fetching user waste: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

class UserRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/waste/user-recommendations/
    Returns only recommendations for request.user with sent_to_user=True
    """
    serializer_class = WasteRecommendationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return WasteRecommendation.objects.filter(
            waste_record__production_input__created_by=user,
            sent_to_user=True
        ).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """Override list to handle empty data gracefully"""
        try:
            response = super().list(request, *args, **kwargs)
            if response.data is None:
                response.data = []
            return response
        except Exception as e:
            logger.error(f"Error fetching user recommendations: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

class UserWasteRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
	"""
	User-facing endpoint for waste recommendations.
	Returns only recommendations linked to approved predictions for the logged-in user.
	"""
	serializer_class = UserWasteRecommendationSerializer
	permission_classes = [permissions.IsAuthenticated]
	
	def get_queryset(self):
		"""
		Filter recommendations to only show those from approved predictions
		submitted by the current user.
		"""
		user = self.request.user
		
		# Get recommendations where:
		# 1. The waste record's production input was created by this user
		# 2. The recommendation has been sent to the user
		queryset = WasteRecommendation.objects.filter(
			waste_record__production_input__created_by=user,
			sent_to_user=True
		).select_related(
			'waste_record',
			'waste_record__production_input'
		).prefetch_related(
			'production_outputs'
		).distinct().order_by('-created_at')
		
		logger.info(f"User {user.username} fetching recommendations: {queryset.count()} records")
		return queryset
	
	def list(self, request, *args, **kwargs):
		"""Override list to handle empty data gracefully"""
		try:
			response = super().list(request, *args, **kwargs)
			# Ensure empty list is returned instead of errors
			if response.data is None:
				response.data = []
			return response
		except Exception as e:
			logger.error(f"Error fetching user waste recommendations: {str(e)}")
			return Response([], status=status.HTTP_200_OK)
