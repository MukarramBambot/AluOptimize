from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, CustomTokenObtainPairView, AdminTokenObtainPairView

app_name = 'authapp'

urlpatterns = [
    # JWT token endpoints - using custom view to check for inactive users
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin login endpoint - only for staff/superuser accounts
    path('admin-token/', AdminTokenObtainPairView.as_view(), name='admin_token_obtain_pair'),
    
    # User endpoints
    path('users/', UserViewSet.as_view({'get': 'list', 'post': 'create'}), name='user-list'),
    path('users/<int:pk>/', UserViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='user-detail'),
]