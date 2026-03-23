from rest_framework.routers import DefaultRouter
from commodities.views import ComomodityViewSet

router = DefaultRouter()
router.register("commodities", ComomodityViewSet)

urlpatterns = router.urls