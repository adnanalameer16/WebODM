from django.contrib.auth.models import User, Group
from app.models import Profile
from rest_framework import serializers, viewsets, generics, status, exceptions
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.hashers import make_password
from app import models

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = '__all__' 

class AdminUserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = User.objects.all()
        email = self.request.query_params.get('email', None)
        if email is not None:
            queryset = queryset.filter(email=email)
        return queryset

    def create(self, request):
        data = request.data.copy()
        password = data.get('password')
        data['password'] = make_password(password)
        user = UserSerializer(data=data)
        user.is_valid(raise_exception=True)
        user.save()
        return Response(user.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['put'], url_path='password')
    def update_password(self, request, pk=None):
        user = self.get_object()
        # We will expect the frontend to send a key named 'new_password'
        new_password = request.data.get('new_password')

        if not new_password:
            return Response({'error': 'New password is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Use Django's built-in function to securely hash and set the password
        user.set_password(new_password)
        user.save()

        return Response({'status': 'Password updated successfully'}, status=status.HTTP_200_OK)

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Group
        fields = '__all__'

class AdminGroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Group.objects.all()
        name = self.request.query_params.get('name', None)
        if name is not None:
            queryset = queryset.filter(name=name)
        return queryset


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Profile
        exclude = ('id', ) 

        read_only_fields = ('user', )

class AdminProfileViewSet(viewsets.ModelViewSet):
    pagination_class = None
    serializer_class = ProfileSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'user'
    
    def get_queryset(self):
        return Profile.objects.all()

    @action(detail=True, methods=['patch'], url_path='update-subscription')
    def update_subscription(self, request, user=None):
        """
        Allows admin to update the subscription status of a user.
        """
        try:
            profile = self.get_object()
            is_subscribed = request.data.get('is_subscribed', None)

            if is_subscribed is None:
                return Response({"error": "is_subscribed field is required."}, status=status.HTTP_400_BAD_REQUEST)

            profile.is_subscribed = is_subscribed
            profile.save()

            return Response({"message": "Subscription status updated successfully.", "is_subscribed": profile.is_subscribed}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    
    @action(detail=True, methods=['post'])
    def update_quota_deadline(self, request, user=None):
        try:
            hours = float(request.data.get('hours', ''))
            if hours < 0:
                raise ValueError("hours must be >= 0")
        except ValueError as e:
            raise exceptions.ValidationError(str(e))

        try:
            p = Profile.objects.get(user=user)
        except ObjectDoesNotExist:
            raise exceptions.NotFound()
        
        return Response({'deadline': p.set_quota_deadline(hours)}, status=status.HTTP_200_OK)
