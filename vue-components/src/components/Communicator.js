import { inject, onBeforeUnmount, onMounted } from "vue";

export default {
  props: ["targetOrigin", "enableRpc"],
  props: {
    targetOrigin: {
      type: String,
    },
    enableRpc: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const trame = inject("trame");

    const targetOrigin = props.targetOrigin;
    const enableRpc = props.enableRpc;

    function postMessage(msg) {
      if (!targetOrigin) {
        window.postMessage(msg, "*");
      } else {
        window.parent.postMessage(msg, targetOrigin);
      }
    }

    if (trame.state.ready) {
      postMessage({
        event: "stateReady",
      });
    }

    function triggerEmit(event) {
      if (event?.data?.emit) {
        emit(event.data.emit, event.data?.value);
      }
      if (event?.data?.state) {
        trame.state.update(event.data.state);
      }
    }

    function setupWatcher(id, args, kwargs) {
      const callback = (...args) => {
        const payload = {
          rpcCallback: {
            channel: "trame.state.watch",
            id,
            payload: {
              stateVars: args,
            },
          },
        };
        postMessage(payload);
      };

      // setup the actual watcher
      trame.state.watch(args, callback);
    }

    function callTrigger(id, args) {
      const callback = (error, ...args) => {
        const payload = {
          rpcCallback: {
            channel: "trame.trigger",
            id,
            payload: {
              error,
              result: args,
            },
          },
        };
        postMessage(payload);
      };
      trame
        .trigger(args.name, args.args, args.kwargs)
        .then(callback.bind(null, false))
        .catch(callback.bind(null, true));
    }

    function callGet(id, args) {
      const result = trame.state.get(args.key);
      const payload = {
        rpcCallback: {
          channel: "trame.state.get",
          id,
          payload: {
            result,
          },
        },
      };
      postMessage(payload);
    }

    function proxyFunctionCalls(event) {
      if (event.origin !== targetOrigin) {
        return;
      }

      if (!event?.data?.rpc) {
        return;
      }

      const { obj, method, args } = event.data.rpc;
      switch (obj) {
        case "trame":
          switch (method) {
            case "trigger":
              {
                const { eventId } = event.data.meta;
                callTrigger(eventId, args);
              }
              break;
          }
          break;
        case "trame.state":
          switch (method) {
            case "watch":
              {
                const { eventId } = event.data.meta;
                setupWatcher(eventId, args);
              }
              break;
            case "get":
              {
                const { eventId } = event.data.meta;
                callGet(eventId, args);
              }
              break;
            default:
              if (typeof trame.state[method] !== "function") {
                console.error(`unsupported trame.state rpc; ${method}`);
                return;
              }
              trame.state[method](...args);
              break;
          }
          break;
        default:
          console.error(`unsupported rpc: ${obj}`);
      }
    }

    onMounted(() => {
      if (enableRpc) {
        window.addEventListener("message", proxyFunctionCalls);
      }

      window.addEventListener("message", triggerEmit);
    });

    onBeforeUnmount(() => {
      if (enableRpc) {
        window.removeEventListener("message", proxyFunctionCalls);
      }

      window.removeEventListener("message", triggerEmit);
    });

    return { postMessage, triggerEmit };
  },
};
