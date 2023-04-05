from trame_iframe.widgets.iframe import *


def initialize(server):
    from trame_iframe import module

    server.enable_module(module)
