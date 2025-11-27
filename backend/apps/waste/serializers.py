from rest_framework import serializers
from .models import WasteManagement, WasteRecommendation

class WasteManagementSerializer(serializers.ModelSerializer):
    production_line = serializers.CharField(read_only=True)
    created_by_username = serializers.SerializerMethodField()
    submitted_by_username = serializers.SerializerMethodField()
    output_kg = serializers.SerializerMethodField()
    efficiency = serializers.SerializerMethodField()
    quality = serializers.SerializerMethodField()
    waste_amount = serializers.FloatField()
    waste_type = serializers.CharField()
    estimated_savings = serializers.SerializerMethodField()
    recommendation_text = serializers.SerializerMethodField()
    date = serializers.DateField(source='date_recorded', read_only=True)

    def get_output_kg(self, obj):
        try:
            return float(obj.production_input.output.predicted_output)
        except Exception:
            return None

    def get_efficiency(self, obj):
        try:
            return float(obj.production_input.output.energy_efficiency)
        except Exception:
            return None

    def get_quality(self, obj):
        try:
            return float(obj.production_input.output.output_quality)
        except Exception:
            return None

    def get_estimated_savings(self, obj):
        try:
            return float(obj.recommendations.first().estimated_savings)
        except Exception:
            return None

    def get_recommendation_text(self, obj):
        try:
            return obj.recommendations.first().recommendation_text
        except Exception:
            return None

    def get_created_by_username(self, obj):
        try:
            if obj.production_input and obj.production_input.created_by:
                return obj.production_input.created_by.username
        except Exception:
            pass
        return None

    def get_submitted_by_username(self, obj):
        try:
            if obj.production_input and obj.production_input.submitted_by:
                return obj.production_input.submitted_by.username
        except Exception:
            pass
        return None


    class Meta:
        model = WasteManagement
        fields = [
            'id', 'production_input', 'waste_type', 'waste_amount',
            'unit', 'date_recorded', 'reuse_possible', 'recorded_by',
            'production_line', 'temperature', 'pressure', 'energy_used',
            'created_by_username', 'submitted_by_username',
            # User-facing convenience fields
            'output_kg', 'efficiency', 'quality', 'estimated_savings', 'recommendation_text', 'date',
            # Workflow fields
            'sent_to_user',
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
    production_line = serializers.SerializerMethodField()
    output_kg = serializers.SerializerMethodField()
    efficiency = serializers.SerializerMethodField()
    quality = serializers.SerializerMethodField()
    waste_amount = serializers.SerializerMethodField()
    waste_type = serializers.SerializerMethodField()
    estimated_savings = serializers.FloatField()
    recommendation_text = serializers.CharField()
    date = serializers.DateTimeField(source='created_at', read_only=True)

    def get_production_line(self, obj):
        try:
            return obj.waste_record.production_line
        except Exception:
            return None
    def get_output_kg(self, obj):
        try:
            return float(obj.waste_record.production_input.output.predicted_output)
        except Exception:
            return None
    def get_efficiency(self, obj):
        try:
            return float(obj.waste_record.production_input.output.energy_efficiency)
        except Exception:
            return None
    def get_quality(self, obj):
        try:
            return float(obj.waste_record.production_input.output.output_quality)
        except Exception:
            return None
    def get_waste_amount(self, obj):
        try:
            return float(obj.waste_record.waste_amount)
        except Exception:
            return None
    def get_waste_type(self, obj):
        try:
            return obj.waste_record.waste_type
        except Exception:
            return None


    # Ensure estimated_savings is returned as a numeric value (float) not string
    estimated_savings = serializers.FloatField(required=False, allow_null=True)
    waste_record = WasteManagementSerializer(read_only=True)
    waste_amount = serializers.FloatField(source='waste_record.waste_amount', read_only=True)

    class Meta:
        model = WasteRecommendation
        fields = [
            'id', 'waste_record', 'waste_amount', 'recommendation_text', 
            'estimated_savings', 'ai_generated',
            # User-facing convenience fields
            'production_line', 'output_kg', 'efficiency', 'quality', 'waste_type', 'date',
            # Workflow fields
            'sent_to_user',
            'created_at', 'updated_at'
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