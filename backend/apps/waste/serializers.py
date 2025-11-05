from rest_framework import serializers
from .models import WasteManagement, WasteRecommendation

class WasteManagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteManagement
        fields = [
            'id', 'production_input', 'waste_type', 'waste_amount',
            'unit', 'date_recorded', 'reuse_possible', 'recorded_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'recorded_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Set recorded_by to current user if available
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['recorded_by'] = request.user
        return super().create(validated_data)

class WasteRecommendationSerializer(serializers.ModelSerializer):
    waste_record = WasteManagementSerializer(read_only=True)

    class Meta:
        model = WasteRecommendation
        fields = [
            'id', 'waste_record', 'recommendation_text', 'estimated_savings',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']