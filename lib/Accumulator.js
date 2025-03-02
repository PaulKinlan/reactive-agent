import { effect, signal } from "@preact/signals-core";
import { Command } from "./utils.js";
import { BaseAgent } from "./BaseAgent.js";

/*
  Because we don't have memory, we might want to accumulate context at some point in a graph.
*/
class Accumulator extends BaseAgent {
  #internalList = [];

  constructor() {
    super({ task: signal(), persona: signal() });
    effect(() => {
      const context = this.context.value;

      if (context == undefined || context == Command.STOP) {
        this.response.value = [...this.#internalList];
        this.#internalList = [];
      } else {
        // Accumulate the responses, until it's complete
        this.#internalList.push(context);
      }
    });
  }
}

export { Accumulator };
