from rest_framework import serializers

SEARCH_TYPES = ["users", "repositories", "issues"]


class SearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField(min_length=3, max_length=256)
    search_type = serializers.ChoiceField(choices=SEARCH_TYPES)
    page = serializers.IntegerField(min_value=1, max_value=100, default=1, required=False)


class SearchResponseSerializer(serializers.Serializer):
    results = serializers.ListField()
    total_count = serializers.IntegerField()
    page = serializers.IntegerField()
    per_page = serializers.IntegerField()
    cached = serializers.BooleanField()
    search_type = serializers.CharField()
    query = serializers.CharField()