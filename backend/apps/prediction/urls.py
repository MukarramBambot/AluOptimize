from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
	ProductionInputViewSet,
	ProductionOutputViewSet,
	PredictionLogViewSet,
	PendingRequestsViewSet,
	PredictionViewSet,
	UserPredictionViewSet
)

app_name = 'prediction'

# Initialize the router
router = DefaultRouter()

# Register viewsets
router.register(r'inputs', ProductionInputViewSet)
router.register(r'outputs', ProductionOutputViewSet)
router.register(r'logs', PredictionLogViewSet)
router.register(r'pending', PendingRequestsViewSet)
router.register(r'predictions', PredictionViewSet)
router.register(r'user', UserPredictionViewSet, basename='user-prediction')

urlpatterns = router.urls