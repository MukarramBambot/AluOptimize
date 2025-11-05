"""
Input-Specific Report Generation Views
Provides endpoints for generating detailed PDF reports for specific prediction inputs
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.core.mail import EmailMessage
from django.conf import settings

from backend.apps.prediction.models import ProductionInput, ProductionOutput
from backend.apps.waste.models import WasteManagement, WasteRecommendation
from backend.apps.core.input_pdf_generator import InputReportPDFGenerator

import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class InputReportViewSet(viewsets.ViewSet):
    """
    Admin-only viewset for generating input-specific PDF reports
    """
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'], url_path='users')
    def get_users(self, request):
        """
        Get list of non-admin users
        GET /api/reports/users/
        """
        try:
            # Exclude admin and staff users
            users = User.objects.filter(
                is_staff=False,
                is_superuser=False,
                is_active=True
            ).values('id', 'username', 'email', 'date_joined')
            
            users_list = list(users)
            
            logger.info(f"Admin {request.user.username} retrieved {len(users_list)} non-admin users")
            
            return Response({
                'success': True,
                'count': len(users_list),
                'users': users_list
            })
            
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch users', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='inputs')
    def get_user_inputs(self, request, pk=None):
        """
        Get all prediction inputs for a specific user
        GET /api/reports/user/<user_id>/inputs/
        """
        try:
            user_id = pk
            
            # Verify user exists and is not admin
            try:
                user = User.objects.get(id=user_id, is_staff=False, is_superuser=False)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found or is an admin'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get all inputs submitted by this user
            inputs = ProductionInput.objects.filter(
                submitted_by=user
            ).select_related('submitted_by').order_by('-created_at')
            
            inputs_data = []
            for inp in inputs:
                # Check if there's an output for this input
                has_output = ProductionOutput.objects.filter(input_data=inp).exists()
                
                inputs_data.append({
                    'id': inp.id,
                    'production_line': inp.production_line,
                    'feed_rate': inp.feed_rate,
                    'temperature': inp.temperature,
                    'pressure': inp.pressure,
                    'power_consumption': inp.power_consumption,
                    'bath_ratio': inp.bath_ratio,
                    'alumina_concentration': inp.alumina_concentration,
                    'anode_effect': inp.anode_effect,
                    'created_at': inp.created_at.isoformat() if inp.created_at else None,
                    'has_output': has_output,
                })
            
            logger.info(f"Admin {request.user.username} retrieved {len(inputs_data)} inputs for user {user.username}")
            
            return Response({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                },
                'count': len(inputs_data),
                'inputs': inputs_data
            })
            
        except Exception as e:
            logger.error(f"Error fetching user inputs: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch user inputs', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_report(self, request):
        """
        Generate detailed PDF report for a specific input
        POST /api/reports/generate/
        Body: {
            "input_id": <id>,
            "email_to_user": true/false,
            "download": true/false
        }
        """
        try:
            input_id = request.data.get('input_id')
            email_to_user = request.data.get('email_to_user', False)
            download = request.data.get('download', False)
            
            if not input_id:
                return Response(
                    {'error': 'input_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the input
            try:
                production_input = ProductionInput.objects.select_related('submitted_by').get(id=input_id)
            except ProductionInput.DoesNotExist:
                return Response(
                    {'error': 'Input not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verify user is not admin
            if production_input.submitted_by.is_staff or production_input.submitted_by.is_superuser:
                return Response(
                    {'error': 'Cannot generate reports for admin users'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = production_input.submitted_by
            
            # Prepare user data
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
            
            # Prepare input data
            input_data = {
                'id': production_input.id,
                'production_line': production_input.production_line,
                'feed_rate': production_input.feed_rate,
                'temperature': production_input.temperature,
                'pressure': production_input.pressure,
                'power_consumption': production_input.power_consumption,
                'bath_ratio': production_input.bath_ratio,
                'alumina_concentration': production_input.alumina_concentration,
                'anode_effect': production_input.anode_effect,
                'created_at': production_input.created_at,
            }
            
            # Get output data (if exists)
            output_data = None
            try:
                output = ProductionOutput.objects.get(input_data=production_input)
                output_data = {
                    'id': output.id,
                    'predicted_output': output.predicted_output,
                    'energy_efficiency': output.energy_efficiency,
                    'output_quality': output.output_quality,
                    'waste_estimate': output.waste_estimate,
                    'status': output.status,
                    'is_approved': output.is_approved,
                    'reward': output.reward,
                }
            except ProductionOutput.DoesNotExist:
                pass
            
            # Get waste data (if exists) - get the most recent one
            waste_data = None
            waste_obj = None
            try:
                waste = WasteManagement.objects.filter(production_input=production_input).order_by('-date_recorded').first()
                if waste:
                    waste_obj = waste
                    waste_data = {
                        'id': waste.id,
                        'waste_type': waste.waste_type,
                        'waste_amount': waste.waste_amount,
                        'unit': waste.unit,
                        'production_line': waste.production_line,
                        'reuse_possible': waste.reuse_possible,
                        'date_recorded': waste.date_recorded,
                    }
            except Exception:
                pass
            
            # Get recommendation data (if exists)
            recommendation_data = None
            if waste_obj:
                try:
                    recommendation = WasteRecommendation.objects.filter(waste_record=waste_obj).first()
                    if recommendation:
                        recommendation_data = {
                            'id': recommendation.id,
                            'recommendation_text': recommendation.recommendation_text,
                            'estimated_savings': recommendation.estimated_savings,
                            'ai_generated': recommendation.ai_generated,
                        }
                except Exception:
                    pass
            
            # Generate PDF
            pdf_generator = InputReportPDFGenerator()
            pdf_buffer = pdf_generator.generate_input_report(
                user_data=user_data,
                input_data=input_data,
                output_data=output_data,
                waste_data=waste_data,
                recommendation_data=recommendation_data
            )
            
            # Email if requested
            email_sent = False
            email_error = None
            if email_to_user:
                try:
                    email = EmailMessage(
                        subject=f'AluOptimize Production Report - Input #{input_id}',
                        body=f"""Dear {user.username},

