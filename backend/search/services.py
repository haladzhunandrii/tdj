import requests
from django.core.cache import cache
from django.conf import settings
from django_redis import get_redis_connection

GITHUB_API_URL = "https://api.github.com/search"


def _cache_key(search_type: str, query: str) -> str:
    return f"github_search:{search_type}:{query.lower().strip()}"


def _github_headers() -> dict:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


def _fetch_users(query: str) -> list:
    response = requests.get(
        f"{GITHUB_API_URL}/users",
        headers=_github_headers(),
        params={"q": query, "per_page": 24},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    return [
        {
            "id": user["id"],
            "login": user["login"],
            "avatar_url": user["avatar_url"],
            "html_url": user["html_url"],
            "type": user["type"],
        }
        for user in data.get("items", [])
    ], data.get("total_count", 0)


def _fetch_repositories(query: str) -> list:
    response = requests.get(
        f"{GITHUB_API_URL}/repositories",
        headers=_github_headers(),
        params={"q": query, "per_page": 24},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    return [
        {
            "id": repo["id"],
            "name": repo["name"],
            "full_name": repo["full_name"],
            "html_url": repo["html_url"],
            "description": repo["description"],
            "stargazers_count": repo["stargazers_count"],
            "forks_count": repo["forks_count"],
            "language": repo["language"],
            "updated_at": repo["updated_at"],
            "owner": {
                "login": repo["owner"]["login"],
                "avatar_url": repo["owner"]["avatar_url"],
            },
        }
        for repo in data.get("items", [])
    ], data.get("total_count", 0)


def search_github(search_type: str, query: str) -> dict:
    key = _cache_key(search_type, query)
    cached = cache.get(key)

    if cached:
        cached["cached"] = True
        return cached

    if search_type == "users":
        results, total_count = _fetch_users(query)
    else:
        results, total_count = _fetch_repositories(query)

    payload = {
        "results": results,
        "total_count": total_count,
        "cached": False,
        "search_type": search_type,
        "query": query,
    }

    cache.set(key, payload, timeout=settings.CACHE_TTL)
    return payload


def clear_cache() -> int:
    con = get_redis_connection("default")
    # django-redis prefixes keys with `:db_index:` (e.g. `:1:`)
    # We scan for any key containing our namespace
    keys = con.keys("*github_search:*")
    if keys:
        con.delete(*keys)
    return len(keys)