from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from datetime import timedelta
import logging

from backend.apps.prediction.models import ProductionInput, ProductionOutput
from backend.apps.waste.models import WasteManagement, WasteRecommendation
from backend.apps.prediction.serializers import ProductionOutputSerializer, ProductionInputSerializer
from backend.apps.waste.serializers import WasteRecommendationSerializer

User = get_user_model()
logger = logging.getLogger(__name__)

class IsStaff(permissions.BasePermission):
    """Allow access to staff users only."""
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class StaffDashboardView(views.APIView):
    """
    API view for staff dashboard overview.
    """
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request):
        try:
            # Get counts
            total_users = User.objects.filter(is_staff=False, is_superuser=False).count()
            pending_requests = ProductionInput.objects.filter(status='pending').count()
            
            # Get recent activity (last 5 approved predictions)
            recent_predictions = ProductionOutput.objects.select_related('input_data', 'processed_by').order_by('-created_at')[:5]
            
            # Calculate stats
            total_predictions = ProductionOutput.objects.count()
            avg_efficiency = ProductionOutput.objects.aggregate(Avg('energy_efficiency'))['energy_efficiency__avg'] or 0
            
            # Format recent activity
            activity_data = []
            for pred in recent_predictions:
                activity_data.append({
                    'id': pred.id,
                    'type': 'prediction',
                    'description': f"Prediction for {pred.input_data.production_line}",
                    'user': pred.input_data.created_by.username,
                    'status': pred.status,
                    'date': pred.created_at
                })
                
            return Response({
                'stats': {
                    'total_users': total_users,
                    'pending_requests': pending_requests,
                    'total_predictions': total_predictions,
                    'avg_efficiency': round(avg_efficiency, 2)
                },
                'recent_activity': activity_data
            })
        except Exception as e:
            logger.error(f"Error fetching staff dashboard data: {str(e)}")
            return Response(
                {'error': 'Failed to fetch dashboard data'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StaffUsersView(views.APIView):
    """
    API view for managing users (staff view).
    """
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request):
        try:
            users = User.objects.filter(is_staff=False, is_superuser=False).select_related('profile')
            user_data = []
            
            for user in users:
                # Get user stats
                input_count = ProductionInput.objects.filter(created_by=user).count()
                last_active = user.last_login
                
                user_data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'date_joined': user.date_joined,
                    'last_active': last_active,
                    'input_count': input_count,
                    'status': 'Active' if user.is_active else 'Inactive'
                })
                
            return Response(user_data)
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            return Response(
                {'error': 'Failed to fetch users'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StaffUserCreateView(views.APIView):
    """
    API view for creating new users.
    """
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def post(self, request):
        try:
            data = request.data
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            
            if not all([username, email, password]):
                return Response(
                    {'error': 'All fields are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if User.objects.filter(username=username).exists():
                return Response(
                    {'error': 'Username already exists'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            return Response({
                'message': 'User created successfully',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            return Response(
                {'error': 'Failed to create user'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StaffUserApproveView(views.APIView):
    """
    API view for approving pending users (if applicable).
    """
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = True
            user.save()
            return Response({'message': f'User {user.username} approved'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class StaffUserRejectView(views.APIView):
    """
    API view for rejecting/deactivating users.
    """
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = False
            user.save()
            return Response({'message': f'User {user.username} deactivated'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class StaffPredictionsView(views.APIView):
    """
    API view for viewing all predictions.
    """
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request):
        try:
            predictions = ProductionOutput.objects.select_related(
                'input_data', 
                'input_data__created_by',
                'processed_by',
                'waste_record',
                'recommendation'
            ).all().order_by('-created_at')
            
            # Use the serializer instead of manual construction
            serializer = ProductionOutputSerializer(predictions, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching predictions: {str(e)}")
            return Response(
                {'error': 'Failed to fetch predictions'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StaffWasteRecommendationsView(views.APIView):
    """
    API view for viewing all waste recommendations.
    """
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request):
        try:
            recommendations = WasteRecommendation.objects.select_related(
                'waste_record',
                'waste_record__production_input',
                'waste_record__production_input__created_by'
            ).all().order_by('-created_at')
            
            serializer = WasteRecommendationSerializer(recommendations, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching recommendations: {str(e)}")
            return Response(
                {'error': 'Failed to fetch recommendations'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StaffInputReportsView(views.APIView):
    """
    API view for input reports.
    """
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request, action=None, user_id=None):
        try:
            if action == 'users':
                # Return users with input stats
                users = User.objects.filter(is_staff=False).annotate(
                    input_count=Count('production_inputs')
                )
                data = [{
                    'id': u.id, 
                    'username': u.username, 
                    'email': u.email,
                    'input_count': u.input_count
                } for u in users]
                return Response({'success': True, 'users': data})
                
            elif action == 'inputs' and user_id:
                # Return inputs for specific user
                inputs = ProductionInput.objects.filter(created_by_id=user_id).order_by('-created_at')
                
                # Check for outputs
                data = []
                for inp in inputs:
                    has_output = ProductionOutput.objects.filter(input_data=inp).exists()
                    data.append({
                        'id': inp.id,
                        'production_line': inp.production_line,
                        'created_at': inp.created_at,
                        'has_output': has_output,
                        'feed_rate': inp.feed_rate,
                        'temperature': inp.temperature
                    })
                    
                return Response({'success': True, 'inputs': data})
                
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error in input reports: {str(e)}")
            return Response(
                {'error': 'Failed to process report request', 'details': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, action=None):
        """Handle report generation"""
        if action == 'generate':
            try:
                input_id = request.data.get('input_id')
                email_to_user = request.data.get('email_to_user', False)
                download = request.data.get('download', False)
                
                if not input_id:
                    return Response({'error': 'Input ID is required'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Fetch data
                try:
                    production_input = ProductionInput.objects.get(id=input_id)
                except ProductionInput.DoesNotExist:
                    return Response({'error': 'Production Input not found'}, status=status.HTTP_404_NOT_FOUND)
                
                production_output = ProductionOutput.objects.filter(input_data=production_input).first()
                waste_record = WasteManagement.objects.filter(production_input=production_input).first()
                
                recommendations = []
                if waste_record:
                    recommendations = WasteRecommendation.objects.filter(waste_record=waste_record)
                
                # Generate PDF
                from .utils.report_generator import ReportGenerator
                generator = ReportGenerator()
                pdf_buffer = generator.generate_input_report(
                    production_input, 
                    production_output, 
                    waste_record, 
                    recommendations
                )
                
                # Handle Email
                email_sent = False
                email_error = None
                
                if email_to_user:
                    try:
                        from django.core.mail import EmailMessage
                        
                        user_email = production_input.created_by.email
                        if user_email:
                            email = EmailMessage(
                                subject=f'AluOptimize Production Report - Input #{production_input.id}',
                                body=f'Dear {production_input.created_by.username},\n\nPlease find attached the production report for Input #{production_input.id}.\n\nBest regards,\nAluOptimize Team',
                                to=[user_email]
                            )
                            email.attach(f'report_input_{production_input.id}.pdf', pdf_buffer.getvalue(), 'application/pdf')
                            email.send()
                            email_sent = True
                        else:
                            email_error = "User has no email address"
                    except Exception as e:
                        logger.error(f"Failed to send email: {str(e)}")
                        email_error = str(e)
                
                # Handle Download
                if download:
                    from django.http import HttpResponse
                    response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                    response['Content-Disposition'] = f'attachment; filename="report_input_{production_input.id}.pdf"'
                    return response
                
                return Response({
                    'success': True, 
                    'message': 'Report generated successfully' + (' and emailed to user' if email_sent else ''),
                    'email_sent': email_sent,
                    'email_error': email_error
                })
                
            except Exception as e:
                logger.error(f"Error generating report: {str(e)}")
                return Response(
                    {'error': 'Failed to generate report', 'details': str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
