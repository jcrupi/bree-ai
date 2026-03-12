/**
 * Wound AI Adapter
 *
 * Connects WOUND_AI_CATALOG to native rule handlers.
 */

import type { Adapter } from "../../core/executor.js";
import { WOUND_HANDLERS } from "./handlers.js";

export const woundAdapter: Adapter = {
  specialty: "wound-ai",
  ruleHandlers: WOUND_HANDLERS,
};
