from trame.app import get_server
from trame.widgets import vuetify, iframe, html, trame
from trame.ui.vuetify import SinglePageLayout

server = get_server()
server.client_type = "vue2"
state, ctrl = server.state, server.controller

# ---------------------------------------------------------
# Parent code
# ---------------------------------------------------------

state.parent_msg_received = []


def parent_receive_msg(msg):
    state.parent_msg_received += [msg]
    state.dirty("parent_msg_received")


@state.change("parent_slider")
def parent_slider_change(parent_slider, **kwargs):
    ctrl.parent_post_message(dict(state=dict(child_slider=parent_slider)))


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
                            "[{ emit: 'parent-to-child', value: parent_message }]",
                        ),
                    )
                vuetify.VSlider(v_model=("parent_slider", 0))

                with iframe.IFrame(
                    src="/?ui=child",
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
# Child code
# ---------------------------------------------------------

state.child_msg_received = []


def child_receive_msg(msg):
    state.child_msg_received += [msg]
    state.dirty("child_msg_received")


def push_slider_to_parent(value):
    ctrl.child_post_message(dict(state=dict(parent_slider=value)))


with SinglePageLayout(server, template_name="child") as layout:
    layout.title.set_text("Child window")
    with layout.content:
        comm = iframe.Communicator(
            event_names=["parent_to_child"],
            parent_to_child=(child_receive_msg, "[$event]"),
        )
        ctrl.child_post_message = comm.post_message

        vuetify.VSlider(v_model=("child_slider", 0))
        trame.ClientStateChange(
            value="child_slider",
            change=(push_slider_to_parent, "[$event]"),
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

                html.Div("{{ msg }}", v_for="msg, idx of child_msg_received", key="idx")

# ---------------------------------------------------------

server.start()
