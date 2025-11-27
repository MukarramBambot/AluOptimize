from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, CustomTokenObtainPairView, register_user

app_name = 'authapp'

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    # JWT token endpoints - using custom view to check for inactive users
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Registration endpoint
    path('register/', register_user, name='register'),
    
    path('', include(router.urls)),
]