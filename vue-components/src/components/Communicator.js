import { inject, onBeforeUnmount, onMounted } from "vue";

export default {
  props: ["parentOrigin"],
  setup(props, { emit }) {
    const trame = inject("trame");
    const parentOrigin = props.parentOrigin;

    function postMessage(msg) {
      if (!parentOrigin) {
        window.postMessage(msg, "*");
      } else {
        window.parent.postMessage(msg, parentOrigin);
      }
    }

    function triggerEmit(event) {
      if (event?.data?.emit) {
        emit(event.data.emit, event.data?.value);
      }
      if (event?.data?.state) {
        trame.state.update(event.data.state);
      }
    }

    function proxyFunctionCalls(event) {
      if (event.origin !== parentOrigin) {
        return;
      }

      const { obj, method, args, kwargs } = event.data;

      if (obj === "trame") {
        if (method === "trigger") {
          const { name, id } = event.data;
          const callback = (...args) => {
            const payload = {
              triggerId: id,
              triggerChannelUpdate: true,
              args,
            };
            postMessage(payload);
          };
          trame.trigger(name, args, kwargs).then(callback);
          return;
        }
      }

      if (obj === "state") {
        if (method === "watch") {
          const { id } = event.data;
          const callback = (...args) => {
            const payload = {
              watchId: id,
              watchChannelUpdate: true,
              stateVars: args,
            };
            postMessage(payload);
          };

          // setup the actual watcher
          trame.state.watch(args, callback);
        } else {
          trame.state[method](...args, kwargs);
        }
      }
    }

    onMounted(() => {
      window.addEventListener("message", proxyFunctionCalls);
      window.addEventListener("message", triggerEmit);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("message", proxyFunctionCalls);
      window.removeEventListener("message", triggerEmit);
    });

    return { postMessage, triggerEmit };
  },
};
