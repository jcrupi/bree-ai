import { IdentificationEngine, type IdentificationInputs } from "./engines/identification-engine.js";
import { IncomeMathEngine, type IncomeMathInputs } from "./engines/math-engine.js";
import type { Finding, RuleContext } from "../../core/types.js";

const idEngine = new IdentificationEngine();
const mathEngine = new IncomeMathEngine();

export function evaluateIdentificationRule(inputs: Record<string, unknown>, context: RuleContext): Finding | Finding[] {
  return idEngine.evaluate(inputs as unknown as IdentificationInputs, context);
}

export function evaluateMathRule(inputs: Record<string, unknown>, context: RuleContext): Finding | Finding[] {
  return mathEngine.evaluate(inputs as unknown as IncomeMathInputs, context);
}

export const SIMPLE_1040_HANDLERS: Record<string, (i: Record<string, unknown>, c: RuleContext) => Finding | Finding[] | unknown> = {
  evaluateIdentificationRule,
  evaluateMathRule,
};
