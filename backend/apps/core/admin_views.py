"""
Admin Panel API Views

Provides endpoints for admin dashboard functionality including:
- Dashboard statistics
- User management
- Prediction management
- System overview
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Avg, Sum, Count
from django.utils import timezone
from datetime import timedelta

from backend.apps.authapp.permissions import IsStaff
from backend.apps.authapp.serializers import UserSerializer
from backend.apps.prediction.models import ProductionOutput, ProductionInput
from backend.apps.waste.models import WasteManagement

User = get_user_model()


class AdminDashboardView(APIView):
    """
    Admin dashboard statistics endpoint.
    Returns overview stats for users, predictions, and waste.
    """
    permission_classes = [IsStaff]
    
    def get(self, request):
        try:
            # Gather user statistics
            users = User.objects.all()
            users_stats = {
                'total': users.count(),
                'pending': users.filter(is_active=False).count(),
                'active': users.filter(is_active=True).count(),
            }
            
            # Gather prediction statistics
            predictions = ProductionOutput.objects.all()
            one_week_ago = timezone.now() - timedelta(days=7)
            avg_efficiency = predictions.aggregate(Avg('energy_efficiency'))['energy_efficiency__avg']
            
            predictions_stats = {
                'total': predictions.count(),
                'this_week': predictions.filter(created_at__gte=one_week_ago).count(),
                'avg_efficiency': round(avg_efficiency, 2) if avg_efficiency else 0,
            }
            
            # Gather waste statistics
            waste = WasteManagement.objects.all()
            total_waste = waste.aggregate(Sum('waste_amount'))['waste_amount__sum']
            
            waste_stats = {
                'total_records': waste.count(),
                'total_amount': float(total_waste) if total_waste else 0,
                'reusable': waste.filter(reuse_possible=True).count(),
            }
            
            # Recent activity
            recent_users = users.order_by('-date_joined')[:5]
            recent_predictions = predictions.select_related('input_data').order_by('-created_at')[:5]
            
            recent_activity = {
                'users': UserSerializer(recent_users, many=True).data,
                'predictions': [
                    {
                        'id': pred.id,
                        'input_data': {
                            'production_line': pred.input_data.production_line if pred.input_data else None,
                        },
                        'predicted_output': pred.predicted_output,
                        'energy_efficiency': pred.energy_efficiency,
                        'created_at': pred.created_at,
                    }
                    for pred in recent_predictions
                ],
            }
            
            stats = {
                'users': users_stats,
                'predictions': predictions_stats,
                'waste': waste_stats,
                'recent_activity': recent_activity,
            }
            
            return Response(stats)
        except Exception as e:
            # Return empty stats if there's an error
            return Response({
                'users': {'total': 0, 'pending': 0, 'active': 0},
                'predictions': {'total': 0, 'this_week': 0, 'avg_efficiency': 0},
                'waste': {'total_records': 0, 'total_amount': 0, 'reusable': 0},
                'recent_activity': {'users': [], 'predictions': []}
            }, status=status.HTTP_200_OK)


class AdminUsersView(APIView):
    """
    Admin user management endpoint.
    GET: List all users with optional filtering
    """
    permission_classes = [IsStaff]
    
    def get(self, request):
        try:
            users = User.objects.all().order_by('-date_joined')
            
            # Filter by status if provided
            status_filter = request.query_params.get('status', None)
            if status_filter == 'pending':
                users = users.filter(is_active=False)
            elif status_filter == 'active':
                users = users.filter(is_active=True)
            
            serializer = UserSerializer(users, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Return empty list if there's an error
            return Response([], status=status.HTTP_200_OK)


class AdminUserApproveView(APIView):
    """
    Approve a pending user account.
    """
    permission_classes = [IsStaff]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = True
            user.save()
            return Response({'message': 'User approved successfully'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class AdminUserCreateView(APIView):
    """
    Create a new user with specific role.
    Only admins can access this.
    """
    permission_classes = [IsStaff]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'user')

        if not all([username, email, password]):
            return Response({'error': 'Username, email, and password are required'}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=400)

        try:
            # Create user
            user = User.objects.create_user(username=username, email=email, password=password)
            
            # Set flags based on role
            if role == 'admin':
                user.is_staff = True
                user.is_superuser = True
            elif role == 'staff':
                user.is_staff = True
                user.is_superuser = False
            else:
                user.is_staff = False
                user.is_superuser = False
            
            # Auto-activate users created by admin
            user.is_active = True
            user.save()

            # Update profile role
            # Profile is created by signal, so we just update it
            if hasattr(user, 'profile'):
                user.profile.role = role
                user.profile.save()
            else:
                # Fallback if signal didn't fire (shouldn't happen but good for safety)
                from backend.apps.authapp.models import UserProfile
                UserProfile.objects.create(user=user, role=role)

            return Response({
                'message': f'User {username} created successfully as {role}',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': role,
                    'is_active': user.is_active
                }
            }, status=201)

        except Exception as e:
            return Response({'error': str(e)}, status=500)


class AdminUserRejectView(APIView):
    """
    Deactivate a user account.
    """
    permission_classes = [IsStaff]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = False
            user.save()
            return Response({'message': 'User deactivated successfully'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminUserBulkApproveView(APIView):
    """
    Bulk approve multiple users.
    """
    permission_classes = [IsStaff]
    
    def post(self, request):
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids:
            return Response({'error': 'No user IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        updated_count = User.objects.filter(id__in=user_ids).update(is_active=True)
        
        return Response({
            'message': f'{updated_count} user(s) approved successfully',
            'count': updated_count
        }, status=status.HTTP_200_OK)

from .staff_views import StaffInputReportsView

class AdminInputReportsView(StaffInputReportsView):
    """
    Admin view for input reports.
    Inherits functionality from StaffInputReportsView.
    """
    pass
