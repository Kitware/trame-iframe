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
    rej,
    prom = new Promise((inner_res, inner_rej) => {
      res = inner_res;
      rej = inner_rej;
    });
  prom.resolve = res;
  prom.reject = rej;
  return prom;
}

class ClientState {
  constructor(iframe, origin, callStateRpc, makeNewId) {
    this.iframe = iframe;
    this.remote_origin = origin;
    this.listeners = [];
    this.onReadyStateCallbacks = [];
    this.watchIdToCallback = new Map();
    this.getIdToPromise = new Map();

    this.callStateRpc = callStateRpc;
    this.makeNewId = makeNewId;

    this.listeners.push(
      this.onWatchChannelUpdate.bind(this),
      this.onGetChannelUpdate.bind(this),
      this.onStateReadyEvent.bind(this)
    );

    this.listeners.forEach((l) => window.addEventListener("message", l));
  }
  postMessage(method, args, id) {
    this.callStateRpc("trame.state", method, args, id);
  }
  onStateReadyEvent(event) {
    // if the event does not come from this.iframe, it is not for us!
    if (event.source !== this.iframe.contentWindow) {
      return;
    }
    if (event.data.event === "stateReady") {
      this.onReadyStateCallbacks.forEach((cb) => cb());
    }
  }
  onReady(callback) {
    this.onReadyStateCallbacks.push(callback);
  }
  onWatchChannelUpdate(event) {
    // if the event does not come from this.iframe, it is not for us!
    if (event.source !== this.iframe.contentWindow) {
      return;
    }

    if (event?.data?.rpcCallback?.channel !== "trame.state.watch") {
      return;
    }

    const id = event.data.rpcCallback.id;
    const stateVars = event.data.rpcCallback.payload.stateVars;
    this.watchIdToCallback.get(id)(...stateVars);
  }

  onGetChannelUpdate(event) {
    // if the event does not come from this.iframe, it is not for us!
    if (event.source !== this.iframe.contentWindow) {
      return;
    }

    if (event?.data?.rpcCallback?.channel !== "trame.state.get") {
      return;
    }

    const id = event.data.rpcCallback.id;
    const result = event.data.rpcCallback.payload.result;

    const promise = this.getIdToPromise.get(id);

    if (!promise) {
      // this really shouldn't happen
      throw new Error("Something went wrong with get id " + id);
    }
    promise.resolve(result);
    this.getIdToPromise.delete(id);
  }

  cleanup() {
    this.listeners.forEach((l) => window.removeEventListener("message", l));
    this.listeners = [];
  }

  update(...args) {
    this.postMessage("update", args);
  }
  set(...args) {
    this.postMessage("set", args);
  }
  get(key) {
    const promise = promiseCreator();
    const id = this.makeNewId();
    this.getIdToPromise.set(id, promise);
    this.postMessage("get", { key }, id);
    return promise;
  }
  watch(state_vars, cb) {
    const id = this.makeNewId();
    this.watchIdToCallback.set(id, cb);
    this.postMessage("watch", state_vars, id);
  }
}

class ClientCommunicator {
  constructor(iframe, origin) {
    this.iframe = iframe;
    this.idGen = idGenerator();
    this.remote_origin = origin;
    this.listeners = [];
    this.triggerIdToPromise = new Map();
    this.state = new ClientState(
      iframe,
      origin,
      this.postMessage,
      this.makeNewId.bind(this)
    );

    const listener = this.onTriggerChannelUpdate.bind(this);
    window.addEventListener("message", listener);

    this.listeners.push(listener);
  }

  makeNewId() {
    return this.idGen.next().value;
  }

  postMessage(obj, method, args, id) {
    if (id == null) {
      id = this.makeNewId();
    }
    const event_payload = {
      rpc: {
        obj,
        method: method,
        args: args,
      },
      meta: {
        eventId: id,
      },
    };
    this.iframe.contentWindow.postMessage(event_payload, this.remote_origin);
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

    if (event?.data?.rpcCallback?.channel !== "trame.trigger") {
      return;
    }

    const id = event.data.rpcCallback.id;
    const result = event.data.rpcCallback.payload.result;
    const is_error = event.data.rpcCallback.payload.error;

    // lookup the promise that match the trigger id, resolve it with the trigger result
    // then remove the promise from the map
    const promise = this.triggerIdToPromise.get(id);

    if (!promise) {
      // this really shouldn't happen
      throw new Error("Something went wrong with trigger id " + id);
    }
    if (is_error) {
      const err = result[0];
      console.error(err.data.trace);
      promise.reject(new Error(`${err.data.method} - ${err.data.exception}`));
    } else {
      promise.resolve(...result);
    }
    this.triggerIdToPromise.delete(id);
  }

  async trigger(name, args, kwargs) {
    // create a promise and register it with a unique id
    const promise = promiseCreator();
    const id = this.makeNewId();
    this.triggerIdToPromise.set(id, promise);

    this.postMessage("trame", "trigger", { name, args, kwargs }, id);

    // return a promise that should resolve with the trigger result
    return promise;
  }
}

export default ClientCommunicator;
