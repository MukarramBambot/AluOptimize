from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
import logging

from .serializers import UserSerializer, CustomTokenObtainPairSerializer
from .permissions import IsAdmin, IsStaff

User = get_user_model()
logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that handles all role authentication.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:
                # Add user info to response
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    user = serializer.user
                    response.data['user'] = {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email or '',
                        'is_superuser': user.is_superuser,
                        'is_staff': user.is_staff,
                        'role': 'admin' if user.is_superuser else 'staff' if user.is_staff else 'user'
                    }
            return response
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {'detail': 'Invalid username or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer

    def get_permissions(self):
        """Custom permissions based on action.
        - create: anyone can create users (public registration).
        - other actions: staff (including admin) can access.
        """
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsStaff]
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

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """
    Register a new user.
    """
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
