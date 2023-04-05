from trame.app import get_server
from trame.widgets import vuetify, iframe, html
from trame.ui.vuetify import SinglePageLayout

server = get_server()
server.client_type = "vue2"
state, ctrl = server.state, server.controller

# ---------------------------------------------------------
# Child code
# ---------------------------------------------------------

state.child_msg_received = []


def child_receive_msg(msg):
    state.child_msg_received += [msg]
    state.dirty("child_msg_received")


with SinglePageLayout(server) as layout:
    layout.title.set_text("Child window")
    with layout.content:
        comm = iframe.Communicator(
            event_names=["parent_to_child"],
            parent_to_child=(child_receive_msg, "[$event]"),
        )
        ctrl.child_post_message = comm.post_message

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

                html.Div("{{ msg }}", v_for="msg, idx of child_msg_received", key="idx")

# ---------------------------------------------------------

server.start()
