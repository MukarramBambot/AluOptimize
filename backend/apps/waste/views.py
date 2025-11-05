from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions
from .models import WasteManagement, WasteRecommendation
from .serializers import WasteManagementSerializer, WasteRecommendationSerializer
from backend.apps.core.permissions import IsEngineerOrAdmin, IsAnalystOrAdmin

class WasteManagementViewSet(viewsets.ModelViewSet):
	queryset = WasteManagement.objects.all()
	serializer_class = WasteManagementSerializer
	# Engineers can create/modify, Analysts can view, Admins can do everything
	permission_classes = [IsEngineerOrAdmin]
	filterset_fields = ['waste_type', 'date_recorded']
	search_fields = ['waste_type']
	ordering_fields = ['date_recorded', 'waste_amount']

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
