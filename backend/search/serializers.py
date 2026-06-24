from rest_framework import serializers

SEARCH_TYPES = ["users", "repositories"]


class SearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField(min_length=3, max_length=256)
    search_type = serializers.ChoiceField(choices=SEARCH_TYPES)


class SearchResponseSerializer(serializers.Serializer):
    results = serializers.ListField()
    total_count = serializers.IntegerField()
    cached = serializers.BooleanField()
    search_type = serializers.CharField()
    query = serializers.CharField()