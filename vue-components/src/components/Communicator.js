import { inject, onMounted, onBeforeUnmount } from "vue";

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

    onMounted(() => {
      window.addEventListener("message", triggerEmit);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("message", triggerEmit);
    });

    return { postMessage, triggerEmit };
  },
};
