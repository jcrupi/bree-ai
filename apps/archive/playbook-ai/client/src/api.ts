import { treaty } from "@elysiajs/eden";
import type { App } from "../../server/src/server";

const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:9001";

export const api = treaty<App>(base);
