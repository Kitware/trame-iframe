from trame_client.widgets.core import AbstractElement
from .. import module


class HtmlElement(AbstractElement):
    def __init__(self, _elem_name, children=None, **kwargs):
        super().__init__(_elem_name, children, **kwargs)
        if self.server:
            self.server.enable_module(module)


class IFrame(HtmlElement):
    _next_id = 0

    def __init__(self, event_names=[], **kwargs):
        IFrame._next_id += 1
        ref_name = f"trame_iframe_{IFrame._next_id}"
        self.__ref = kwargs.get("ref", ref_name)

        super().__init__(
            "i-frame",
            **kwargs,
        )
        self._attributes["ref"] = f'ref="{self.__ref}"'
        self._attr_names += [
            "allowfullscreen",
            "allowpaymentrequest",
            "height",
            "loading",
            "name",
            "referrerpolicy",
            "sandbox",
            "src",
            "srcdoc",
            "width",
        ]
        self._event_names += event_names

    def post_message(self, msg):
        self.server.js_call(self.__ref, "postMessage", msg)


class Communicator(HtmlElement):
    _next_id = 0

    def __init__(self, event_names=[], **kwargs):
        Communicator._next_id += 1
        ref_name = f"trame_comm_{Communicator._next_id}"
        self.__ref = kwargs.get("ref", ref_name)

        super().__init__(
            "communicator",
            **kwargs,
        )
        self._attributes["ref"] = f'ref="{self.__ref}"'
        self._event_names += event_names

    def post_message(self, msg):
        self.server.js_call(self.__ref, "postMessage", msg)
