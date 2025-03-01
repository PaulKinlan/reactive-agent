import { effect, signal } from "@preact/signals-core";
import { Agent } from "./Agent.js";
import { getParameterNames } from "./utils.js";

class ToolCaller extends Agent {
  #tools;
  #finalResponse;

  #extractFunctionJSON = function (code) {
    if (code == undefined || typeof code != "string") return "";
    const match = code.match(/```(.*)\n([\s\S\d\D]+)\n```/m);
    if (!match) return "";

    const language = match[1];
    const content = match[2];

    switch (language.toLowerCase()) {
      case "json":
        return JSON.parse(content);
      default:
        console.log("Unsupported language: ", language);
        return "";
    }
  };

  constructor({ tools }) {
    const toolNames = tools.map((tool) => {
      if (tool.func.name == "") throw "Tools must use a named function";

      return `
+  Function name: ${tool.func.name}
   Function arguments: ${getParameterNames(tool.func)}
   Function description: ${tool.description}`;
    });

    const persona = `You have access to the following tools: ${toolNames.join(
      "\n+ "
    )}`;
    const task = `Based on the context, decide which function to use and return a JSON object in the following format: 
  {
    function_name;
    function_args: {name, value};
  }
`;
    super({ persona, task });

    this.#finalResponse = signal();
    this.#tools = tools;

    effect(() => {
      const result = this.response.value;

      const { function_name, function_args } =
        this.#extractFunctionJSON(result);

      if (function_name == undefined || function_name == "") return;

      for (const tool of this.#tools) {
        if (tool.func.name == function_name) {
          const flattenedArgs = getParameterNames(tool.func).map(
            (argName) => function_args[argName]
          );

          // try and call the function. TODO, can we await for promises?
          this.#finalResponse.value = tool.func(...flattenedArgs);
          return;
        }
      }

      throw "Unable to find function to call";
    });
  }

  // We have to override the response. This feels like a bit of a hack because we need the response from the base class where the root prompt happens
  get response() {
    if (this.#finalResponse) {
      return this.#finalResponse;
    } else {
      return super.response;
    }
  }

  get tools() {
    return this.#tools;
  }
}

export { ToolCaller };
