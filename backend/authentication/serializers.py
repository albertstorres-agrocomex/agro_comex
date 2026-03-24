from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

MGS_CREDENCIAIS_INVALIDAS = "Credenciais invalidas."


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):  # corrigido: renomeado de CustomObtainPairSerializer
    """OWASP A07: falha de autenticacao sempre com mesma mensagem (evita user enumeration)."""
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except (AuthenticationFailed, serializers.ValidationError):
            raise AuthenticationFailed(MGS_CREDENCIAIS_INVALIDAS)

        user = self.user
        grupos = user.groups.values_list("name", flat=True)  # corrigido: flat=True (era false)

        if not grupos:
            raise AuthenticationFailed(MGS_CREDENCIAIS_INVALIDAS)

        grupo = grupos[0]
        data["group"] = grupo
        data["primeiro_nome"] = ""

        if grupo == 'Usuarios':
            try:
                data['primeiro_nome'] = user.usuarios.first_name or ''
            except ObjectDoesNotExist:
                raise AuthenticationFailed(MGS_CREDENCIAIS_INVALIDAS)

        # TODO: descomentar apos criar a app administradores
        # elif grupo == 'Administradores':
        #     try:
        #         data['primeiro_nome'] = user.administradores.first_name or ''
        #     except ObjectDoesNotExist:
        #         raise AuthenticationFailed(MGS_CREDENCIAIS_INVALIDAS)

        return data


class MeuPerfilSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    senha_atual = serializers.CharField(write_only=True, required=False, allow_blank=True)
    nova_senha = serializers.CharField(write_only=True, required=False, min_length=8)
    confirmar_senha = serializers.CharField(write_only=True, required=False)

    def validate(self, data):
        nova_senha = data.get('nova_senha')
        confirmar_senha = data.get('confirmar_senha')
        senha_atual = data.get('senha_atual', '')

        if nova_senha and nova_senha != confirmar_senha:
            raise serializers.ValidationError({'confirmar_senha': 'As senhas nao coincidem.'})

        if nova_senha and not senha_atual:
            raise serializers.ValidationError({'senha_atual': 'Senha atual e obrigatoria para alterar a senha.'})

        if data.get('email') and not senha_atual:
            raise serializers.ValidationError({'senha_atual': 'Senha atual e obrigatoria para alterar o email.'})

        return data


# Scaffold para validacao de logout via body (nao utilizado atualmente — LogoutView usa cookie HttpOnly).
# TODO: utilizar quando a UI de login for implementada e precisar de validacao de body.
class LogoutSerializer(serializers.Serializer):
    """Serializer para logout seguro. Valida que o refresh token esta presente."""
    refresh = serializers.CharField(
        required=True,
        help_text="Refresh token a ser invalidado"
    )

    def validate_refresh(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Token de refresh e obrigatorio.')
        return value.strip()
