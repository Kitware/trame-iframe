from pathlib import Path

from trame.app import get_server
from trame.widgets import vuetify, iframe, html
from trame.ui.vuetify import SinglePageLayout

server = get_server()
server.client_type = "vue2"
state, ctrl = server.state, server.controller


# ---------------------------------------------------------
# Serve child page
# ---------------------------------------------------------

server.enable_module(
    dict(serve={"parent": str(Path(__file__).with_name("parent").absolute())})
)

# ---------------------------------------------------------
# Parent code
# ---------------------------------------------------------

state.msg_received = []


def child_receive_msg(msg):
    state.msg_received += [msg]
    state.dirty("msg_received")


with SinglePageLayout(server) as layout:
    layout.title.set_text("Child window")
    with layout.content:
        comm = iframe.Communicator(
            event_names=["parent_to_child"],
            parent_to_child=(child_receive_msg, "[$event]"),
        )
        ctrl.child_post_message = comm.post_message

        vuetify.VSlider(
            v_model=("child_slider", 0),
            change=(ctrl.child_post_message, "[{ emit: 'slider', value: $event }]"),
        )

        with vuetify.VContainer(fluid=True):
            with vuetify.VCol():
                with vuetify.VRow():
                    vuetify.VTextField(
                        v_model=("child_message", "Msg from child"),
                    )
                    vuetify.VBtn(
                        "Send",
                        click=(
                            ctrl.child_post_message,
                            "[{ emit: 'child-to-parent', value: child_message }]",
                        ),
                    )

                html.Div("{{ msg }}", v_for="msg, idx of msg_received", key="idx")

# ---------------------------------------------------------

server.start()
