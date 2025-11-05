"""
Admin-specific API views for user management, data approval, and reporting.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import logging

from backend.apps.authapp.serializers import UserSerializer
from backend.apps.prediction.models import ProductionInput, ProductionOutput
from backend.apps.prediction.serializers import ProductionInputSerializer, ProductionOutputSerializer
from backend.apps.core.models import Transaction
from backend.apps.core.serializers import TransactionSerializer, TransactionCreateSerializer
from django.utils import timezone
import uuid

User = get_user_model()
logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin/staff users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


class AdminDashboardViewSet(viewsets.ViewSet):
    """
    Admin dashboard statistics and overview.
    """
    permission_classes = [IsAdminUser]
    
    def list(self, request):
        """Get dashboard statistics"""
        try:
            # User statistics
            total_users = User.objects.count()
            pending_users = User.objects.filter(is_active=False).count()
            active_users = User.objects.filter(is_active=True).count()
            
            # Prediction statistics
            total_predictions = ProductionOutput.objects.count()
            today = timezone.now().date()
            week_ago = today - timedelta(days=7)
            predictions_this_week = ProductionOutput.objects.filter(
                created_at__date__gte=week_ago
            ).count()
            
            # Recent activity
            recent_users = User.objects.order_by('-date_joined')[:5].values(
                'id', 'username', 'email', 'is_active', 'date_joined'
            )
            
            recent_predictions = ProductionOutput.objects.select_related('input_data').order_by('-created_at')[:5]
            recent_predictions_data = ProductionOutputSerializer(recent_predictions, many=True).data
            
            stats = {
                'users': {
                    'total': total_users,
                    'pending': pending_users,
                    'active': active_users,
                },
                'predictions': {
                    'total': total_predictions,
                    'this_week': predictions_this_week,
                },
                'recent_activity': {
                    'users': list(recent_users),
                    'predictions': recent_predictions_data,
                }
            }
            
            logger.info(f"Admin dashboard accessed by {request.user.username}")
            return Response(stats)
            
        except Exception as e:
            logger.error(f"Error fetching admin dashboard stats: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch dashboard statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminUserManagementViewSet(viewsets.ModelViewSet):
    """
    Admin user management - approve, reject, manage users.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def list(self, request):
        """List all users with filtering options"""
        filter_status = request.query_params.get('status', None)
        
        queryset = self.queryset
        if filter_status == 'pending':
            queryset = queryset.filter(is_active=False)
        elif filter_status == 'active':
            queryset = queryset.filter(is_active=True)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a user account"""
        try:
            user = self.get_object()
            
            if user.is_active:
                return Response(
                    {'message': 'User is already active'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.is_active = True
            user.save()
            
            logger.info(f"User {user.username} approved by admin {request.user.username}")
            
            # TODO: Send email notification to user
            # send_approval_email(user)
            
            return Response({
                'message': f'User {user.username} has been approved',
                'user': self.get_serializer(user).data
            })
            
        except Exception as e:
            logger.error(f"Error approving user: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to approve user'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject/deactivate a user account"""
        try:
            user = self.get_object()
            
            user.is_active = False
            user.save()
            
            logger.info(f"User {user.username} rejected by admin {request.user.username}")
            
            return Response({
                'message': f'User {user.username} has been deactivated'
            })
            
        except Exception as e:
            logger.error(f"Error rejecting user: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to reject user'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        """Approve multiple users at once"""
        try:
            user_ids = request.data.get('user_ids', [])
            
            if not user_ids:
                return Response(
                    {'error': 'No user IDs provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            updated = User.objects.filter(id__in=user_ids, is_active=False).update(is_active=True)
            
            logger.info(f"{updated} users approved by admin {request.user.username}")
            
            return Response({
                'message': f'{updated} user(s) approved successfully',
                'count': updated
            })
            
        except Exception as e:
            logger.error(f"Error in bulk approval: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to approve users'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminPredictionManagementViewSet(viewsets.ModelViewSet):
    """
    Admin prediction management - view, approve, charge users.
    """
    queryset = ProductionOutput.objects.select_related('input_data', 'input_data__submitted_by').all()
    serializer_class = ProductionOutputSerializer
    permission_classes = [IsAdminUser]
    
    def list(self, request):
        """List all predictions with filtering"""
        queryset = self.queryset.order_by('-created_at')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark a prediction as paid"""
        try:
            prediction = self.get_object()
            
            # Add paid status to input_data metadata
            input_data = prediction.input_data
            # You can add a payment_status field to the model or use a separate Payment model
            
            logger.info(f"Prediction {prediction.id} marked as paid by admin {request.user.username}")
            
            return Response({
                'message': f'Prediction {prediction.id} marked as paid',
                'prediction': self.get_serializer(prediction).data
            })
            
        except Exception as e:
            logger.error(f"Error marking prediction as paid: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to mark as paid'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def generate_report(self, request, pk=None):
        """Generate PDF report for a prediction"""
        try:
            prediction = self.get_object()
            
            # Return report data (PDF generation will be done in frontend or separate service)
            report_data = {
                'prediction_id': prediction.id,
                'user': {
                    'username': prediction.input_data.submitted_by.username if prediction.input_data.submitted_by else 'N/A',
                    'email': prediction.input_data.submitted_by.email if prediction.input_data.submitted_by else 'N/A',
                },
                'input_parameters': {
                    'production_line': prediction.input_data.production_line,
                    'temperature': prediction.input_data.temperature,
                    'pressure': prediction.input_data.pressure,
                    'feed_rate': prediction.input_data.feed_rate,
                    'power_consumption': prediction.input_data.power_consumption,
                    'anode_effect': prediction.input_data.anode_effect,
                    'bath_ratio': prediction.input_data.bath_ratio,
                    'alumina_concentration': prediction.input_data.alumina_concentration,
                },
                'predictions': {
                    'predicted_output': prediction.predicted_output,
                    'energy_efficiency': prediction.energy_efficiency,
                    'output_quality': prediction.output_quality,
                },
                'timestamp': prediction.created_at,
                'admin_signature': f'Approved by: {request.user.username}',
            }
            
            logger.info(f"Report generated for prediction {prediction.id} by admin {request.user.username}")
            
            return Response(report_data)
            
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to generate report'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminTransactionViewSet(viewsets.ModelViewSet):
    """
    Admin transaction management - view, create, update transactions.
    """
    queryset = Transaction.objects.select_related('user', 'prediction_output', 'processed_by').all()
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TransactionCreateSerializer
        return TransactionSerializer
    
    def list(self, request):
        """List all transactions with filtering"""
        status_filter = request.query_params.get('status', None)
        user_id = request.query_params.get('user_id', None)
        
        queryset = self.queryset.order_by('-created_at')
        
        if status_filter:
            queryset = queryset.filter(payment_status=status_filter)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark a transaction as paid"""
        try:
            transaction = self.get_object()
            
            transaction.payment_status = 'paid'
            transaction.processed_by = request.user
            transaction.processed_at = timezone.now()
            transaction.save()
            
            logger.info(f"Transaction {transaction.id} marked as paid by {request.user.username}")
            
            return Response({
                'message': f'Transaction {transaction.id} marked as paid',
                'transaction': TransactionSerializer(transaction).data
            })
            
        except Exception as e:
            logger.error(f"Error marking transaction as paid: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to mark transaction as paid'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Refund a transaction"""
        try:
            transaction = self.get_object()
            
            if transaction.payment_status != 'paid':
                return Response(
                    {'error': 'Only paid transactions can be refunded'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            transaction.payment_status = 'refunded'
            transaction.processed_by = request.user
            transaction.processed_at = timezone.now()
            transaction.notes += f"\nRefunded by {request.user.username} on {timezone.now()}"
            transaction.save()
            
            logger.info(f"Transaction {transaction.id} refunded by {request.user.username}")
            
            return Response({
                'message': f'Transaction {transaction.id} refunded successfully',
                'transaction': TransactionSerializer(transaction).data
            })
            
        except Exception as e:
            logger.error(f"Error refunding transaction: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to refund transaction'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get transaction statistics"""
        try:
            from django.db.models import Sum, Count
            
            total_transactions = Transaction.objects.count()
            total_revenue = Transaction.objects.filter(
                payment_status='paid'
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            pending_count = Transaction.objects.filter(payment_status='pending').count()
            paid_count = Transaction.objects.filter(payment_status='paid').count()
            failed_count = Transaction.objects.filter(payment_status='failed').count()
            
            stats = {
                'total_transactions': total_transactions,
                'total_revenue': float(total_revenue),
                'pending_count': pending_count,
                'paid_count': paid_count,
                'failed_count': failed_count,
                'by_type': list(Transaction.objects.values('transaction_type').annotate(
                    count=Count('id'),
                    total=Sum('amount')
                ))
            }
            
            return Response(stats)
            
        except Exception as e:
            logger.error(f"Error fetching transaction statistics: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
