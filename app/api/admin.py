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
        Allows admin to update the subscription status of a user with optional duration.
        Expects: is_subscribed (bool), subscription_days (int, optional)
        """
        from django.utils import timezone
        from datetime import timedelta
        
        try:
            profile = self.get_object()
            is_subscribed = request.data.get('is_subscribed', None)
            subscription_days = request.data.get('subscription_days', None)

            if is_subscribed is None:
                return Response({"error": "is_subscribed field is required."}, status=status.HTTP_400_BAD_REQUEST)

            profile.is_subscribed = is_subscribed
            
            if is_subscribed:
                if subscription_days is None:
                    # Unlimited subscription - set NULL dates
                    profile.subscription_start_date = None
                    profile.subscription_end_date = None
                else:
                    # Time-limited subscription - set dates
                    profile.subscription_start_date = timezone.now()
                    
                    if subscription_days and subscription_days > 0:
                        profile.subscription_end_date = profile.subscription_start_date + timedelta(days=subscription_days)
                    else:
                        # If no days specified, default to 30 days
                        profile.subscription_end_date = profile.subscription_start_date + timedelta(days=30)
            else:
                # When disabling subscription, clear the dates
                profile.subscription_start_date = None
                profile.subscription_end_date = None

            profile.save()

            return Response({
                "message": "Subscription status updated successfully.", 
                "is_subscribed": profile.is_subscribed,
                "subscription_start_date": profile.subscription_start_date,
                "subscription_end_date": profile.subscription_end_date
            }, status=status.HTTP_200_OK)
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
