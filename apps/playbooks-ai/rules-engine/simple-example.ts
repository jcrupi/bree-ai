import { validate1040Simple } from "./index.js";

const formPayloadPass = {
  taxpayer: { ssn: "123-45-6789" },
  form1040: {
    filing_status: "Single",
    signature: "Johnny Crupi",
    date: "2025-04-10",
    line_1a: 55000,
    line_9: 55000,
    line_11: 55000,
    line_14: 14600,
    line_15: 40400,
    line_16: 4040, 
  },
  w2s: [
    { box_1: 40000 },
    { box_1: 15000 },
  ],
};

const formPayloadFail = {
  taxpayer: { ssn: "INVALID-SSN" },
  form1040: {
    filing_status: "Married Filing Jointly", // Invalid for simple run
    line_1a: 40000,
    line_9: 55000, // AGI mismatch
    line_11: 40000,
    line_14: 14600,
    line_15: 10000, // Taxable mismatch
    line_16: 0,
  },
  w2s: [
    { box_1: 50000 }, // W2 mismatches line 1a
  ],
};

function run1040Tests(mode: "agentx" | "typescript") {
  console.log(`\n--- 1040-Simple Mode: ${mode.toUpperCase()} ---\n`);

  const r1 = validate1040Simple(formPayloadPass, { mode });
  console.log("1. Complete 1040 Simple:", r1.passed ? "PASS" : "FAIL", "| source:", r1.rulesSource);
  if (r1.agentxError) console.log("   Agentx error:", r1.agentxError);
  if (!r1.passed) console.log("   Findings:", r1.findings.map(f => f.remediation));

  const r2 = validate1040Simple(formPayloadFail, { mode });
  console.log("2. 1040 Simple with Errors:", r2.passed ? "PASS" : "FAIL");
  console.log("   Failed Rules:");
  r2.findings.filter(f => f.status === "FAIL").forEach(f => console.log(`     - [${f.ruleId}]: ${f.message}`));
}

const modeArg = process.argv[2]?.toLowerCase();
const mode = modeArg === "agentx" ? "agentx" : modeArg === "typescript" ? "typescript" : undefined;

console.log("=== 1040-Simple AI Rules Engine Demo ===");
run1040Tests(mode ?? "typescript");
run1040Tests(mode === "typescript" ? "agentx" : mode === "agentx" ? "typescript" : "agentx");
console.log("\n=== Done ===");
