import asyncio
from trame.app import get_server
from trame.widgets import iframe
from trame.ui.html import DivLayout

server = get_server()
state, ctrl = server.state, server.controller

state.count = 1
state.play = False


@state.change("count")
def count_change(count, **_):
    print(f"count={count}")


@ctrl.trigger("add")
def add_to_count():
    state.count += 1


@ctrl.trigger("subtract")
def subtract_to_count():
    state.count -= 1


@ctrl.trigger("toggle_play")
def toggle_play():
    state.play = not state.play


async def animate(**kwargs):
    while True:
        await asyncio.sleep(0.5)
        if state.play:
            with state:
                state.count += 1


ctrl.on_server_ready.add_task(animate)

with DivLayout(server) as layout:
    comm = iframe.Communicator(target_origin="http://localhost:2222", enable_rpc=True)

server.start()
