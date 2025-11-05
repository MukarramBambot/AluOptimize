from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .models import ProductionInput, ProductionOutput, PredictionLog
from .serializers import (
    ProductionInputSerializer,
    ProductionOutputSerializer,
    PredictionLogSerializer,
    PredictionRequestSerializer,
    PredictionResponseSerializer
)
from backend.apps.core.permissions import IsEngineerOrAdmin, IsAnalystOrAdmin
import logging

logger = logging.getLogger(__name__)

class ProductionInputViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing production inputs.
    """
    queryset = ProductionInput.objects.all()
    serializer_class = ProductionInputSerializer
    permission_classes = [IsEngineerOrAdmin]
    filterset_fields = ['production_line', 'created_at']
    search_fields = ['production_line']
    ordering_fields = ['created_at', 'production_line']
    
    def create(self, request, *args, **kwargs):
        """Override create to handle errors gracefully and generate predictions"""
        import time
        start_time = time.time()
        
        try:
            # Create the production input
            response = super().create(request, *args, **kwargs)
            production_input = ProductionInput.objects.get(id=response.data['id'])
            
            # Generate dummy prediction: efficiency = (feed_rate / power_consumption) * 100
            try:
                energy_efficiency = (production_input.feed_rate / production_input.power_consumption) * 100
                
                # Calculate dummy predicted output (aluminum output in kg)
                # Simple formula: output = feed_rate * efficiency_factor
                predicted_output = production_input.feed_rate * 0.85  # 85% conversion rate
                
                # Calculate output quality based on temperature and bath ratio
                output_quality = min(100, (production_input.temperature / 10) + (production_input.bath_ratio * 20))
                
                # Create ProductionOutput
                production_output = ProductionOutput.objects.create(
                    input_data=production_input,
                    predicted_output=predicted_output,
                    output_quality=output_quality,
                    energy_efficiency=energy_efficiency
                )
                
                # Calculate execution time
                execution_time_ms = int((time.time() - start_time) * 1000)
                
                # Create PredictionLog
                PredictionLog.objects.create(
                    production_output=production_output,
                    confidence_score=0.92,  # Dummy confidence
                    q10_prediction=predicted_output * 0.9,
                    q50_prediction=predicted_output,
                    q90_prediction=predicted_output * 1.1,
                    model_version='v1.0.0-dummy',
                    input_features={
                        'production_line': production_input.production_line,
                        'temperature': production_input.temperature,
                        'pressure': production_input.pressure,
                        'feed_rate': production_input.feed_rate,
                        'power_consumption': production_input.power_consumption,
                        'anode_effect': production_input.anode_effect,
                        'bath_ratio': production_input.bath_ratio,
                        'alumina_concentration': production_input.alumina_concentration,
                    },
                    execution_time_ms=execution_time_ms
                )
                
                logger.info(f"Successfully created prediction for input {production_input.id}: "
                           f"efficiency={energy_efficiency:.2f}%, output={predicted_output:.2f}kg")
                
                # Add prediction data to response
                response.data['prediction'] = {
                    'predicted_output': predicted_output,
                    'energy_efficiency': energy_efficiency,
                    'output_quality': output_quality,
                    'execution_time_ms': execution_time_ms
                }
                
            except Exception as pred_error:
                logger.error(f"Error generating prediction: {str(pred_error)}", exc_info=True)
                # Don't fail the whole request if prediction fails
                response.data['prediction_error'] = str(pred_error)
            
            return response
            
        except ValidationError as e:
            logger.error(f"Validation error in ProductionInput: {e.detail}")
            return Response(
                {'error': 'Validation failed', 'details': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating ProductionInput: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to create production input', 'message': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def predict(self, request, pk=None):
        """
        Generate prediction for a specific production input.
        """
        input_data = self.get_object()
        
        # TODO: Implement ML prediction logic here
        # For now, return dummy prediction
        prediction_response = {
            'predicted_output': 1000.0,  # Dummy value
            'confidence_score': 0.95,
            'q10_prediction': 950.0,
            'q50_prediction': 1000.0,
            'q90_prediction': 1050.0,
            'model_version': '0.1.0',
            'execution_time_ms': 100
        }

        # Create ProductionOutput
        output = ProductionOutput.objects.create(
            input_data=input_data,
            predicted_output=prediction_response['predicted_output'],
            output_quality=90.0,  # Dummy value
            energy_efficiency=85.0  # Dummy value
        )

        # Create PredictionLog
        PredictionLog.objects.create(
            production_output=output,
            confidence_score=prediction_response['confidence_score'],
            q10_prediction=prediction_response['q10_prediction'],
            q50_prediction=prediction_response['q50_prediction'],
            q90_prediction=prediction_response['q90_prediction'],
            model_version=prediction_response['model_version'],
            input_features=request.data,
            execution_time_ms=prediction_response['execution_time_ms']
        )

        return Response(
            PredictionResponseSerializer(prediction_response).data,
            status=status.HTTP_201_CREATED
        )

class ProductionOutputViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing production outputs.
    """
    queryset = ProductionOutput.objects.select_related('input_data').all()
    serializer_class = ProductionOutputSerializer
    permission_classes = [IsEngineerOrAdmin]
    filterset_fields = ['created_at', 'input_data__production_line']
    search_fields = ['input_data__production_line']
    ordering_fields = ['created_at', 'predicted_output', 'actual_output', 'energy_efficiency']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Admin/staff can see all predictions
        if self.request.user.is_staff or self.request.user.is_superuser:
            return queryset
        
        # Regular users can only see approved predictions
        queryset = queryset.filter(is_approved=True, status='Approved')
        
        # Check if user has role attribute (may not exist for all users)
        if hasattr(self.request.user, 'role') and self.request.user.role == 'ANALYST':
            # Analysts can only view completed predictions
            return queryset.filter(actual_output__isnull=False)
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Override list to add logging"""
        logger.info(f"Fetching production outputs for user {request.user.username}")
        return super().list(request, *args, **kwargs)

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
        
        # TODO: implement feedback loop here to send updated actual_output back
        # to the ML model/service so it can be used for retraining / calibration.
        # Example: model_service.record_feedback(instance.input_data.id, serializer.data)
        return Response(serializer.data)

class PredictionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing prediction logs.
    Read-only - logs are created automatically when predictions are made.
    """
    queryset = PredictionLog.objects.all()
    serializer_class = PredictionLogSerializer
    permission_classes = [IsAnalystOrAdmin]
    filterset_fields = ['model_version', 'created_at']
    search_fields = ['model_version']
    ordering_fields = ['created_at', 'confidence_score', 'execution_time_ms']