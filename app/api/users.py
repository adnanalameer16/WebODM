from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework import exceptions, permissions, parsers
from rest_framework.response import Response

class UsersList(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (parsers.JSONParser, parsers.FormParser,)

    def get(self, request):
        qs = User.objects.all()

        search = self.request.query_params.get('search', None)
        if search is not None:
            qs = qs.filter(username__istartswith=search) | qs.filter(email__istartswith=search)
            
        limit = self.request.query_params.get('limit', None)
        if limit is not None:
            try:
                qs = qs[:abs(int(limit))]
            except ValueError:
                raise exceptions.ValidationError(detail="Invalid query parameters")

        # Include is_subscribed status
        return Response([{'username': u.username, 'email': u.email, 'is_subscribed': hasattr(u, 'profile') and u.profile.is_subscribed} for u in qs])

class UserSubscriptionStatus(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        user = request.user
        is_subscribed = hasattr(user, 'profile') and user.profile.is_subscription_active()
        
        # Get subscription dates if user has a profile
        subscription_start_date = None
        subscription_end_date = None
        if hasattr(user, 'profile'):
            subscription_start_date = user.profile.subscription_start_date
            subscription_end_date = user.profile.subscription_end_date
        
        return Response({
            'is_subscribed': is_subscribed,
            'subscription_start_date': subscription_start_date,
            'subscription_end_date': subscription_end_date
        })