from rest_framework import serializers
from .models import ProductionInput, ProductionOutput, PredictionLog
from decimal import Decimal

class ProductionInputSerializer(serializers.ModelSerializer):
    # Accept both field names for compatibility
    anode_effect_frequency = serializers.FloatField(
        source='anode_effect', 
        required=False,
        help_text="Anode effect frequency (alias for anode_effect)"
    )
    
    class Meta:
        model = ProductionInput
        fields = [
            'id', 'production_line', 'temperature', 'pressure', 'feed_rate',
            'power_consumption', 'anode_effect', 'anode_effect_frequency', 'bath_ratio',
            'alumina_concentration', 'submitted_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'submitted_by', 'created_at', 'updated_at']
        extra_kwargs = {
            'anode_effect': {'required': False},
        }

    def validate(self, data):
        """
        Ensure numeric fields accept both int and float, convert to float.
        Handle both anode_effect and anode_effect_frequency field names.
        """
        # Convert all numeric fields to float
        numeric_fields = [
            'temperature', 'pressure', 'feed_rate', 'power_consumption',
            'anode_effect', 'bath_ratio', 'alumina_concentration'
        ]
        
        for field in numeric_fields:
            if field in data:
                try:
                    data[field] = float(data[field])
                except (ValueError, TypeError):
                    raise serializers.ValidationError({
                        field: f"Must be a valid number"
                    })
        
        # Ensure at least one of anode_effect or anode_effect_frequency is provided
        if 'anode_effect' not in data:
            raise serializers.ValidationError({
                'anode_effect': 'This field is required'
            })
        
        return data

    def create(self, validated_data):
        # Set submitted_by to current user
        validated_data['submitted_by'] = self.context['request'].user
        return super().create(validated_data)

class ProductionOutputSerializer(serializers.ModelSerializer):
    input_data = ProductionInputSerializer(read_only=True)
    
    class Meta:
        model = ProductionOutput
        fields = [
            'id', 'input_data', 'predicted_output', 'actual_output',
            'output_quality', 'energy_efficiency', 'deviation_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'predicted_output', 'deviation_percentage',
            'created_at', 'updated_at'
        ]

class PredictionLogSerializer(serializers.ModelSerializer):
    production_output = ProductionOutputSerializer(read_only=True)
    
    class Meta:
        model = PredictionLog
        fields = [
            'id', 'production_output', 'confidence_score',
            'q10_prediction', 'q50_prediction', 'q90_prediction',
            'model_version', 'input_features', 'execution_time_ms',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

# Serializer for prediction requests
class PredictionRequestSerializer(serializers.ModelSerializer):
    anode_effect_frequency = serializers.FloatField(
        source='anode_effect', 
        required=False,
        help_text="Anode effect frequency (alias for anode_effect)"
    )
    
    class Meta:
        model = ProductionInput
        fields = [
            'production_line', 'temperature', 'pressure', 'feed_rate',
            'power_consumption', 'anode_effect', 'anode_effect_frequency', 'bath_ratio',
            'alumina_concentration'
        ]
        extra_kwargs = {
            'anode_effect': {'required': False},
        }
    
    def validate(self, data):
        """Convert integers to floats for all numeric fields"""
        numeric_fields = [
            'temperature', 'pressure', 'feed_rate', 'power_consumption',
            'anode_effect', 'bath_ratio', 'alumina_concentration'
        ]
        
        for field in numeric_fields:
            if field in data:
                try:
                    data[field] = float(data[field])
                except (ValueError, TypeError):
                    raise serializers.ValidationError({
                        field: f"Must be a valid number"
                    })
        
        if 'anode_effect' not in data:
            raise serializers.ValidationError({
                'anode_effect': 'This field is required'
            })
        
        return data

# Serializer for prediction responses
class PredictionResponseSerializer(serializers.Serializer):
    predicted_output = serializers.FloatField()
    confidence_score = serializers.FloatField()
    q10_prediction = serializers.FloatField()
    q50_prediction = serializers.FloatField()
    q90_prediction = serializers.FloatField()
    model_version = serializers.CharField()
    execution_time_ms = serializers.IntegerField()