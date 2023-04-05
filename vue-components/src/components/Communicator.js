import { inject, onMounted, onBeforeUnmount } from "vue";

export default {
  setup(props, { emit }) {
    const trame = inject("trame");

    function postMessage(msg) {
      window.postMessage(msg, "*");
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
