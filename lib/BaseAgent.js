import { signal } from "@preact/signals-core";

export class BaseAgent {
  #context;
  #response;

  constructor() {
    this.#context = signal();
    this.#response = signal();
  }

  get context() {
    return this.#context;
  }

  set context(val) {
    this.#context = val;
  }

  get response() {
    return this.#response;
  }
}
