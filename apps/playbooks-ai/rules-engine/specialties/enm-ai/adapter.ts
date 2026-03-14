import type { Adapter } from "../../core/executor.js";
import { ENM_HANDLERS } from "./handlers.js";

/**
 * ENM AI Adapter
 * 
 * Maps the enm-ai specialty to its native TypeScript handlers.
 */
export const enmAdapter: Adapter = {
  specialty: "enm-ai",
  ruleHandlers: ENM_HANDLERS,
};
