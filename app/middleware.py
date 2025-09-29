from django.http import HttpResponseForbidden
from django.urls import reverse, NoReverseMatch

class SubscriptionCheckMiddleware:
    """
    Intercepts requests for authenticated users and returns a 403 Forbidden
    response if they do not have a valid subscription.

    This allows the frontend to catch the error and redirect to a
    subscription page.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Paths to exclude from the subscription check
        exempt_paths = ['/api/', '/admin/']
        try:
            # Also exclude the subscription page itself to prevent an infinite loop
            exempt_paths.append(reverse('subscription_page'))
        except NoReverseMatch:
            pass

        # Let unauthenticated users and exempt paths pass through
        if (not request.user.is_authenticated or
                any(request.path.startswith(p) for p in exempt_paths)):
            return self.get_response(request)

        # Check the profile and subscription status
        profile = getattr(request.user, 'profile', None)
        if not (profile and profile.has_valid_subscription()):
            # Return a 403 Forbidden response. The frontend can handle this.
            return HttpResponseForbidden("Subscription not active.")

        # If subscription is valid, continue to the requested view
        return self.get_response(request)