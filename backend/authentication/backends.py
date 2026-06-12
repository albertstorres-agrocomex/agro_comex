from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailBackend(ModelBackend):
    """Autentica usando email em vez de username (OWASP A07: mesma mensagem em caso de falha)."""

    def authenticate(self, request, email=None, password=None, **kwargs):
        if not email or not password:
            return None
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Executa check_password de qualquer forma para evitar timing attack
            User().check_password(password)
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
