import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework.test import APIClient


# ─── fixtures ───────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def mock_repo_response():
    return {
        "total_count": 1,
        "items": [
            {
                "id": 1,
                "name": "django",
                "full_name": "django/django",
                "html_url": "https://github.com/django/django",
                "description": "The Web framework for perfectionists with deadlines.",
                "stargazers_count": 75000,
                "forks_count": 30000,
                "language": "Python",
                "updated_at": "2024-01-01T00:00:00Z",
                "owner": {
                    "login": "django",
                    "avatar_url": "https://avatars.githubusercontent.com/u/27804",
                },
            }
        ],
    }


@pytest.fixture
def mock_user_response():
    return {
        "total_count": 1,
        "items": [
            {
                "id": 1,
                "login": "torvalds",
                "avatar_url": "https://avatars.githubusercontent.com/u/1024025",
                "html_url": "https://github.com/torvalds",
                "type": "User",
            }
        ],
    }


# ─── service tests ───────────────────────────────────────────────────────────

class TestSearchService:

    @patch("search.services.cache")
    @patch("search.services.requests.get")
    def test_fetch_repositories_from_github(self, mock_get, mock_cache, mock_repo_response):
        mock_cache.get.return_value = None
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: mock_repo_response,
        )
        mock_get.return_value.raise_for_status = MagicMock()

        from search.services import search_github
        result = search_github("repositories", "django")

        assert result["search_type"] == "repositories"
        assert result["query"] == "django"
        assert result["cached"] is False
        assert len(result["results"]) == 1
        assert result["results"][0]["name"] == "django"
        mock_cache.set.assert_called_once()

    @patch("search.services.cache")
    @patch("search.services.requests.get")
    def test_fetch_users_from_github(self, mock_get, mock_cache, mock_user_response):
        mock_cache.get.return_value = None
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: mock_user_response,
        )
        mock_get.return_value.raise_for_status = MagicMock()

        from search.services import search_github
        result = search_github("users", "torvalds")

        assert result["search_type"] == "users"
        assert len(result["results"]) == 1
        assert result["results"][0]["login"] == "torvalds"

    @patch("search.services.cache")
    def test_returns_cached_result(self, mock_cache):
        cached_data = {
            "results": [],
            "total_count": 0,
            "cached": False,
            "search_type": "users",
            "query": "torvalds",
        }
        mock_cache.get.return_value = cached_data

        from search.services import search_github
        result = search_github("users", "torvalds")

        assert result["cached"] is True
        # GitHub не викликався — кеш спрацював
        mock_cache.set.assert_not_called()

    @patch("search.services.cache")
    def test_cache_key_is_lowercase(self, mock_cache):
        mock_cache.get.return_value = None

        from search.services import _cache_key
        key1 = _cache_key("users", "Django")
        key2 = _cache_key("users", "django")

        assert key1 == key2

    @patch("search.services.get_redis_connection")
    def test_clear_cache_deletes_keys(self, mock_redis_conn):
        mock_con = MagicMock()
        mock_con.keys.return_value = [b"github_search:users:django", b"github_search:repositories:django"]
        mock_redis_conn.return_value = mock_con

        from search.services import clear_cache
        deleted = clear_cache()

        assert deleted == 2
        mock_con.delete.assert_called_once()

    @patch("search.services.get_redis_connection")
    def test_clear_cache_no_keys(self, mock_redis_conn):
        mock_con = MagicMock()
        mock_con.keys.return_value = []
        mock_redis_conn.return_value = mock_con

        from search.services import clear_cache
        deleted = clear_cache()

        assert deleted == 0
        mock_con.delete.assert_not_called()


# ─── view tests ──────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestSearchView:

    @patch("search.views.search_github")
    def test_search_returns_200(self, mock_service, client):
        mock_service.return_value = {
            "results": [],
            "total_count": 0,
            "cached": False,
            "search_type": "repositories",
            "query": "django",
        }
        response = client.post(
            reverse("search"),
            {"query": "django", "search_type": "repositories"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["search_type"] == "repositories"

    def test_search_query_too_short(self, client):
        response = client.post(
            reverse("search"),
            {"query": "dj", "search_type": "repositories"},
            format="json",
        )
        assert response.status_code == 400

    def test_search_missing_fields(self, client):
        response = client.post(reverse("search"), {}, format="json")
        assert response.status_code == 400

    def test_search_invalid_type(self, client):
        response = client.post(
            reverse("search"),
            {"query": "django", "search_type": "issues"},
            format="json",
        )
        assert response.status_code == 400

    @patch("search.views.search_github")
    def test_search_github_timeout(self, mock_service, client):
        import requests
        mock_service.side_effect = requests.exceptions.Timeout

        response = client.post(
            reverse("search"),
            {"query": "django", "search_type": "repositories"},
            format="json",
        )
        assert response.status_code == 504

    @patch("search.views.search_github")
    def test_search_github_rate_limit(self, mock_service, client):
        import requests
        error = requests.exceptions.HTTPError()
        error.response = MagicMock(status_code=403)
        mock_service.side_effect = error

        response = client.post(
            reverse("search"),
            {"query": "django", "search_type": "repositories"},
            format="json",
        )
        assert response.status_code == 429


@pytest.mark.django_db
class TestClearCacheView:

    @patch("search.views.clear_cache")
    def test_clear_cache_success(self, mock_clear, client):
        mock_clear.return_value = 5
        response = client.post(reverse("clear-cache"))
        assert response.status_code == 200
        assert "5" in response.data["message"]

    @patch("search.views.clear_cache")
    def test_clear_cache_error(self, mock_clear, client):
        mock_clear.side_effect = Exception("Redis down")
        response = client.post(reverse("clear-cache"))
        assert response.status_code == 500