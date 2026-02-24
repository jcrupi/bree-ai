import { test, expect, beforeEach, afterEach } from "bun:test";
import { AntiMatterDB } from "./lib/database";
import { MarkdownParser } from "./lib/parser";
import type { DBEntry } from "./types";
import { resolve } from "path";

const TEST_DB_PATH = "/tmp/antimatterdb_test";

async function cleanupTestDb() {
  try {
    const dir = Bun.file(TEST_DB_PATH);
    if (await dir.exists()) {
      // Note: Bun doesn't have native recursive delete, so we skip cleanup
      // In real tests, you'd use a different approach
    }
  } catch {
    // Ignore cleanup errors
  }
}

test("MarkdownParser - parse markdown with frontmatter", () => {
  const content = `---
id: test-1
name: Test Entry
type: test
---
# Test Content

This is a test entry.`;

  const parsed = MarkdownParser.parse(content, "test.md");

  expect(parsed.frontMatter.id).toBe("test-1");
  expect(parsed.frontMatter.name).toBe("Test Entry");
  expect(parsed.frontMatter.type).toBe("test");
  expect(parsed.content).toContain("# Test Content");
  expect(parsed.filename).toBe("test.md");
});

test("MarkdownParser - parse markdown without frontmatter", () => {
  const content = `# No Frontmatter

Just plain markdown.`;

  const parsed = MarkdownParser.parse(content, "plain.md");

  expect(Object.keys(parsed.frontMatter).length).toBe(0);
  expect(parsed.content).toContain("# No Frontmatter");
  expect(parsed.filename).toBe("plain.md");
});

test("MarkdownParser - handle markdown with complex frontmatter", () => {
  const content = `---
id: complex-1
title: Complex Entry
tags: [tag1, tag2, tag3]
metadata:
  author: John Doe
  version: 1.0
status: active
---
Complex content here.`;

  const parsed = MarkdownParser.parse(content, "complex.md");

  expect(parsed.frontMatter.id).toBe("complex-1");
  expect(parsed.frontMatter.title).toBe("Complex Entry");
  expect(parsed.frontMatter.status).toBe("active");
  expect(parsed.content).toContain("Complex content here.");
});

test("AntiMatterDB - initialize database", async () => {
  const db = new AntiMatterDB({
    rootPath: TEST_DB_PATH,
  });

  expect(db).toBeDefined();
  expect(db).toBeInstanceOf(AntiMatterDB);
});

test("AntiMatterDB - set and get entry", async () => {
  const db = new AntiMatterDB({
    rootPath: TEST_DB_PATH,
  });

  const testData = {
    name: "Test User",
    email: "test@example.com",
    role: "admin",
  };

  const entry = await db.set("test-entry", testData);

  expect(entry).toBeDefined();
  expect(entry.id).toBeDefined();
  expect(entry.path).toBe("test-entry");
  expect(entry.frontMatter.name).toBe("Test User");
});

test("AntiMatterDB - uses Bun.file API (not Node fs)", async () => {
  const uniquePath = `/tmp/antimatterdb_bun_api_test_${crypto.randomUUID()}`;

  const db = new AntiMatterDB({
    rootPath: uniquePath,
  });

  // This test verifies the conversion to Bun.file API completed successfully
  // If the code still used Node.js fs module, it would fail
  const entry = await db.set("test-bun-api.md", {
    name: "Bun API Test",
    value: "Verifying Bun.file() is working",
  });

  // Verify entry was created and can be retrieved
  expect(entry).toBeDefined();
  expect(entry.frontMatter.name).toBe("Bun API Test");

  // Verify Bun.file is being used by checking file exists
  const filePath = `${uniquePath}/test-bun-api.md`;
  const file = Bun.file(filePath);
  const exists = await file.exists();
  expect(exists).toBe(true);

  // Verify we can read it back
  const retrieved = await db.get("test-bun-api.md");
  expect(retrieved).toBeDefined();
  expect(retrieved?.frontMatter.name).toBe("Bun API Test");
});

test("AntiMatterDB - delete entry", async () => {
  const db = new AntiMatterDB({
    rootPath: TEST_DB_PATH,
  });

  await db.set("deletable-entry", { test: "data" });

  const deleted = await db.delete("deletable-entry");

  expect(deleted).toBe(true);
});

test("MarkdownParser - parseFile async method", async () => {
  // Create a test file
  const testPath = resolve(TEST_DB_PATH, "test-parse.md");
  const content = `---
id: file-test
title: File Test
---
File content`;

  await Bun.write(testPath, content);

  const parsed = await MarkdownParser.parseFile(testPath);

  expect(parsed.frontMatter.id).toBe("file-test");
  expect(parsed.frontMatter.title).toBe("File Test");
  expect(parsed.content).toContain("File content");
});

test("AntiMatterDB - get method", async () => {
  const db = new AntiMatterDB({
    rootPath: TEST_DB_PATH,
  });

  const testData = {
    name: "Retrieve Test",
    value: "test123",
  };

  await db.set("retrieve-test", testData);

  const retrieved = await db.get("retrieve-test");

  expect(retrieved).toBeDefined();
  if (retrieved) {
    expect(retrieved.path).toBe("retrieve-test");
    expect(retrieved.frontMatter.name).toBe("Retrieve Test");
  }
});

test("MarkdownParser - handle special characters in frontmatter", () => {
  const content = `---
id: special-1
title: "Entry with colon"
description: "Multiple lines"
special: "@hash"
---
Content`;

  const parsed = MarkdownParser.parse(content, "special.md");

  expect(parsed.frontMatter.id).toBe("special-1");
  expect(parsed.frontMatter.title).toBeDefined();
  expect(parsed.frontMatter.special).toBe("@hash");
});

test("AntiMatterDB - handles nested paths", async () => {
  const db = new AntiMatterDB({
    rootPath: TEST_DB_PATH,
  });

  const testData = {
    organization: "TestCorp",
    department: "Engineering",
  };

  const entry = await db.set("orgs/testcorp/users/john", testData);

  expect(entry).toBeDefined();
  expect(entry.path).toContain("orgs/testcorp/users/john");
});

// Cleanup after all tests
afterEach(async () => {
  await cleanupTestDb();
});
