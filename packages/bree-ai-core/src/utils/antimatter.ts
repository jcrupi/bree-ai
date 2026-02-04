/**
 * Utility for interacting with AntiMatterDB server for user and org management.
 */

const ANTIMATTER_URL =
  import.meta.env.VITE_ANTIMATTER_URL || "http://localhost:7198";

export interface AntiMatterEntry {
  path: string;
  frontMatter: Record<string, any>;
  content: string;
  id?: string;
}

export interface AntiMatterOrg {
  name: string;
  uuid: string;
  slug: string;
  type: "organization";
  status: "active" | "inactive";
  [key: string]: any;
}

export interface AntiMatterUser {
  email: string;
  name: string;
  uuid: string;
  role: "admin" | "member" | "viewer";
  status: "active" | "inactive";
  [key: string]: any;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${ANTIMATTER_URL}/api/health`);
    const data = await response.json();
    return data.status === "ok";
  } catch (error) {
    console.error("AntiMatterDB Health Check failed:", error);
    return false;
  }
}

/**
 * List all organizations
 */
export async function listOrgs(): Promise<AntiMatterOrg[]> {
  try {
    // Fetch from both super-org and the orgs directory
    const [superOrgRes, orgsRes] = await Promise.all([
      fetch(`${ANTIMATTER_URL}/api/entries?dir=super-org`),
      fetch(`${ANTIMATTER_URL}/api/entries?dir=orgs`),
    ]);

    const superOrgData = await superOrgRes.json();
    const orgsData = await orgsRes.json();

    const allEntries = [
      ...(superOrgData.entries || []),
      ...(orgsData.entries || []),
    ];

    return allEntries
      .filter((e: any) => e.path.endsWith("index.agentx.md"))
      .map((e: any) => e.frontMatter as AntiMatterOrg);
  } catch (error) {
    console.error("Failed to list organizations:", error);
    return [];
  }
}

/**
 * List users for a specific organization slug
 */
export async function listUsers(orgSlug: string): Promise<AntiMatterUser[]> {
  try {
    const dir =
      orgSlug === "super-org" ? "super-org/users" : `orgs/${orgSlug}/users`;
    const response = await fetch(`${ANTIMATTER_URL}/api/entries?dir=${dir}`);
    const data = await response.json();
    return (data.entries || []).map(
      (e: any) => e.frontMatter as AntiMatterUser,
    );
  } catch (error) {
    console.error(`Failed to list users for org ${orgSlug}:`, error);
    return [];
  }
}

/**
 * Create a new organization
 */
export async function createOrg(
  slug: string,
  name: string,
): Promise<AntiMatterOrg | null> {
  try {
    const orgPath =
      slug === "super-org"
        ? "super-org/index.agentx.md"
        : `orgs/${slug}/index.agentx.md`;
    const frontMatter: AntiMatterOrg = {
      name,
      slug,
      uuid: crypto.randomUUID(),
      type: "organization",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(`${ANTIMATTER_URL}/api/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: orgPath,
        frontMatter,
        content: `# Organization: ${name}\n\nManaged via KatAI Admin.`,
      }),
    });

    const data = await response.json();
    if (data.success) return frontMatter;
    return null;
  } catch (error) {
    console.error(`Failed to create organization ${name}:`, error);
    return null;
  }
}

/**
 * Create a new user in an organization
 */
export async function createUser(
  orgSlug: string,
  email: string,
  name: string,
  role: "admin" | "member" | "viewer" = "member",
): Promise<AntiMatterUser | null> {
  try {
    const userPath =
      orgSlug === "super-org"
        ? `super-org/users/${email}.agentx.md`
        : `orgs/${orgSlug}/users/${email}.agentx.md`;
    const frontMatter: AntiMatterUser = {
      email,
      name,
      uuid: crypto.randomUUID(),
      role,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(`${ANTIMATTER_URL}/api/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: userPath,
        frontMatter,
        content: `# User: ${name}\n\nMember of ${orgSlug}.`,
      }),
    });

    const data = await response.json();
    if (data.success) return frontMatter;
    return null;
  } catch (error) {
    console.error(`Failed to create user ${email} in org ${orgSlug}:`, error);
    return null;
  }
}
