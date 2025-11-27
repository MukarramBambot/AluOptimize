from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.is_active = True  # Auto-activate new users
        user.is_staff = False  # Ensure not staff
        user.is_superuser = False  # Ensure not superuser
        user.save()
        
        # Create UserProfile only if it doesn't exist
        UserProfile.objects.get_or_create(user=user, defaults={'role': 'user'})
        
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        token['is_active'] = user.is_active
        token['username'] = user.username
        token['email'] = user.email if user.email else ''
        if user.is_superuser:
            token['role'] = 'admin'
        elif user.is_staff:
            token['role'] = 'staff'
        else:
            token['role'] = 'user'
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email or '',
            'is_superuser': self.user.is_superuser,
            'is_staff': self.user.is_staff,
            'role': 'admin' if self.user.is_superuser else 'staff' if self.user.is_staff else 'user'
        }
        return data