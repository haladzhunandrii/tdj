from django.urls import path
from .views import SearchView, ClearCacheView

urlpatterns = [
    path("search/", SearchView.as_view(), name="search"),
    path("clear-cache/", ClearCacheView.as_view(), name="clear-cache"),
]