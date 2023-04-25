"""IFrame Widgets support both vue2 and vue3 backend.
"""

from trame_client.widgets.core import AbstractElement
from .. import module

__all__ = [
    "IFrame",
    "Communicator",
]


class HtmlElement(AbstractElement):
    def __init__(self, _elem_name, children=None, **kwargs):
        super().__init__(_elem_name, children, **kwargs)
        if self.server:
            self.server.enable_module(module)


class IFrame(HtmlElement):
    _next_id = 0

    def __init__(self, event_names=[], **kwargs):
        """
        Create an HTML <iframe /> element with which you will
        be able to communicate.

        Properties:

        :param event_names: List of string matching the expected emit topics from the child window.
        :param allow: Specifies a feature policy for the <iframe>
        :param allowfullscreen: Set to true if the <iframe> can activate fullscreen mode by calling the requestFullscreen() method
        :param allowpaymentrequest: Set to true if a cross-origin <iframe> should be allowed to invoke the Payment Request API
        :param height: Specifies the height of an <iframe>. Default height is 150 pixels
        :param loading: Specifies whether a browser should load an iframe immediately or to defer loading of iframes until some conditions are met
        :param name: Specifies the name of an <iframe>
        :param referrerpolicy: Specifies which referrer information to send when fetching the iframe
        :param sandbox: Enables an extra set of restrictions for the content in an <iframe>
        :param src: Specifies the address of the document to embed in the <iframe>
        :param srcdoc: Specifies the HTML content of the page to show in the <iframe>
        :param width: Specifies the width of an <iframe>. Default width is 300 pixels

        Events:

        :param my_event_name: Called when child send message { emit: "my_event_name", value: "Anything you want" } but require to have set event_names=["my_event_name"]


        >>> w = iframe.IFrame(
        ...   src="/inner.html",
        ...   event_names=["hello", "good_bye"],
        ...   hello=(fn_hello, "[$event]"),
        ...   good_bye=(fn_bye, "[$event]"),
        ... )
        >>> w.post_message(dict(emit="hello", value="something"))
        >>> w.post_message(dict(state={ "a": 1, "b": 2 })) # update state of inner trame app
        """
        IFrame._next_id += 1
        ref_name = f"trame_iframe_{IFrame._next_id}"
        self.__ref = kwargs.get("ref", ref_name)

        super().__init__(
            "i-frame",
            **kwargs,
        )
        self._attributes["ref"] = f'ref="{self.__ref}"'
        self._attr_names += [
            "allow",
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
        """
        Post a message to the iframe. The message can be anything.
        When the target is a iframe.Communicator(), we will only handle the following 2 format:

        1. { emit: 'message-topic', value: { a: 1, b: 2} } will trigger message_topic= event if properly registered in event_names=['message_topic']
        2. { state: { a: 1, b: 2 } } will update the trame shared state

        """
        self.server.js_call(self.__ref, "postMessage", msg)


class Communicator(HtmlElement):
    _next_id = 0

    def __init__(self, event_names=[], **kwargs):
        """
        Create an invisible element that will allow a nested trame application to communicate with the iframe owner.

        Properties:

        :param event_names: List of string matching the expected emit topics from the child window.

        Events:

        :param my_event_name: Called when child send message { emit: "my_event_name", value: "Anything you want" } but require to have set event_names=["my_event_name"]


        >>> w = iframe.Communicator(
        ...   event_names=["hello", "good_bye"],
        ...   hello=(fn_hello, "[$event]"),
        ...   good_bye=(fn_bye, "[$event]"),
        ... )
        >>> w.post_message(dict(emit="hello", value="something"))
        >>> w.post_message(dict(state={ "a": 1, "b": 2 })) # update state of inner trame app
        """
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
        """
        Post a message to the iframe. The message can be anything.
        When the target is a iframe.IFrame(), we will only handle the following format:

        1. { emit: 'message-topic', value: { a: 1, b: 2} } will trigger message_topic= event if properly registered in event_names=['message_topic']
        """
        self.server.js_call(self.__ref, "postMessage", msg)
