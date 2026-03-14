import type { Adapter } from "../../core/index.js";
import { SIMPLE_1040_HANDLERS } from "./handlers.js";

export const simple1040Adapter: Adapter = {
  specialty: "1040-simple",
  ruleHandlers: SIMPLE_1040_HANDLERS,
};
