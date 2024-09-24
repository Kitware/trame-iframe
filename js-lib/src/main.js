function* idGenerator() {
  let index = 0;

  while (true) {
    yield index++;
  }
}

/**
 * @returns promise function with a "resolve" attribute, so it can be resolved from outside the promise executor
 */
function promiseCreator() {
  let res,
    prom = new Promise((inner_res) => {
      res = inner_res;
    });
  prom.resolve = res;
  return prom;
}

class ClientState {
  constructor(iframe, origin) {
    this.iframe = iframe;
    this.remote_origin = origin;
    this.listeners = [];
    this.watchIdToCallback = new Map();
    this.idGen = idGenerator();

    const listener = this.onWatchChannelUpdate.bind(this);
    window.addEventListener("message", listener);
    this.listeners.push(listener);
  }
  onWatchChannelUpdate(event) {
    // if the event does not come from this.iframe, it is not for us!
    if (event.source !== this.iframe.contentWindow) {
      return;
    }

    if (!event.data.watchChannelUpdate) {
      return;
    }

    const id = event.data.watchId;
    const stateVars = event.data.stateVars;
    this.watchIdToCallback.get(id)(...stateVars);
  }

  cleanup() {
    this.listeners.forEach(l => window.removeEventListener("message", l));
    this.listeners = [];
  }

  postMessage(method, args, optionals) {
    this.iframe.contentWindow.postMessage(
      {
        obj: "state",
        method: method,
        args: args,
        ...optionals,
      },
      this.remote_origin
    );
  }

  update(...args) {
    this.postMessage("update", args);
  }
  set(...args) {
    this.postMessage("set", args);
  }
  watch(state_vars, cb) {
    const id = this.idGen.next().value;
    this.watchIdToCallback.set(id, cb);
    this.postMessage("watch", state_vars, { id });
  }
}

class ClientCommunicator {
  constructor(iframe, origin) {
    this.iframe = iframe;
    this.idGen = idGenerator();
    this.remote_origin = origin;
    this.listeners = [];
    this.triggerIdToPromise = new Map();
    this.state = new ClientState(iframe, origin);

    const listener = this.onTriggerChannelUpdate.bind(this);
    window.addEventListener("message", listener);

    this.listeners.push(listener);
  }

  cleanup() {
    this.listeners.forEach((l) => window.removeEventListener("message", l));
    this.listeners = [];
    this.state.cleanup();
  }

  onTriggerChannelUpdate(event) {
    // if the event does not come from this.iframe, it is not for us!
    if (event.source !== this.iframe.contentWindow) {
      return;
    }

    if (!event.data.triggerChannelUpdate) {
      return;
    }

    // lookup the promise that match the trigger id, resolve it with the trigger result
    // then remove the promise from the map
    const id = event.data.triggerId;
    const result = event.data.args;
    const promise = this.triggerIdToPromise.get(id);

    if (!promise) {
      // this really shouldn't happen
      throw new Error("Something went wrong with trigger id " + id);
    }
    promise.resolve(...result);
    this.triggerIdToPromise.delete(id);
  }

  async trigger(name, args, kwargs) {
    // create a promise and register it with a unique id
    const promise = promiseCreator();
    const id = this.idGen.next().value;
    this.triggerIdToPromise.set(id, promise);

    this.iframe.contentWindow.postMessage(
      {
        obj: "trame",
        method: "trigger",
        id,
        name,
        args,
        kwargs,
      },
      this.remote_origin
    );

    // return a promise that should resolve with the trigger result
    return promise;
  }
}

export default ClientCommunicator;
