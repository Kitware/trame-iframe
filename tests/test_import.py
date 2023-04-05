def test_import():
    from trame_iframe.widgets.iframe import IFrame, Communicator  # noqa: F401

    # For components only, the CustomWidget is also importable via trame
    from trame.widgets.iframe import IFrame, Communicator  # noqa: F401,F811
