import { signal, effect } from "@preact/signals-core";
import { Command, isSignal } from "./utils.js";
import { BaseAgent } from "./BaseAgent.js";

class Human extends BaseAgent {
  #finalResponse;
  #humanCallback;
  constructor(humanCallback) {
    super();

    this.#finalResponse = signal();

    if (humanCallback) {
      // We should check that this is a promise
      this.#humanCallback = humanCallback;
    } else {
      this.#humanCallback = (callbackContext) =>
        new Promise((resolve) => {
          const result = window.prompt(callbackContext);
          resolve(result);
        });
    }

    let response = this.response;

    effect(() => {
      const context = this.context.value;
      if (context == "" || context == undefined) {
        return;
      }

      if (context == Command.STOP) {
        response.value = Command.STOP;
        return;
      }

      this.#humanCallback(context).then((result) => {
        this.#finalResponse.value = result;
      });
    });
  }

  get response() {
    return this.#finalResponse;
  }
}

export { Human };
