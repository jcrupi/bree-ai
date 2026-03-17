import { Elysia, t } from "elysia";
import { getNatsService } from "../nats";
import { requireAuth } from "../index";

export const figsterRoutes = new Elysia({ prefix: "/api/v1/figster" })
  .onBeforeHandle(async ({ headers, set }) => {
    const payload = await requireAuth(headers, {}, set);
    if (!payload && process.env.DEMO_MODE !== 'true') {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
  })

  /**
   * Universal Refactor Trigger
   * Publishes a prompt to the NATS bus for Grapes (now Figster agents) to handle.
   */
  .post("/refactor", async ({ body }) => {
    const { prompt } = body as { prompt: string };
    const nats = await getNatsService();
    
    console.log(`🚀 Figster API: Broadcasting refactor request: "${prompt.substring(0, 50)}..."`);
    
    // Publish to the agents
    await nats.publish("agent.refactor.request", {
      prompt,
      timestamp: new Date().toISOString()
    });

    return { 
      success: true, 
      message: "Refactor request broadcast via Figster NATS bus." 
    };
  }, {
    body: t.Object({
      prompt: t.String()
    })
  });
