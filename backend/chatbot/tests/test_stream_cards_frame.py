import json
from django.test import TestCase
from chatbot.views import _frame_cards


class FrameCardsTest(TestCase):
    def test_reconhece_payload_de_cards(self):
        saida = json.dumps({"tipo": "cards", "payload": [{"id": 1}]})
        frame = _frame_cards(saida)
        self.assertIsNotNone(frame)
        self.assertTrue(frame.startswith("data: "))
        self.assertIn('"tipo": "cards"', frame)

    def test_ignora_texto_comum(self):
        self.assertIsNone(_frame_cards("oi, tudo bem?"))

    def test_ignora_json_sem_tipo_cards(self):
        self.assertIsNone(_frame_cards(json.dumps({"foo": "bar"})))
