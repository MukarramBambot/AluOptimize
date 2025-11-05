"""
Health check endpoints for AluOptimize backend.
Provides root welcome endpoint and detailed health status endpoint.
"""

import logging
from typing import Dict, Any
from django.conf import settings
from django.db import connections
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

logger = logging.getLogger(__name__)

def check_database_connection() -> Dict[str, str]:
    """
    Check if database connection is working.
    Returns status dict without raising exceptions.
    """
    try:
        with connections['default'].cursor() as cursor:
            cursor.execute('SELECT 1')
            return {'status': 'online', 'type': connections['default'].vendor}
    except Exception as e:
        logger.warning(f"Database health check failed: {str(e)}")
        return {'status': 'offline', 'error': str(e)}

class WelcomeView(APIView):
    """Root endpoint returning welcome message."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Return simple welcome message."""
        return Response({
            'status': 'success',
            'message': 'AluOptimize Backend is Running'
        })

class HealthCheckView(APIView):
    """
    Detailed health check endpoint.
    Shows application status, configuration, and dependency health.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Return detailed health status."""
        database = check_database_connection()
        
        return Response({
            'app_name': 'AluOptimize',
            'status': 'online',
            'debug_mode': settings.DEBUG,
            'database': database,
            'installed_apps': [
                app for app in settings.INSTALLED_APPS 
                if app.startswith('backend.apps.')
            ]
        })