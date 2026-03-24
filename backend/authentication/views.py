"""
OWASP A02.3: login devolve access no body; refresh em cookie HttpOnly.
Frontend guarda access apenas em memoria.
"""
import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .serializers import CustomTokenObtainPairSerializer, MeuPerfilSerializer

User = get_user_model()


def _patch_cookie_partitioned(response, cookie_name):
    """Adiciona '; Partitioned' ao Set-Cookie header (CHIPS compliance).

    Django 5.2 / Python 3.13 nao suportam o atributo Partitioned nativamente
    (suporte nativo chega no Python 3.14). Contorna sobrescrevendo OutputString
    apenas na instancia especifica do Morsel, sem monkey-patch global.
    """
    morsel = response.cookies.get(cookie_name)
    if morsel:
        _orig = morsel.OutputString
        morsel.OutputString = lambda attrs=None: _orig(attrs) + '; Partitioned'


def _set_refresh_cookie(response, refresh_value):
    """Define cookie HttpOnly com o refresh token (OWASP A02.3)."""
    response.set_cookie(
        key=settings.JWT_REFRESH_COOKIE_NAME,
        value=refresh_value,
        path=settings.JWT_REFRESH_COOKIE_PATH,
        httponly=settings.JWT_REFRESH_COOKIE_HTTPONLY,
        secure=settings.JWT_REFRESH_COOKIE_SECURE,
        samesite=settings.JWT_REFRESH_COOKIE_SAMESITE,
        max_age=settings.JWT_REFRESH_COOKIE_MAX_AGE,
    )
    if settings.JWT_REFRESH_COOKIE_PARTITIONED:
        _patch_cookie_partitioned(response, settings.JWT_REFRESH_COOKIE_NAME)


def _clear_refresh_cookie(response):
    """Remove o cookie de refresh (logout)."""
    response.delete_cookie(
        key=settings.JWT_REFRESH_COOKIE_NAME,
        path=settings.JWT_REFRESH_COOKIE_PATH,
        samesite=settings.JWT_REFRESH_COOKIE_SAMESITE,
    )
    # O delete tambem precisa de Partitioned, senao o browser nao localiza o cookie.
    if settings.JWT_REFRESH_COOKIE_PARTITIONED:
        _patch_cookie_partitioned(response, settings.JWT_REFRESH_COOKIE_NAME)


def _get_refresh_from_request(request):
    """Obtem refresh do cookie (preferido) ou do body."""
    v = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
    if v:
        return v.strip()
    data = request.data or {}
    v = data.get('refresh') if isinstance(data, dict) else None
    if isinstance(v, str) and v.strip():
        return v.strip()
    return None


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login. OWASP A04 rate limit. A02.3: refresh em cookie HttpOnly, access no body."""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        refresh_value = data.pop('refresh', None)
        response = Response(data, status=status.HTTP_200_OK)
        if refresh_value:
            _set_refresh_cookie(response, refresh_value)
        return response


class CustomTokenRefreshView(APIView):
    """
    Refresh. OWASP A02.3: le refresh do cookie HttpOnly, devolve access + user no body.
    Sem autenticacao; usa apenas o refresh no cookie.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        refresh_value = _get_refresh_from_request(request)
        if not refresh_value:
            return Response(
                {'detail': 'Token de refresh invalido.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            token = RefreshToken(refresh_value)
            user_id = token.get('user_id')
            if not user_id:
                return Response(
                    {'detail': 'Token de refresh invalido.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            user = User.objects.get(pk=user_id)
            grupos = list(user.groups.values_list('name', flat=True))
            grupo = grupos[0] if grupos else None
            primeiro_nome = ''
            if grupo == 'Usuarios':
                try:
                    primeiro_nome = (user.usuarios.first_name or '') if user.usuarios else ''
                except Exception:
                    pass
            # TODO: descomentar apos criar a app administradores
            # elif grupo == 'Administradores':
            #     try:
            #         primeiro_nome = (user.administradores.first_name or '') if user.administradores else ''
            #     except Exception:
            #         pass

            access = str(AccessToken.for_user(user))
            return Response({
                'access': access,
                'group': grupo or '',
                'primeiro_nome': primeiro_nome,
            }, status=status.HTTP_200_OK)
        except (TokenError, InvalidToken, TypeError, ValueError, User.DoesNotExist):
            logger = logging.getLogger(__name__)
            logger.warning('Refresh failed: invalid token')
            return Response(
                {'detail': 'Token de refresh invalido.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error('Refresh failed: %s', type(e).__name__, exc_info=True)
            return Response(
                {'detail': 'Erro ao renovar token.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MeuPerfilView(APIView):
    """Perfil do usuário logado. GET retorna dados; PATCH atualiza email e/ou senha."""
    permission_classes = [IsAuthenticated]

    def _get_grupo_e_perfil(self, user):
        grupos = list(user.groups.values_list('name', flat=True))
        grupo = grupos[0] if grupos else None
        profile = None
        if grupo == 'Usuarios':
            profile = getattr(user, 'usuarios', None)
        # TODO: descomentar apos criar a app administradores
        # elif grupo == 'Administradores':
        #     profile = getattr(user, 'administradores', None)

        return grupo, profile

    def get(self, request):
        user = request.user
        grupo, profile = self._get_grupo_e_perfil(user)
        return Response({
            'email': user.email,
            'primeiro_nome': profile.first_name if profile else '',
            'ultimo_nome': profile.last_name if profile else '',
            'group': grupo or '',
        })

    def patch(self, request):
        user = request.user
        serializer = MeuPerfilSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        novo_email = data.get('email')
        nova_senha = data.get('nova_senha')
        senha_atual = data.get('senha_atual', '')

        if (novo_email or nova_senha) and not user.check_password(senha_atual):
            return Response(
                {'senha_atual': 'Senha atual incorreta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grupo, profile = self._get_grupo_e_perfil(user)

        if novo_email and novo_email != user.username:
            if User.objects.filter(email=novo_email).exclude(pk=user.pk).exists():
                return Response(
                    {'email': 'Este email ja esta em uso.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.email = novo_email
            if profile:
                profile.email = novo_email
                profile.save()

        if nova_senha:
            user.set_password(nova_senha)

        user.save()

        return Response({
            'email': user.email,
            'primeiro_nome': profile.first_name if profile else '',
            'ultimo_nome': profile.last_name if profile else '',
            'group': grupo or '',
            'senha_alterada': bool(nova_senha),
        })


class LogoutView(APIView):
    """
    Logout. OWASP A02.3: le refresh do cookie (ou body) e invalida; remove cookie.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_value = _get_refresh_from_request(request)
        if not refresh_value:
            resp = Response(
                {'detail': 'Token de refresh invalido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
            _clear_refresh_cookie(resp)
            return resp

        try:
            token = RefreshToken(refresh_value)
            token.blacklist()
            resp = Response(status=status.HTTP_204_NO_CONTENT)
            _clear_refresh_cookie(resp)
            return resp
        except (TokenError, InvalidToken, TypeError, ValueError) as e:
            logger = logging.getLogger(__name__)
            logger.warning('Logout failed: %s', type(e).__name__)
            r = Response(
                {'detail': 'Token de refresh invalido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
            _clear_refresh_cookie(r)
            return r
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error('Logout error: %s', type(e).__name__, exc_info=True)
            return Response(
                {'detail': 'Erro ao processar logout.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )