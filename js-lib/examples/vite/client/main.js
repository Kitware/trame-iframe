import ClientCommunicator from "@kitware/trame-iframe";
import "./style.css";
import { setupCounter } from "./counter.js";

document.querySelector("#app").innerHTML = `
  <div>
    <h1>Hello Trame !</h1>
    <div class="card">
    <button id="counter" type="button"></button>
    <button id="play" type="button">Auto update</button>
    <button id="subtract" type="button">-1</button>
    <iframe src="http://localhost:3000" frameborder="0" id="trame_app"></iframe>
    </div>
  </div>
`;

const url = "http://localhost:3000";
const iframe = document.getElementById("trame_app");

iframe.addEventListener("load", () => {
  const trame = new ClientCommunicator(iframe, url);
  setupCounter(document.querySelector("#counter"), trame);
  document
    .querySelector("#play")
    .addEventListener("click", () => trame.trigger("toggle_play"));
  document
    .querySelector("#subtract")
    .addEventListener("click", () => trame.trigger("subtract"));
});
