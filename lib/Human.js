import { effect } from "@preact/signals-core";
import { BaseAgent, Command } from "./utils.js";

class Human extends BaseAgent {
  constructor() {
    super();

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

      response.value = window.prompt(context);
    });
  }
}

export { Human };
