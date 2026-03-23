from rest_framework import serializers
from commodities.models import Comomodity


class CommoditySerializer (serializers.ModelSerializer):


    class Meta:
        model = Comomodity
        fields = "__all__"