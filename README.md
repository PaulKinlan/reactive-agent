# Reactive Agent

This is a simple library that enables you to build complex reactive applications using Agents in JavaScript directly in the browser. Agents will automatically re-run when the input changes and will only re-run the Agents where the data has changed. This allows you to chain the output of one Agent into the input of another.

It is inspired by [Breadboard](https://github.com/breadboard-ai/breadboard) and builds on top of the [`reactive-prompt`](https://github.com/paulkinlan/reactive-prompt) and it currently uses Chrome's experimental prompt API.

Each agent has a `persona` (How it should think or act), a `task` (What it should do) and a `context` (What data it should work on).

## Why an Agent vs imperative code?

Agents in the most part are non-deterministic, text-based, are able to output text and code and transform data from one representation to another without the traditional parsing and control flow of a normal programming language. It's possible that the next generation of applications are built entirely based on manipulating natural language prompts.

## Basic Agent

```JavaScript
const interviewer = new Agent({
    persona: `You are an expert researcher whose job it is to interview the user to collect information about the kind of book they want.`,
    task: `Based on the context provided and incorporating the history of the interview so far, offer a question that allows the user to easily pick or quickly type an answer`
  });


interview.context.value = "How to build a car";

effect(() => {
  // This is where the agent starts to get resolved.
  console.log(interviewer.response.value)
})
```

## Human

This is an Agent that represents the `User` interacting with the program. It is used to collect data.

```JavaScript
import { effect } from "@preact/signals-core";
import { Human } from "@paulkinlan/reactive-agent";

const human = new Human({});

effect(() => {
  console.log(human.response.value)
})
```

A more advanced usage is to chain the output of one Agent into a request from the user.

```JavaScript
import { effect } from "@preact/signals-core";
import { Agent, Human } from "@paulkinlan/reactive-agent";

const agent = new Agent({
  persona: "You are a pirate and you speak like a pirate",
  task: "You need to find out how old the user is"
})

const human = new Human({});

effect(() => {
  human.context.value = agent.response.value;
});

effect(() => {
  console.log(human.response.value)
});

agent.context.value = "My name is Paul";
```

## Planner Agent

The Planner Agent takes a `task` and works out a series of steps that should be performed by an agent set using `loop` parameter along with a given a context. For each step in the task, the `loop` Agent is called. The `response` is an array of `{task, immediateResult}` where immediateResult is the answer directly provided by the Agent defined in `loop`.

The `persona` is pre-configured and can't be changed.

The `task` is the goal that will be broken down in to individual tasks. You can constrain what is created here, i.e, "create one X" or "create 3-5 X's".

The `context` helps shape the tasks.

```JavaScript
import { effect } from "@preact/signals-core";
import { Agent, Planner } from "@paulkinlan/reactive-agent";

const interviewer = new Agent({
    persona: `You are an expert interviewer, whose job it is to interview the
user to find out what their social media post is about and theirs goals for
it are. Based on the theme provided in the context and incorporating the history of the interview so far, ask ONE question that allows the user to easily
and quickly type an answer. You only need to get one basic answer from the user.`,
    task: `Ask just ONE question that includes what this social media post is
about and its main goal. You only need to elicit ONE answer.
Do so in a friendly and casual manner.`
  });


const interviewPlanner = new Planner({
  task: `Based on the context, come up with ONE question to collect just enough information from the user about the social media post's topic and goals. Return JSON as described above`,
  loop: interviewer
});

effect(() => {
  // The output will be an single entry array of {task, immediateResult} so [{"Question", "Refined Question"}]
  console.log(interviewPlanner.response.value);
})

interviewPlanner.context.value = "The benefits of Market Gardening"
```

## Function/Tool calling Agent

Sometimes you need to interact with a traditional API (Browser-based or REST based). A Tool calling agent can work out which function to call and what parameters to provide based on the input context.

The `persona` and `task` are pre-configured and can't be changed.

```JavaScript

import { effect } from "@preact/signals-core";
import { ToolCaller } from "@paulkinlan/reactive-agent";

const toolCaller = new ToolCaller({
  tools: [
    {
      func: function getWeather(location) { return `It's Hot in ${location}`; },
      description: "Get the weather for a given location"
    },
    {
      func: function getTime(location) { return Date.now(); },
      description: "Get the time for a given location"
    }
  ]
})

effect(()=> {
  // Log the result of the function call.
  console.log(toolCaller.context.value)
});

toolCaller.context.value = "What is the weather in London?";
```

## Accumulator

Full disclosure, this is a hack and there is a strong argument that this should just be done in the `effect`. This Agent accumulates input context changes so that they can be accessed later on.

Why? An Agent generally takes the input `context` runs it through the prompts and adds the response on to the `response` attribute for use in the `effect`. As you build more complex agents that are chained together, the calling agent doesn't get a traditional return value and you might want to store it for access. Specifically, the `Planner` Agent takes an Agent to invoke on each step of the plan and you need to collate the response from each step via an Accumulator.

```JavaScript
const accumulator = new Accumulator();
```
