"""
Admin-specific views for prediction control and approval workflow.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .models import ProductionInput, ProductionOutput, PredictionLog, PredictionHistory
from .serializers import (
    ProductionInputSerializer,
    ProductionOutputSerializer
)
from backend.apps.waste.models import WasteManagement, WasteRecommendation
from .rl_environment import AluminumProductionEnvironment
from datetime import date
from django.utils import timezone
import logging
import time

logger = logging.getLogger(__name__)


class AdminPredictionControlViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for controlling predictions - run, approve, reject.
    """
    queryset = ProductionInput.objects.select_related('submitted_by').prefetch_related('output').all()
    serializer_class = ProductionInputSerializer
    permission_classes = [IsAdminUser]
    
    def list(self, request):
        """
        List all production inputs with their prediction status.
        Supports filtering by status.
        """
        status_filter = request.query_params.get('status', None)
        
        queryset = self.queryset.order_by('-created_at')
        
        # Build response with input and output data
        results = []
        for prod_input in queryset:
            try:
                output = prod_input.output
                output_data = ProductionOutputSerializer(output).data
            except ProductionOutput.DoesNotExist:
                output_data = None
            
            # Apply status filter
            if status_filter:
                if output_data:
                    if output_data['status'] != status_filter:
                        continue
                elif status_filter != 'Pending':
                    continue
            
            input_data = self.get_serializer(prod_input).data
            results.append({
                'input': input_data,
                'output': output_data,
                'has_prediction': output_data is not None
            })
        
        return Response(results)
    
    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """
        Run prediction for a specific production input.
        Uses dummy ML logic as specified.
        """
        start_time = time.time()
        
        try:
            production_input = self.get_object()
            
            # Check if prediction already exists
            try:
                existing_output = production_input.output
                return Response(
                    {
                        'error': 'Prediction already exists for this input',
                        'output': ProductionOutputSerializer(existing_output).data
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            except ProductionOutput.DoesNotExist:
                pass
            
            # Initialize RL Environment
            rl_env = AluminumProductionEnvironment()
            
            # Execute RL step - get state, action, reward, and predictions
            rl_result = rl_env.step(production_input)
            
            # Extract results
            predicted_output = rl_result['predicted_output']
            energy_efficiency = rl_result['energy_efficiency']
            output_quality = rl_result['output_quality']
            waste_amount = rl_result['waste_amount']
            
            state = rl_result['state']
            action = rl_result['action']
            reward_data = rl_result['reward']
            
            # Create ProductionOutput with RL data
            production_output = ProductionOutput.objects.create(
                input_data=production_input,
                predicted_output=predicted_output,
                output_quality=output_quality,
                energy_efficiency=energy_efficiency,
                waste_estimate=waste_amount,
                status='Processing',
                processed_by=request.user,
                # RL fields
                reward=reward_data['total_reward'],
                rl_state=state,
                rl_action=action,
                rl_reward_breakdown=reward_data
            )
            
            # Auto-generate WasteRecord with production context
            waste_record = WasteManagement.objects.create(
                production_input=production_input,
                waste_type='Aluminum Dross',
                waste_amount=waste_amount,
                unit='KG',
                date_recorded=date.today(),
                reuse_possible=energy_efficiency > 50,
                recorded_by=production_input.submitted_by,
                production_line=production_input.production_line,
                temperature=production_input.temperature,
                pressure=production_input.pressure,
                energy_used=production_input.power_consumption
            )
            logger.info(f"Created WasteRecord {waste_record.id} for user {production_input.submitted_by.username}: {waste_amount:.2f} kg")
            
            # Generate AI recommendation using RL environment
            recommendation_text = rl_env.generate_recommendation_text(
                waste_amount=waste_amount,
                energy_efficiency=energy_efficiency,
                action=rl_env.suggest_action(
                    rl_env.create_state(production_input),
                    energy_efficiency,
                    waste_amount
                )
            )
            
            # Calculate estimated savings based on efficiency (cap to prevent overflow)
            if energy_efficiency >= 80:
                estimated_savings = min(waste_amount * 2.5, 9999999999.99)
            elif energy_efficiency >= 60:
                estimated_savings = min(waste_amount * 2.0, 9999999999.99)
            elif energy_efficiency >= 40:
                estimated_savings = min(waste_amount * 1.5, 9999999999.99)
            else:
                estimated_savings = min(waste_amount * 1.0, 9999999999.99)
            
            waste_recommendation = WasteRecommendation.objects.create(
                waste_record=waste_record,
                recommendation_text=recommendation_text,
                estimated_savings=estimated_savings,
                ai_generated=True
            )
            logger.info(f"Created WasteRecommendation {waste_recommendation.id} for WasteRecord {waste_record.id}")
            
            # Link waste and recommendation to production output
            production_output.waste_record = waste_record
            production_output.recommendation = waste_recommendation
            production_output.save()
            logger.info(f"Linked ProductionOutput {production_output.id} to WasteRecord {waste_record.id} and Recommendation {waste_recommendation.id}")
            
            # Create PredictionHistory entry for RL feedback loop
            PredictionHistory.objects.create(
                production_output=production_output,
                state=state,
                action=action,
                reward=reward_data['total_reward'],
                reward_breakdown=reward_data,
                actual_efficiency=energy_efficiency,
                actual_waste=waste_amount,
                was_approved=False,  # Will be updated on approval
                production_line=production_input.production_line,
                submitted_by=production_input.submitted_by
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
                model_version='v1.0.0-admin-controlled',
                input_features={
                    'production_line': production_input.production_line,
                    'temperature': temperature,
                    'pressure': production_input.pressure,
                    'feed_rate': feed_rate,
                    'power_consumption': power_consumption,
                    'anode_effect': production_input.anode_effect,
                    'bath_ratio': bath_ratio,
                    'alumina_concentration': production_input.alumina_concentration,
                },
                execution_time_ms=execution_time_ms
            )
            
            logger.info(f"Admin {request.user.username} ran prediction for input {production_input.id}")
            
            return Response({
                'message': 'Prediction generated successfully',
                'output': ProductionOutputSerializer(production_output).data,
                'execution_time_ms': execution_time_ms
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error running prediction: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to run prediction', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a prediction result.
        """
        try:
            production_input = self.get_object()
            
            try:
                production_output = production_input.output
            except ProductionOutput.DoesNotExist:
                return Response(
                    {'error': 'No prediction exists for this input. Run prediction first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if production_output.is_approved:
                return Response(
                    {'message': 'Prediction is already approved'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Approve the prediction
            production_output.is_approved = True
            production_output.approved_at = timezone.now()
            production_output.processed_by = request.user
            production_output.status = 'Approved'
            production_output.save()
            
            # Update PredictionHistory to mark as approved (for RL feedback loop)
            PredictionHistory.objects.filter(
                production_output=production_output
            ).update(was_approved=True)
            
            logger.info(f"Admin {request.user.username} approved prediction {production_output.id}")
            
            return Response({
                'message': 'Prediction approved successfully',
                'output': ProductionOutputSerializer(production_output).data
            })
            
        except Exception as e:
            logger.error(f"Error approving prediction: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to approve prediction', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a prediction result.
        """
        try:
            production_input = self.get_object()
            
            try:
                production_output = production_input.output
            except ProductionOutput.DoesNotExist:
                return Response(
                    {'error': 'No prediction exists for this input'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark as rejected
            production_output.is_approved = False
            production_output.processed_by = request.user
            production_output.status = 'Rejected'
            production_output.save()
            
            logger.info(f"Admin {request.user.username} rejected prediction {production_output.id}")
            
            return Response({
                'message': 'Prediction rejected successfully',
                'output': ProductionOutputSerializer(production_output).data
            })
            
        except Exception as e:
            logger.error(f"Error rejecting prediction: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to reject prediction', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get prediction statistics for admin dashboard.
        """
        try:
            total_inputs = ProductionInput.objects.count()
            total_outputs = ProductionOutput.objects.count()
            
            pending_count = ProductionOutput.objects.filter(status='Pending').count()
            processing_count = ProductionOutput.objects.filter(status='Processing').count()
            approved_count = ProductionOutput.objects.filter(status='Approved').count()
            rejected_count = ProductionOutput.objects.filter(status='Rejected').count()
            
            # Inputs without predictions
            inputs_without_predictions = total_inputs - total_outputs
            
            stats = {
                'total_inputs': total_inputs,
                'total_predictions': total_outputs,
                'inputs_without_predictions': inputs_without_predictions,
                'by_status': {
                    'pending': pending_count,
                    'processing': processing_count,
                    'approved': approved_count,
                    'rejected': rejected_count,
                }
            }
            
            return Response(stats)
            
        except Exception as e:
            logger.error(f"Error fetching prediction statistics: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
