"""
Serializers for core models.
"""
from rest_framework import serializers
from .models import Transaction
from django.contrib.auth import get_user_model

User = get_user_model()


class TransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for Transaction model.
    """
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    processed_by_username = serializers.CharField(source='processed_by.username', read_only=True, allow_null=True)
    prediction_id = serializers.IntegerField(source='prediction_output.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'user_username', 'user_email',
            'prediction_output', 'prediction_id',
            'transaction_type', 'amount', 'currency',
            'payment_status', 'payment_method', 'transaction_id',
            'notes', 'processed_by', 'processed_by_username',
            'processed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TransactionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating transactions.
    """
    class Meta:
        model = Transaction
        fields = [
            'user', 'prediction_output', 'transaction_type',
            'amount', 'currency', 'payment_method', 'notes'
        ]
    
    def create(self, validated_data):
        # Generate unique transaction ID
        import uuid
        validated_data['transaction_id'] = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        return super().create(validated_data)
