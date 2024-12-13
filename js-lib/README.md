# Trame iframe library for plain JS
This library aims to simplify interaction between a trame application living inside an iframe and its iframe parent.  
This work is inspired by the [official trame-client js lib](https://github.com/Kitware/trame-client/tree/master/js-lib)

## Examples
- [Vite](./examples/vite/)

## Usage
First you need to grab the iframe that contains your trame application.
```js
import ClientCommunicator from "@kitware/trame-iframe";

const iframe = document.getElementById("trame_app");
const iframe_url = "http://localhost:3000";

const trame = new ClientCommunicator(iframe, iframe_url);

// set
trame.state.set("a", 2);
trame.state.set('b', 3);
trame.state.update({
    a: 2.5,
    b: 3.5,
    c: 4.5,
})

// get
console.log(trame.state.get("c"));
console.log(trame.state.get('a'));


// simple api for state change
trame.state.watch(
    ["a", "b", "c"], 
    (a, b, c) => {
        console.log(`a(${a}) or b(${b}) or c(${c}) have changed`);
    }
);

// -----------------------------------
// Method execution API
// -----------------------------------

// method execution on Python side
trame.trigger("name", ['arg_0', 'arg_1'], { kwarg_0: 1,  kwarg_1: 2 });
```
