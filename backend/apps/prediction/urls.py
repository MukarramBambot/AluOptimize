from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
	ProductionInputViewSet,
	ProductionOutputViewSet,
	PredictionLogViewSet
)

app_name = 'prediction'

# Initialize the router
router = DefaultRouter()

# Register viewsets
router.register(r'inputs', ProductionInputViewSet)
router.register(r'outputs', ProductionOutputViewSet)
router.register(r'logs', PredictionLogViewSet)

urlpatterns = router.urls