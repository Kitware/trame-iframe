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
    dict(serve={"child": str(Path(__file__).with_name("child").absolute())})
)

# ---------------------------------------------------------
# Parent code
# ---------------------------------------------------------

state.parent_msg_received = []


def parent_receive_msg(msg):
    state.parent_msg_received += [msg]
    state.dirty("parent_msg_received")


with SinglePageLayout(server) as layout:
    layout.title.set_text("Parent window")
    with layout.content:
        with vuetify.VContainer(fluid=True):
            with vuetify.VCol():
                with vuetify.VRow():
                    vuetify.VTextField(v_model=("parent_message", "Msg from parent"))
                    vuetify.VBtn(
                        "Send",
                        click=(
                            ctrl.parent_post_message,
                            "[ parent_message ]",
                        ),
                    )

                with iframe.IFrame(
                    src="/child/index.html",
                    height=500,
                    width="100%",
                    event_names=["child_to_parent"],
                    child_to_parent=(parent_receive_msg, "[$event]"),
                ) as child:
                    ctrl.parent_post_message = child.post_message

                html.Div(
                    "{{ msg }}", v_for="msg, idx of parent_msg_received", key="idx"
                )

# ---------------------------------------------------------

server.start()
