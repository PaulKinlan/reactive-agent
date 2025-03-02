export function isSignal(obj) {
  return (
    obj != undefined &&
    typeof obj != "string" &&
    "brand" in obj &&
    typeof obj.brand === "symbol" &&
    Symbol.keyFor(obj.brand) === "preact-signals"
  );
}

export class Command {
  static get STOP() {
    return "##STOP##";
  }
}

export function getParameterNames(func) {
  const funcString = func.toString();
  const matches = funcString.match(/\(([^)]*)\)/); // Extract parameters within parentheses

  if (matches) {
    const paramsString = matches[1];
    return paramsString.split(",").map((param) => param.trim());
  } else {
    return []; // No parameters found
  }
}
