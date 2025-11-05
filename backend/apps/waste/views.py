from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions
from .models import WasteManagement, WasteRecommendation
from .serializers import WasteManagementSerializer, WasteRecommendationSerializer, UserWasteRecommendationSerializer
from backend.apps.core.permissions import IsEngineerOrAdmin, IsAnalystOrAdmin
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)

class WasteManagementViewSet(viewsets.ModelViewSet):
	queryset = WasteManagement.objects.all()
	serializer_class = WasteManagementSerializer
	# Engineers can create/modify, Analysts can view, Admins can do everything
	permission_classes = [IsEngineerOrAdmin]
	filterset_fields = ['waste_type', 'date_recorded']
	search_fields = ['waste_type']
	ordering_fields = ['date_recorded', 'waste_amount']

	def get_queryset(self):
		"""
		Filter waste records based on user role.
		Regular users see only their own records.
		Admins/Analysts see all records.
		"""
		user = self.request.user
		
		# Admins and staff can see all records
		if user.is_staff or user.is_superuser:
			queryset = WasteManagement.objects.all()
			logger.info(f"Admin/Staff {user.username} fetching all waste records: {queryset.count()} records")
			return queryset
		
		# Regular users see only their own waste records
		queryset = WasteManagement.objects.filter(recorded_by=user)
		logger.info(f"User {user.username} fetching waste records: {queryset.count()} records")
		return queryset

	def get_permissions(self):
		# Allow Analysts to read-only
		if self.action in ['list', 'retrieve']:
			return [IsAnalystOrAdmin()]
		return [IsEngineerOrAdmin()]

	@action(detail=True, methods=['post'])
	def generate_recommendations(self, request, pk=None):
		"""
		Placeholder action to generate recommendations for a waste record.
		TODO: Implement recommendation generation logic using ML/heuristics.
		"""
		waste_record = self.get_object()

		# TODO: plug in real recommendation engine here
		dummy_text = (
			f"Consider reusing {waste_record.waste_type} by integrating a recycling loop. "
			"Estimate: reduce raw material by 2%"
		)
		rec = WasteRecommendation.objects.create(
			waste_record=waste_record,
			recommendation_text=dummy_text,
			estimated_savings=1000.00
		)
		serializer = WasteRecommendationSerializer(rec)
		return Response(serializer.data, status=status.HTTP_201_CREATED)

class WasteRecommendationViewSet(viewsets.ModelViewSet):
	queryset = WasteRecommendation.objects.all()
	serializer_class = WasteRecommendationSerializer
	permission_classes = [IsAnalystOrAdmin]

	def get_permissions(self):
		# Analysts and Admins can list/retrieve; only Admins can create/delete
		if self.action in ['list', 'retrieve']:
			return [IsAnalystOrAdmin()]
		# fallback to admin-only for create/update/delete
		return [permissions.IsAdminUser()]

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
		# 1. The waste record's production input was submitted by this user
		# 2. The related production output is approved
		queryset = WasteRecommendation.objects.filter(
			waste_record__production_input__submitted_by=user,
			production_outputs__is_approved=True,
			production_outputs__status='Approved'
		).select_related(
			'waste_record',
			'waste_record__production_input'
		).prefetch_related(
			'production_outputs'
		).distinct().order_by('-created_at')
		
		logger.info(f"User {user.username} fetching recommendations: {queryset.count()} records")
		return queryset
