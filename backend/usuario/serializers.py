from django.contrib.auth.models import User, Group
from rest_framework import serializers
from usuario.models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'criado_em', 'atualizado_em']
        read_only_fields = ['id', 'criado_em', 'atualizado_em']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Este username ja esta em uso.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Este email ja esta em uso.')
        return value

    def create(self, validated_data):
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')

        auth_user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        grupo, _ = Group.objects.get_or_create(name='Usuarios')
        auth_user.groups.add(grupo)

        return Usuario.objects.create(user=auth_user, **validated_data)
