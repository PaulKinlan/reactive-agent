import { effect } from "@preact/signals-core";
import { Agent } from "./Agent.js";
import { Command } from "./utils.js";

class Planner extends Agent {
  #loop;
  #extractCode = function (code) {
    if (code == undefined) return "";
    const match = code.match(/```(.*)\n([\s\S\d\D]+)\n```/m);
    if (!match) return "";

    const language = match[1];
    const content = match[2];

    switch (language.toLowerCase()) {
      case "json":
        return JSON.parse(content);
      case "html":
        return content;
      default:
        console.log("Unsupported language: ", language);
        return "";
    }
  };

  constructor({ task, loop }) {
    const persona = `You are to create a precise plan for a given job. This plan will be executed by others and your responsibility is to produce a plan that reflects the job. 

Your output MUST be valid JSON in the following format:

\`\`\`json
{
  "todo": [{
    "task": "string, The task description. Use action-oriented language, starting with a verb that fits the task."
  }],
  "error": "string, optional. A description of why you're unable to create a plan"
}
\`\`\`
`;
    super({ persona, task });

    this.#loop = loop; // Should be an agent

    // We might need to destroy the effect if it's rebound.

    effect(() => {
      // Parse the response
      const response = this.response.value;
      const baseContext = this.context.value;

      if (response == undefined) return;
      if (response instanceof Object) return; // It's not a string from a model
      if (baseContext == undefined) return;

      try {
        const todo = [];
        const json = this.#extractCode(response);

        if (json == "") {
          console.log(
            `Unable to extract code from response: '${response}', using response as task`
          );
          todo.push(response);
        }

        if (typeof json == "object" && "todo" in json) {
          todo.push(...json.todo);
        }

        let processing = false;
        // Contains the results from the next node.
        const loopResult = [];

        // nesting the effect, if the input response changes then we reset
        effect(() => {
          // This function should only be called when the loop response changes (and it only contains the direct result from loop node)
          const loopOutput = this.#loop.response.value;

          if (loopOutput == Command.STOP) {
            // The loop has been told to stop.
            this.response.value = loopResult;
            return;
          }

          if (loopOutput != undefined && processing == true) {
            processing = false;
          }

          if (todo.length == 0 && processing == false) {
            // end the task;
            loopResult.push(loopOutput);
            this.#loop.context.value = Command.STOP;
            return;
          }

          if (todo.length > 0 && processing == false) {
            if (loopOutput != undefined) {
              loopResult.push({
                task: todo[0].task,
                immediateResult: loopOutput,
              });
            }
            processing = true;
            const item = todo.shift();
            // Start the task.
            this.#loop.context.value = `${baseContext}

Question: ${item.task}`;
          }
        });
      } catch (error) {
        console.error(error);
      }
    });
  }
}

export { Planner };
