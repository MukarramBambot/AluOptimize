from django.urls import path
from .staff_views import (
    StaffDashboardView,
    StaffUsersView,
    StaffUserCreateView,
    StaffUserApproveView,
    StaffUserRejectView,
    StaffPredictionsView,
    StaffWasteRecommendationsView,
    StaffInputReportsView,
)

urlpatterns = [
    path('dashboard/', StaffDashboardView.as_view(), name='staff-dashboard'),
    path('users/', StaffUsersView.as_view(), name='staff-users'),
    path('users/create/', StaffUserCreateView.as_view(), name='staff-user-create'),
    path('users/<int:user_id>/approve/', StaffUserApproveView.as_view(), name='staff-user-approve'),
    path('users/<int:user_id>/reject/', StaffUserRejectView.as_view(), name='staff-user-reject'),
    path('predictions/', StaffPredictionsView.as_view(), name='staff-predictions'),
    path('waste/recommendations/', StaffWasteRecommendationsView.as_view(), name='staff-waste-recommendations'),
    path('input-reports/users/', StaffInputReportsView.as_view(), {'action': 'users'}, name='staff-reports-users'),
    path('input-reports/<int:user_id>/inputs/', StaffInputReportsView.as_view(), {'action': 'inputs'}, name='staff-reports-inputs'),
    path('input-reports/generate/', StaffInputReportsView.as_view(), {'action': 'generate'}, name='staff-reports-generate'),
]