Your detailed production report for Input #{input_id} has been generated by {request.user.username}.

This report contains comprehensive information about your aluminum production optimization data including:
- Input parameters
- Prediction results
- Waste management data
- AI-generated recommendations
- Performance metrics

Please find the PDF report attached to this email.

If you have any questions about this report, please contact your administrator.

Best regards,
AluOptimize Team

---
This is an automated email. Please do not reply to this message.
""",
                        from_email=settings.EMAIL_HOST_USER,
                        to=[user.email],
                    )
                    
                    pdf_buffer.seek(0)
                    email.attach(
                        f'aluoptimize_report_input_{input_id}.pdf',
                        pdf_buffer.read(),
                        'application/pdf'
                    )
                    
                    email.send(fail_silently=False)
                    email_sent = True
                    
                    logger.info(f"Report for input {input_id} emailed to {user.email} by admin {request.user.username}")
                    
                except Exception as e:
                    email_error = str(e)
                    logger.error(f"Error sending email: {email_error}", exc_info=True)
            
            # Download if requested
            if download:
                pdf_buffer.seek(0)
                response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="aluoptimize_report_input_{input_id}.pdf"'
                
                logger.info(f"Report for input {input_id} downloaded by admin {request.user.username}")
                
                return response
            
            # Return success response
            response_data = {
                'success': True,
                'message': f'✅ Report generated successfully for Input #{input_id}!',
                'input_id': input_id,
                'user': {
                    'username': user.username,
                    'email': user.email,
                },
                'has_output': output_data is not None,
                'has_waste': waste_data is not None,
                'has_recommendation': recommendation_data is not None,
            }
            
            if email_to_user:
                if email_sent:
                    response_data['message'] = f'✅ Report generated and emailed to {user.email}!'
                    response_data['email_sent'] = True
                else:
                    response_data['message'] = f'⚠️ Report generated but email failed: {email_error}'
                    response_data['email_sent'] = False
                    response_data['email_error'] = email_error
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to generate report', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
