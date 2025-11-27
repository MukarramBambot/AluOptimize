from rest_framework import serializers
from .models import ProductionInput, ProductionOutput, PredictionLog, PredictionHistory
from decimal import Decimal
from backend.apps.waste.serializers import WasteManagementSerializer, WasteRecommendationSerializer

class ProductionInputSerializer(serializers.ModelSerializer):
    # Accept both field names for compatibility
    anode_effect_frequency = serializers.FloatField(
        source='anode_effect', 
        required=False,
        help_text="Anode effect frequency (alias for anode_effect)"
    )
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True, allow_null=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ProductionInput
        fields = [
            'id', 'production_line', 'temperature', 'pressure', 'feed_rate',
            'power_consumption', 'anode_effect', 'anode_effect_frequency', 'bath_ratio',
            'alumina_concentration', 'status', 'created_by', 'created_by_username', 
            'created_by_email', 'approved_by', 'approved_by_username', 'sent_to_user', 
            'sent_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_by_username', 'created_by_email', 
            'approved_by', 'approved_by_username', 'sent_to_user', 'sent_at', 
            'created_at', 'updated_at'
        ]
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
        if 'anode_effect' not in data and 'anode_effect_frequency' not in data:
            raise serializers.ValidationError({
                'anode_effect': 'This field is required or provide anode_effect_frequency'
            })
        
        return data

    def create(self, validated_data):
        # Set submitted_by to current user
        validated_data['submitted_by'] = self.context['request'].user
        return super().create(validated_data)

class ProductionOutputSerializer(serializers.ModelSerializer):
    production_line = serializers.SerializerMethodField()
    output_kg = serializers.FloatField(source='predicted_output', read_only=True)
    efficiency = serializers.FloatField(source='energy_efficiency', read_only=True)
    quality = serializers.FloatField(source='output_quality', read_only=True)
    date = serializers.DateTimeField(source='created_at', read_only=True)
    waste_amount = serializers.SerializerMethodField()
    waste_type = serializers.SerializerMethodField()
    estimated_savings = serializers.SerializerMethodField()
    recommendation_text = serializers.SerializerMethodField()

    def get_production_line(self, obj):
        return obj.input_data.production_line if obj.input_data and hasattr(obj.input_data, 'production_line') else None

    def get_waste_amount(self, obj):
        return float(obj.waste_record.waste_amount) if obj.waste_record and obj.waste_record.waste_amount is not None else None

    def get_waste_type(self, obj):
        return obj.waste_record.waste_type if obj.waste_record else None

    def get_estimated_savings(self, obj):
        if obj.recommendation and obj.recommendation.estimated_savings is not None:
            return float(obj.recommendation.estimated_savings)
        return None

    def get_recommendation_text(self, obj):
        return obj.recommendation.recommendation_text if obj.recommendation else None


    input_data = ProductionInputSerializer(read_only=True)
    processed_by_username = serializers.CharField(source='processed_by.username', read_only=True, allow_null=True)
    submitted_by_username = serializers.CharField(source='input_data.submitted_by.username', read_only=True, allow_null=True)
    submitted_by_email = serializers.CharField(source='input_data.submitted_by.email', read_only=True, allow_null=True)
    waste_management = WasteManagementSerializer(source='waste_record', read_only=True, allow_null=True)
    waste_recommendations = WasteRecommendationSerializer(source='recommendation', read_only=True, allow_null=True)
    
    class Meta:
        model = ProductionOutput
        fields = [
            'id',
            # Core model fields
            'input_data', 'predicted_output', 'actual_output',
            'output_quality', 'energy_efficiency', 'deviation_percentage',
            'is_approved', 'approved_at', 'processed_by', 'processed_by_username',
            'status', 'submitted_by_username', 'submitted_by_email',
            'waste_estimate', 'waste_record', 'recommendation',
            'waste_management', 'waste_recommendations',
            # User-facing convenience fields for dashboards
            'production_line', 'output_kg', 'efficiency', 'quality',
            'waste_amount', 'waste_type', 'estimated_savings', 'recommendation_text', 'date',
            # Workflow fields
            'sent_to_user',
            # RL fields
            'reward', 'rl_state', 'rl_action', 'rl_reward_breakdown',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'predicted_output', 'deviation_percentage',
            'is_approved', 'approved_at', 'processed_by', 'processed_by_username',
            'submitted_by_username', 'submitted_by_email',
            'waste_estimate', 'waste_record', 'recommendation',
            'waste_management', 'waste_recommendations',
            'sent_to_user',
            'reward', 'rl_state', 'rl_action', 'rl_reward_breakdown',
            'created_at', 'updated_at'
        ]

class PredictionHistorySerializer(serializers.ModelSerializer):
    """Serializer for RL feedback loop history."""
    production_line = serializers.CharField(read_only=True)
    submitted_by_username = serializers.CharField(source='submitted_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = PredictionHistory
        fields = [
            'id', 'production_output', 'state', 'action', 'reward',
            'reward_breakdown', 'actual_efficiency', 'actual_waste',
            'was_approved', 'production_line', 'submitted_by',
            'submitted_by_username', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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

class ProductionInputSubmitSerializer(serializers.ModelSerializer):
    """Simplified serializer for user submission - doesn't return sensitive fields"""
    anode_effect_frequency = serializers.FloatField(
        source='anode_effect', 
        required=False,
        help_text="Anode effect frequency (alias for anode_effect)"
    )
    
    class Meta:
        model = ProductionInput
        fields = [
            'production_line', 'temperature', 'pressure', 'feed_rate',
            'power_consumption', 'anode_effect', 'anode_effect_frequency', 
            'bath_ratio', 'alumina_concentration'
        ]
        extra_kwargs = {
            'anode_effect': {'required': False},
        }

    def validate(self, data):
        """
        Ensure numeric fields are cast to floats and at least one of
        anode_effect / anode_effect_frequency is supplied.
        """
        numeric_fields = [
            'temperature', 'pressure', 'feed_rate', 'power_consumption',
            'anode_effect', 'bath_ratio', 'alumina_concentration'
        ]

        for field in numeric_fields:
            if field in data:
                try:
                    data[field] = float(data[field])
                except (TypeError, ValueError):
                    raise serializers.ValidationError({field: 'Must be a valid number'})

        if 'anode_effect' not in data:
            freq_value = self.initial_data.get('anode_effect_frequency')
            if freq_value in (None, '', 'null'):
                raise serializers.ValidationError({'anode_effect': 'This field is required'})
            try:
                data['anode_effect'] = float(freq_value)
            except (TypeError, ValueError):
                raise serializers.ValidationError({'anode_effect': 'Must be a valid number'})

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