// const trame = new Trame({ iframe });
// await trame.connect({ application: 'trame' });

// State handing
trame.state.set("a", 5);
console.log(trame.state.get("b"));
trame.state.update({
    a: 1,
    b: 2,
}); 

// Method call on Python
const result = await trame.trigger("name", [arg_0, arg_1], { kwarg_0: 1, kwarg_1: 2 });

// TODO - state watching
trame.state.watch(["a"], (a) => {
    console.log(`a changed to ${a}`);
})
