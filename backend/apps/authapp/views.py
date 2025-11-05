from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
import logging

from .serializers import UserSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom serializer to check if user is active before issuing tokens.
    """
    def validate(self, attrs):
        # First, authenticate the user
        data = super().validate(attrs)
        
        # Check if user is active
        if not self.user.is_active:
            logger.warning(f"Inactive user login attempt: {self.user.username}")
            raise serializers.ValidationError(
                {'detail': 'Account not approved by admin yet. Please wait for admin approval.'},
                code='account_inactive'
            )
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses our custom serializer.
    """
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """
        Override to allow user registration without authentication.
        """
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        """
        Update user password.
        """
        user = self.get_object()
        password = request.data.get('password')
        if not password:
            return Response({'error': 'Password is required'}, status=400)
        
        user.set_password(password)
        user.save()
        return Response({'status': 'password set'})
