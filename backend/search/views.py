import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiExample

from .serializers import SearchRequestSerializer, SearchResponseSerializer
from .services import search_github, clear_cache


class SearchView(APIView):

    @extend_schema(
        request=SearchRequestSerializer,
        responses={200: SearchResponseSerializer},
        description="Search GitHub users or repositories. Results are cached for 2 hours.",
        examples=[
            OpenApiExample(
                "Search repositories",
                value={"query": "django", "search_type": "repositories"},
                request_only=True,
            ),
            OpenApiExample(
                "Search users",
                value={"query": "torvalds", "search_type": "users"},
                request_only=True,
            ),
        ],
    )
    def post(self, request):
        serializer = SearchRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query = serializer.validated_data["query"]
        search_type = serializer.validated_data["search_type"]

        try:
            result = search_github(search_type, query)
            return Response(result, status=status.HTTP_200_OK)
        except requests.exceptions.Timeout:
            return Response(
                {"error": "GitHub API request timed out. Please try again."},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                return Response(
                    {"error": "GitHub API rate limit exceeded. Please try again later."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response(
                {"error": "GitHub API error. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except requests.exceptions.RequestException:
            return Response(
                {"error": "Failed to connect to GitHub API."},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class ClearCacheView(APIView):

    @extend_schema(
        responses={200: None},
        description="Clear all cached GitHub search results from Redis.",
    )
    def post(self, request):
        try:
            deleted_count = clear_cache()
            return Response(
                {"message": f"Cache cleared. {deleted_count} key(s) removed."},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"error": "Failed to clear cache."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )