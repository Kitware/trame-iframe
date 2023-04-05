import { ref, onMounted, onBeforeUnmount } from "vue";

export default {
  setup(props, { emit, expose }) {
    const elem = ref(null);

    function postMessage(msg) {
      if (elem.value) {
        elem.value.contentWindow.postMessage(msg, "*");
      }
    }

    function triggerEmit(event) {
      if (event?.data?.emit) {
        emit(event.data.emit, event.data?.value);
      }
    }

    onMounted(() => {
      elem.value.contentWindow.addEventListener("message", triggerEmit);
    });

    onBeforeUnmount(() => {
      elem.value.contentWindow.removeEventListener("message", triggerEmit);
    });

    expose({ triggerEmit, postMessage });
    return { triggerEmit, postMessage, elem };
  },
  template: '<iframe ref="elem" v-bind="$attrs"></iframe>',
};
