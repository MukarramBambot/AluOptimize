from rest_framework.routers import DefaultRouter
from .views import UserRecommendationViewSet

app_name = 'recommendation'

router = DefaultRouter()
router.register(r'user', UserRecommendationViewSet, basename='user-recommendation')

urlpatterns = router.urls
