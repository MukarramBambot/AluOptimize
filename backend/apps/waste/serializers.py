from rest_framework import serializers
from .models import WasteManagement, WasteRecommendation

class WasteManagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteManagement
        fields = [
            'id', 'production_input', 'waste_type', 'waste_amount',
            'unit', 'date_recorded', 'reuse_possible', 'recorded_by',
            'production_line', 'temperature', 'pressure', 'energy_used',
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
    waste_amount = serializers.FloatField(source='waste_record.waste_amount', read_only=True)

    class Meta:
        model = WasteRecommendation
        fields = [
            'id', 'waste_record', 'waste_amount', 'recommendation_text', 
            'estimated_savings', 'ai_generated', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserWasteRecommendationSerializer(serializers.ModelSerializer):
    """
    Serializer for user-facing waste recommendations with production context.
    """
    waste_amount = serializers.FloatField(source='waste_record.waste_amount', read_only=True)
    waste_type = serializers.CharField(source='waste_record.waste_type', read_only=True)
    unit = serializers.CharField(source='waste_record.unit', read_only=True)
    reuse_possible = serializers.BooleanField(source='waste_record.reuse_possible', read_only=True)
    date_recorded = serializers.DateField(source='waste_record.date_recorded', read_only=True)
    
    # Production context - use SerializerMethodField for safer access
    production_line = serializers.SerializerMethodField()
    temperature = serializers.FloatField(source='waste_record.temperature', read_only=True)
    pressure = serializers.FloatField(source='waste_record.pressure', read_only=True)
    energy_used = serializers.FloatField(source='waste_record.energy_used', read_only=True)
    
    # Production output metrics
    energy_efficiency = serializers.SerializerMethodField()
    predicted_output = serializers.SerializerMethodField()
    output_quality = serializers.SerializerMethodField()
    reward = serializers.SerializerMethodField()
    
    class Meta:
        model = WasteRecommendation
        fields = [
            'id', 'production_line', 'waste_amount', 'waste_type', 'unit',
            'temperature', 'pressure', 'energy_used',
            'energy_efficiency', 'predicted_output', 'output_quality', 'reward',
            'reuse_possible', 'recommendation_text', 'estimated_savings', 
            'date_recorded', 'ai_generated', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_production_line(self, obj):
        """Get production line from waste record."""
        try:
            if obj.waste_record and obj.waste_record.production_line:
                return obj.waste_record.production_line
            elif obj.waste_record and obj.waste_record.production_input:
                return obj.waste_record.production_input.production_line
            return None
        except:
            return None
    
    def get_energy_efficiency(self, obj):
        """Get energy efficiency from related production output."""
        try:
            production_output = obj.production_outputs.first()
            return production_output.energy_efficiency if production_output else None
        except:
            return None
    
    def get_predicted_output(self, obj):
        """Get predicted output from related production output."""
        try:
            production_output = obj.production_outputs.first()
            return production_output.predicted_output if production_output else None
        except:
            return None
    
    def get_output_quality(self, obj):
        """Get output quality from related production output."""
        try:
            production_output = obj.production_outputs.first()
            return production_output.output_quality if production_output else None
        except:
            return None
    
    def get_reward(self, obj):
        """Get RL reward from related production output."""
        try:
            production_output = obj.production_outputs.first()
            return production_output.reward if production_output else None
        except:
            return None