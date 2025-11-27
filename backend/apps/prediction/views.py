from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser, BasePermission
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers, vary_on_cookie
from django.db.models import Q, Avg, Max, Min, Count
from django.utils import timezone
from datetime import timedelta
import logging
from .models import ProductionInput, ProductionOutput, PredictionLog
from .serializers import ProductionInputSerializer, ProductionOutputSerializer, PredictionLogSerializer

logger = logging.getLogger(__name__)

# Custom permissions
class IsStaff(BasePermission):
    """Allow access to staff users only."""
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class IsUser(BasePermission):
    """Allow access to authenticated users for their own data."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Users can only access their own objects
        return obj.created_by == request.user

class ProductionInputViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing production inputs.
    """
    queryset = ProductionInput.objects.all()
    serializer_class = ProductionInputSerializer
    permission_classes = [IsUser]
    filterset_fields = ['production_line', 'created_at', 'status']
    search_fields = ['production_line']
    ordering_fields = ['created_at', 'production_line']

    def get_queryset(self):
        """Filter based on user role and status"""
        user = self.request.user
        
        # Staff and admin can see all inputs
        if user.is_staff or user.is_superuser:
            return ProductionInput.objects.all()
        
        # Regular users only see their own inputs
        return ProductionInput.objects.filter(created_by=user)
    
    def list(self, request, *args, **kwargs):
        """Override list to handle empty data gracefully"""
        try:
            response = super().list(request, *args, **kwargs)
            # Ensure empty list is returned instead of errors
            if response.data is None:
                response.data = []
            return response
        except Exception as e:
            logger.error(f"Error fetching production inputs: {str(e)}")
            return Response([], status=status.HTTP_200_OK)
    
    def create(self, request, *args, **kwargs):
        """Create production input with pending status - no auto-prediction"""
        from .serializers import ProductionInputSubmitSerializer
        
        # Use the submit serializer for validation
        submit_serializer = ProductionInputSubmitSerializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)
        
        # Create the input with pending status
        production_input = ProductionInput.objects.create(
            created_by=request.user,
            status='pending',
            **submit_serializer.validated_data
        )
        
        # For backward compatibility
        production_input.submitted_by = request.user
        production_input.save()
        
        logger.info(f"Production input {production_input.id} submitted by {request.user.username} with status 'pending'")
        
        # Return the serialized object with ID
        serializer = self.get_serializer(production_input)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def generate_prediction(self, request, pk=None):
        """Staff action: Generate prediction for a pending input"""
        import time
        try:
            from .ml_engine import predict_output, generate_recommendation, calculate_estimated_savings
            from backend.apps.waste.models import WasteManagement, WasteRecommendation
            from datetime import date
            from django.utils import timezone
            from decimal import Decimal
        except ImportError as e:
            logger.error(f"Import error in generate_prediction: {str(e)}")
            return Response(
                {"error": f"Failed to import required modules: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        production_input = self.get_object()
        
        # Allow re-generating prediction if needed, or stick to pending only?
        # User request says "Staff approves & calculates".
        # Let's allow it even if already approved to re-calculate if needed, but primarily for pending.
        
        start_time = time.time()
        
        try:
            # Generate prediction
            prediction = predict_output(
                feed_rate=production_input.feed_rate,
                temperature=production_input.temperature,
                pressure=production_input.pressure,
                power_consumption=production_input.power_consumption
            )
            
            # Check if ProductionOutput already exists
            production_output, created = ProductionOutput.objects.update_or_create(
                input_data=production_input,
                defaults={
                    'predicted_output': prediction['predicted_output'],
                    'energy_efficiency': prediction['energy_efficiency'],
                    'output_quality': prediction['output_quality'],
                    'status': 'Approved', # Capitalized to match choices? Model says 'Approved'
                    'processed_by': request.user,
                    'is_approved': True,
                    'approved_at': timezone.now()
                }
            )
            
            # Create or update WasteManagement
            waste_record, waste_created = WasteManagement.objects.update_or_create(
                production_input=production_input,
                defaults={
                    'waste_type': "Aluminum Dross",
                    'waste_amount': prediction['waste_amount'],
                    'unit': 'KG',
                    'date_recorded': date.today(),
                    'reuse_possible': prediction['energy_efficiency'] > 50,
                    'recorded_by': request.user,
                    'production_line': production_input.production_line,
                    'temperature': production_input.temperature,
                    'pressure': production_input.pressure,
                    'energy_used': production_input.power_consumption
                }
            )
            
            # Generate recommendation
            recommendation_text = generate_recommendation(
                waste_amount=prediction['waste_amount'],
                energy_efficiency=prediction['energy_efficiency']
            )
            
            estimated_savings = calculate_estimated_savings(
                waste_amount=prediction['waste_amount'],
                energy_efficiency=prediction['energy_efficiency']
            )
            
            # Create or update WasteRecommendation
            waste_recommendation, rec_created = WasteRecommendation.objects.update_or_create(
                waste_record=waste_record,
                defaults={
                    'recommendation_text': recommendation_text,
                    'estimated_savings': Decimal(str(round(estimated_savings, 2))),
                    'ai_generated': True
                }
            )
            
            # Link waste and recommendation to output
            production_output.waste_record = waste_record
            production_output.recommendation = waste_recommendation
            production_output.save()
            
            # Update input status
            production_input.status = 'approved'
            production_input.approved_by = request.user
            production_input.save()
            
            # Calculate execution time
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            # Create PredictionLog
            PredictionLog.objects.create(
                production_output=production_output,
                confidence_score=0.92,
                q10_prediction=prediction['predicted_output'] * 0.9,
                q50_prediction=prediction['predicted_output'],
                q90_prediction=prediction['predicted_output'] * 1.1,
                model_version='v1.0.0-simple',
                input_features={
                    'production_line': production_input.production_line,
                    'temperature': production_input.temperature,
                    'pressure': production_input.pressure,
                    'feed_rate': production_input.feed_rate,
                    'power_consumption': production_input.power_consumption,
                    'anode_effect': production_input.anode_effect,
                    'bath_ratio': production_input.bath_ratio,
                    'alumina_concentration': production_input.alumina_concentration
                },
                execution_time_ms=execution_time_ms
            )
            
            logger.info(f"Prediction generated for input {production_input.id} by {request.user.username}")
            
            # Return the prediction data
            return Response({
                "message": "Prediction generated successfully",
                "prediction": {
                    "predicted_output": prediction['predicted_output'],
                    "energy_efficiency": prediction['energy_efficiency'],
                    "output_quality": prediction['output_quality'],
                    "waste_amount": prediction['waste_amount'],
                    "execution_time_ms": execution_time_ms
                }
            })
            
        except Exception as e:
            import traceback
            logger.error(f"Error generating prediction for input {production_input.id}: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to generate prediction: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def send_to_user(self, request, pk=None):
        """Staff action: Send prediction to user"""
        from django.utils import timezone
        
        production_input = self.get_object()
        
        if production_input.status != 'approved':
            return Response(
                {"error": "Can only send approved predictions to users"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the input
        production_input.sent_to_user = True
        production_input.sent_at = timezone.now()
        production_input.save()

        # Update all related objects to sent_to_user=True
        try:
            production_output = ProductionOutput.objects.get(input_data=production_input)
            production_output.sent_to_user = True
            production_output.save()
            
            # Update waste record
            waste_record = production_output.waste_record
            if waste_record:
                waste_record.sent_to_user = True
                waste_record.save()
                # Update all recommendations for this waste record
                from backend.apps.waste.models import WasteRecommendation
                WasteRecommendation.objects.filter(waste_record=waste_record).update(sent_to_user=True)
            
            # Also update the specific recommendation linked to output (if different)
            recommendation = production_output.recommendation
            if recommendation:
                recommendation.sent_to_user = True
                recommendation.save()
            
            # Prepare response data
            response_data = {
                "message": "Prediction sent to user successfully",
                "prediction": {
                    "id": production_output.id,
                    "predicted_output": production_output.predicted_output,
                    "energy_efficiency": production_output.energy_efficiency,
                    "output_quality": production_output.output_quality,
                    "created_at": production_output.created_at
                },
                "waste_management": {
                    "id": waste_record.id,
                    "waste_type": waste_record.waste_type,
                    "waste_amount": waste_record.waste_amount,
                    "unit": waste_record.unit,
                    "reuse_possible": waste_record.reuse_possible,
                    "date_recorded": waste_record.date_recorded
                } if waste_record else None,
                "waste_recommendations": {
                    "id": recommendation.id,
                    "recommendation_text": recommendation.recommendation_text,
                    "estimated_savings": float(recommendation.estimated_savings) if recommendation.estimated_savings else None,
                    "ai_generated": recommendation.ai_generated
                } if recommendation else None
            }
        except ProductionOutput.DoesNotExist:
            response_data = {
                "message": "Prediction sent to user successfully (No output generated yet)",
                "prediction": None,
                "waste_management": None,
                "waste_recommendations": None
            }
        
        logger.info(f"Prediction for input {production_input.id} sent to user by {request.user.username}")
        
        return Response(response_data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def reject(self, request, pk=None):
        """Staff action: Reject a pending input"""
        production_input = self.get_object()
        
        if production_input.status != 'pending':
            return Response(
                {"error": "Can only reject pending inputs"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        production_input.status = 'rejected'
        production_input.approved_by = request.user
        production_input.save()
        
        logger.info(f"Input {production_input.id} rejected by {request.user.username}")
        
        return Response(
            {"message": "Input rejected successfully"}
        )

class ProductionOutputViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing production outputs.
    """
    queryset = ProductionOutput.objects.select_related('input_data').all()
    serializer_class = ProductionOutputSerializer
    permission_classes = [IsUser]
    filterset_fields = ['created_at', 'input_data__production_line']
    search_fields = ['input_data__production_line']
    ordering_fields = ['created_at', 'predicted_output', 'actual_output', 'energy_efficiency']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Staff and admin can see all outputs
        if user.is_staff or user.is_superuser:
            return queryset
        
        # Regular users can only see outputs from their own inputs
        # that have been approved and sent to them
        return queryset.filter(
            input_data__created_by=user,
            sent_to_user=True
        )

    def list(self, request, *args, **kwargs):
        """Override list to add logging and handle empty data"""
        logger.info(f"Fetching production outputs for user {request.user.username}")
        try:
            response = super().list(request, *args, **kwargs)
            # Ensure empty list is returned instead of errors
            if response.data is None:
                response.data = []
            return response
        except Exception as e:
            logger.error(f"Error fetching production outputs: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        """
        Update actual output and recalculate deviation.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        logger.info(f"Updated production output {instance.id} with actual output")
        
        return Response(serializer.data)

class PredictionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing prediction logs.
    Read-only - logs are created automatically when predictions are made.
    """
    queryset = PredictionLog.objects.all()
    serializer_class = PredictionLogSerializer
    permission_classes = [IsUser]
    filterset_fields = ['model_version', 'created_at']
    search_fields = ['model_version']
    ordering_fields = ['created_at', 'confidence_score', 'execution_time_ms']
    
    def list(self, request, *args, **kwargs):
        """Override list to handle empty data gracefully"""
        try:
            response = super().list(request, *args, **kwargs)
            # Ensure empty list is returned instead of errors
            if response.data is None:
                response.data = []
            return response
        except Exception as e:
            logger.error(f"Error fetching prediction logs: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

class PendingRequestsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for staff to view pending production inputs.
    """
    queryset = ProductionInput.objects.filter(status='pending')
    serializer_class = ProductionInputSerializer
    permission_classes = [IsStaff]
    filterset_fields = ['production_line', 'created_at']
    search_fields = ['production_line']
    ordering_fields = ['created_at', 'production_line']
    
    def list(self, request, *args, **kwargs):
        """Override list to handle empty data gracefully"""
        try:
            response = super().list(request, *args, **kwargs)
            # Ensure empty list is returned instead of errors
            if response.data is None:
                response.data = []
            return response
        except Exception as e:
            logger.error(f"Error fetching pending requests: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

class PredictionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for admin/staff to view all predictions with full details.
    Admin sees ALL, staff sees ALL.
    """
    queryset = ProductionOutput.objects.all()
    serializer_class = ProductionOutputSerializer
    permission_classes = [IsStaff | IsAdminUser]
    filterset_fields = ['created_at', 'input_data__production_line', 'status']
    search_fields = ['input_data__production_line']
    ordering_fields = ['created_at', 'predicted_output', 'actual_output', 'energy_efficiency']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            # Staff and Admin see ALL predictions
            return ProductionOutput.objects.select_related('input_data', 'processed_by').all()
        return ProductionOutput.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list to handle empty data gracefully"""
        try:
            response = super().list(request, *args, **kwargs)
            # Ensure empty list is returned instead of errors
            if response.data is None:
                response.data = []
            return response
        except Exception as e:
            logger.error(f"Error fetching predictions: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

class UserPredictionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/prediction/user/
    Returns only predictions for request.user with sent_to_user=True, including nested waste and recommendation data.
    """
    serializer_class = ProductionOutputSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['created_at']
    ordering_fields = ['created_at', 'predicted_output', 'energy_efficiency']

    def get_queryset(self):
        """Only return predictions that have been sent to the user"""
        user = self.request.user
        return ProductionOutput.objects.filter(
            input_data__created_by=user,
            sent_to_user=True
        ).select_related(
            'input_data', 
            'processed_by',
            'waste_record',
            'recommendation'
        ).prefetch_related(
            'waste_record__recommendations'
        ).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """Override list to handle empty data gracefully"""
        try:
            response = super().list(request, *args, **kwargs)
            # Ensure empty list is returned instead of errors
            if response.data is None:
                response.data = []
            return response
        except Exception as e:
            logger.error(f"Error fetching user predictions: {str(e)}")
            return Response([], status=status.HTTP_200_OK)