from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model with password write-only.
    """
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'date_joined']
        read_only_fields = ['date_joined', 'is_staff', 'is_superuser']

    def create(self, validated_data):
        """
        Create and return a new user instance, given the validated data.
        All new users are created as inactive and require admin approval.
        """
        password = validated_data.pop('password')
        # Force is_active to False for new registrations
        validated_data['is_active'] = False
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        """
        Update and return an existing user instance, given the validated data.
        """
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        
        if password:
            user.set_password(password)
            user.save()
            
        return user