"""
URL configuration for admin API endpoints.
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminDashboardViewSet,
    AdminUserManagementViewSet,
    AdminPredictionManagementViewSet,
)
from .report_views import AdminReportViewSet
from .input_report_views import InputReportViewSet
from backend.apps.prediction.admin_views import AdminPredictionControlViewSet

router = DefaultRouter()
router.register(r'dashboard', AdminDashboardViewSet, basename='admin-dashboard')
router.register(r'users', AdminUserManagementViewSet, basename='admin-users')
router.register(r'predictions', AdminPredictionManagementViewSet, basename='admin-predictions')
router.register(r'prediction-control', AdminPredictionControlViewSet, basename='admin-prediction-control')
router.register(r'reports', AdminReportViewSet, basename='admin-reports')
router.register(r'input-reports', InputReportViewSet, basename='input-reports')

urlpatterns = router.urls
