from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

class WelcomeView(APIView):
    def get(self, request):
        return Response({
            'message': 'Welcome to AluOptimize API',
            'status': 'online',
            'timestamp': timezone.now()
        })

class HealthCheckView(APIView):
    def get(self, request):
        return Response({
            'status': 'healthy',
            'timestamp': timezone.now(),
            'service': 'AluOptimize Backend'
        })
