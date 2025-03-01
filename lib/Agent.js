import { computed, effect, signal } from "@preact/signals-core";
import {
  prompt,
  ChromePromptConfiguration,
} from "@paulkinlan/reactive-prompt/chrome";
import { BaseAgent, Command, isSignal } from "./utils.js";

class Agent extends BaseAgent {
  #persona;
  #task;

  constructor({ task, persona }) {
    super();

    this.#persona = isSignal(persona) ? persona : signal(persona);
    this.#task = isSignal(task) ? task : signal(task);

    const promptResult = computed(() => {
      const context = this.context?.value;
      if (context == undefined) {
        // Don't prompt until we have the context (there's no point.)
        return undefined;
      }

      if (context == Command.STOP) {
        return Command.STOP;
      }

      return prompt`${this.#persona.value}

Context: ${context}${new ChromePromptConfiguration({
        debug: true,
      })}

Task: ${this.#task.value}
`;
    });

    effect(() => {
      const promptResponse = promptResult.value;
      // need to remove nested signals
      if (promptResponse == undefined) {
        this.response.value = undefined;
        return;
      }

      if (promptResponse == Command.STOP) {
        // The agent has been told to stop. Pass it on.
        this.response.value = Command.STOP;
        return;
      }

      this.response.value = promptResponse.value;
    });
  }

  get persona() {
    return this.#persona;
  }

  set persona(val) {
    this.#persona = val;
  }

  get task() {
    return this.#task;
  }

  set task(val) {
    this.#task = val;
  }
}

export { Agent };
