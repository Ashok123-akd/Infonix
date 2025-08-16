from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class MySocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_login_cancelled_redirect_url(self, request):
        print("✅ Cancelled login, redirecting to login")
        return '/login'

    def is_open_for_signup(self, request, sociallogin):
        return True

    def pre_social_login(self, request, sociallogin):
        """
        This runs before the signup form is shown.
        If the user already exists, log them in instead of showing the signup page.
        """
        if sociallogin.is_existing:
            return 

        user = sociallogin.user
        if user.email:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                existing_user = User.objects.get(email=user.email)
                sociallogin.connect(request, existing_user)
            except User.DoesNotExist:
               
                if not user.username:
                    user.username = user.email.split('@')[0]

    def save_user(self, request, sociallogin, form=None):
   
        user = sociallogin.user
        if not user.username:
            user.username = user.email.split('@')[0]
        user.save()
        sociallogin.save(request)
        return user

    def get_login_redirect_url(self, request):
        return '/index'
