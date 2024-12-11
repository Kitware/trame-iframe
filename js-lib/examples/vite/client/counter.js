export function setupCounter(element, trame) {
  trame.state.onReady(() => {
    trame.state.watch(["count"], (count) => {
      console.log(`count is ${count}`);
      element.innerHTML = `count is ${count}`;
    });
  });
  element.addEventListener("click", () => trame.trigger("add"));
}
