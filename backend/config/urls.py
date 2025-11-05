"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/

This module includes automatic debug toolbar configuration when DEBUG=True,
with graceful fallback if the package is not installed.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from backend.apps.core.health import WelcomeView, HealthCheckView

# API endpoints
api_urlpatterns = [
    path('auth/', include('backend.apps.authapp.urls')),
    path('core/', include('backend.apps.core.urls')),
    path('prediction/', include('backend.apps.prediction.urls')),
    path('waste/', include('backend.apps.waste.urls')),
    path('admin-panel/', include('backend.apps.core.admin_urls')),  # Admin API endpoints
    path('health/', HealthCheckView.as_view(), name='api-health'),
    
    # JWT endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Main URL patterns
urlpatterns = [
    # Welcome endpoint at root
    path('', WelcomeView.as_view(), name='welcome'),
    
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API endpoints under /api/
    path('api/', include((api_urlpatterns, 'api'), namespace='api')),
]

# Configure development-only URLs
if settings.DEBUG:
    # Serve media files in development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Add debug toolbar URLs if available
    from .debug_utils import get_debug_patterns
    debug_urlpatterns, was_modified = get_debug_patterns(urlpatterns)
    if was_modified:
        urlpatterns = debug_urlpatterns
