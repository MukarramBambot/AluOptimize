"""
Admin report generation views with PDF and email functionality
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.http import HttpResponse
import logging

from backend.apps.prediction.models import ProductionOutput
from backend.apps.waste.models import WasteManagement, WasteRecommendation
from .pdf_generator import AluOptimizePDFReport
from .email_utils import send_pdf_report_email

User = get_user_model()
logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin/staff users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


class AdminReportViewSet(viewsets.ViewSet):
    """
    Admin-only report generation with PDF and email functionality.
    """
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['post'])
    def generate_users_report(self, request):
        """
        Generate users report PDF and optionally email it.
        
        POST body:
        {
            "email_to_user": true/false,
            "user_id": 123,  # Required if email_to_user is true
            "download": true/false  # Whether admin wants to download
        }
        """
        try:
            email_to_user = request.data.get('email_to_user', False)
            user_id = request.data.get('user_id')
            download = request.data.get('download', False)
            
            # Fetch users data
            users = User.objects.all().values(
                'id', 'username', 'email', 'is_active', 'is_staff', 'date_joined'
            )
            users_list = list(users)
            
            # Generate PDF
            pdf_gen = AluOptimizePDFReport()
            pdf_buffer = pdf_gen.generate_users_report(users_list)
            
            result = {
                'success': True,
                'message': 'Report generated successfully',
                'report_type': 'users',
                'total_records': len(users_list)
            }
            
            # Email to user if requested
            if email_to_user and user_id:
                try:
                    user = User.objects.get(id=user_id)
                    success, message = send_pdf_report_email(
                        recipient_email=user.email,
                        recipient_name=user.username,
                        pdf_buffer=pdf_buffer,
                        report_type='Users',
                        admin_name=request.user.username
                    )
                    
                    if success:
                        result['email_sent'] = True
                        result['email_recipient'] = user.email
                        result['message'] = f"✅ Report PDF generated and emailed to {user.email}!"
                        logger.info(f"Admin {request.user.username} generated and emailed users report to {user.email}")
                    else:
                        result['email_sent'] = False
                        result['email_error'] = message
                        result['message'] = f"Report generated but email failed: {message}"
                        
                except User.DoesNotExist:
                    result['email_sent'] = False
                    result['email_error'] = 'User not found'
            
            # Return PDF for download if requested
            if download:
                pdf_buffer.seek(0)
                response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
                response['Content-Disposition'] = 'attachment; filename="aluoptimize_users_report.pdf"'
                return response
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating users report: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to generate report', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def generate_predictions_report(self, request):
        """
        Generate predictions report PDF and optionally email it.
        
        POST body:
        {
            "email_to_user": true/false,
            "user_id": 123,  # Required if email_to_user is true
            "download": true/false
        }
        """
        try:
            email_to_user = request.data.get('email_to_user', False)
            user_id = request.data.get('user_id')
            download = request.data.get('download', False)
            
            # Fetch predictions data
            predictions = ProductionOutput.objects.select_related(
                'input_data', 'input_data__submitted_by'
            ).all().values(
                'id', 'predicted_output', 'energy_efficiency', 'output_quality',
                'is_approved', 'status', 'created_at',
                'input_data__production_line', 'input_data__submitted_by__username'
            )
            
            # Transform data for PDF
            predictions_list = []
            for pred in predictions:
                predictions_list.append({
                    'id': pred['id'],
                    'predicted_output': pred['predicted_output'],
                    'energy_efficiency': pred['energy_efficiency'],
                    'output_quality': pred['output_quality'],
                    'is_approved': pred['is_approved'],
                    'status': pred['status'],
                    'created_at': pred['created_at'].isoformat() if pred['created_at'] else None,
                    'input_data': {
                        'production_line': pred['input_data__production_line'],
                        'submitted_by': {
                            'username': pred['input_data__submitted_by__username']
                        }
                    }
                })
            
            # Generate PDF
            pdf_gen = AluOptimizePDFReport()
            pdf_buffer = pdf_gen.generate_predictions_report(predictions_list)
            
            result = {
                'success': True,
                'message': 'Report generated successfully',
                'report_type': 'predictions',
                'total_records': len(predictions_list)
            }
            
            # Email to user if requested
            if email_to_user and user_id:
                try:
                    user = User.objects.get(id=user_id)
                    success, message = send_pdf_report_email(
                        recipient_email=user.email,
                        recipient_name=user.username,
                        pdf_buffer=pdf_buffer,
                        report_type='Predictions',
                        admin_name=request.user.username
                    )
                    
                    if success:
                        result['email_sent'] = True
                        result['email_recipient'] = user.email
                        result['message'] = f"✅ Report PDF generated and emailed to {user.email}!"
                        logger.info(f"Admin {request.user.username} generated and emailed predictions report to {user.email}")
                    else:
                        result['email_sent'] = False
                        result['email_error'] = message
                        result['message'] = f"Report generated but email failed: {message}"
                        
                except User.DoesNotExist:
                    result['email_sent'] = False
                    result['email_error'] = 'User not found'
            
            # Return PDF for download if requested
            if download:
                pdf_buffer.seek(0)
                response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
                response['Content-Disposition'] = 'attachment; filename="aluoptimize_predictions_report.pdf"'
                return response
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating predictions report: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to generate report', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def generate_waste_report(self, request):
        """
        Generate waste management report PDF and optionally email it.
        
        POST body:
        {
            "email_to_user": true/false,
            "user_id": 123,  # Required if email_to_user is true
            "download": true/false
        }
        """
        try:
            email_to_user = request.data.get('email_to_user', False)
            user_id = request.data.get('user_id')
            download = request.data.get('download', False)
            
            # Fetch waste data
            waste_records = WasteManagement.objects.all().values(
                'id', 'waste_type', 'waste_amount', 'unit', 'production_line',
                'reuse_possible', 'date_recorded'
            )
            waste_list = list(waste_records)
            
            # Fetch recommendations
            recommendations = WasteRecommendation.objects.all().values(
                'id', 'recommendation_text', 'estimated_savings', 'ai_generated'
            )
            recommendations_list = list(recommendations)
            
            # Generate PDF
            pdf_gen = AluOptimizePDFReport()
            pdf_buffer = pdf_gen.generate_waste_report(waste_list, recommendations_list)
            
            result = {
                'success': True,
                'message': 'Report generated successfully',
                'report_type': 'waste',
                'total_waste_records': len(waste_list),
                'total_recommendations': len(recommendations_list)
            }
            
            # Email to user if requested
            if email_to_user and user_id:
                try:
                    user = User.objects.get(id=user_id)
                    success, message = send_pdf_report_email(
                        recipient_email=user.email,
                        recipient_name=user.username,
                        pdf_buffer=pdf_buffer,
                        report_type='Waste Management',
                        admin_name=request.user.username
                    )
                    
                    if success:
                        result['email_sent'] = True
                        result['email_recipient'] = user.email
                        result['message'] = f"✅ Report PDF generated and emailed to {user.email}!"
                        logger.info(f"Admin {request.user.username} generated and emailed waste report to {user.email}")
                    else:
                        result['email_sent'] = False
                        result['email_error'] = message
                        result['message'] = f"Report generated but email failed: {message}"
                        
                except User.DoesNotExist:
                    result['email_sent'] = False
                    result['email_error'] = 'User not found'
            
            # Return PDF for download if requested
            if download:
                pdf_buffer.seek(0)
                response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
                response['Content-Disposition'] = 'attachment; filename="aluoptimize_waste_report.pdf"'
                return response
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating waste report: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to generate report', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
