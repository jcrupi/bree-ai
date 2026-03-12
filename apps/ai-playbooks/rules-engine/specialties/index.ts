/**
 * Specialty adapters registry.
 * Add new specialties here as they implement rules engines.
 */

export { woundAdapter, validateWound, type ValidateWoundOptions, type ValidateWoundResult } from "./wound-ai/index.js";
export { simple1040Adapter, validate1040Simple, type Validate1040Options, type Validate1040Result } from "./1040-simple/index.js";
