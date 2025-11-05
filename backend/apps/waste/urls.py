from rest_framework.routers import DefaultRouter
from .views import WasteManagementViewSet, WasteRecommendationViewSet

app_name = 'waste'

router = DefaultRouter()
router.register(r'management', WasteManagementViewSet, basename='waste-management')
router.register(r'recommendations', WasteRecommendationViewSet, basename='waste-recommendation')

urlpatterns = router.urls