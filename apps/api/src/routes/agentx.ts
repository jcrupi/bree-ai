import { Elysia, t } from "elysia";
import { getNatsService } from "../nats";
import { requireAuth } from "../index";

export const agentxGlobalRoutes = new Elysia({ prefix: "/api/v1/agentx" })
  .onBeforeHandle(async ({ headers, set }) => {
    // Note: We're allowing refactor requests for now, but in production this should be restricted
    const payload = await requireAuth(headers, {}, set);
    if (!payload && process.env.DEMO_MODE !== 'true') {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
  })

  /**
   * Universal Refactor Trigger
   * Publishes a prompt to the NATS bus for local Grapes to handle.
   */
  .post("/refactor", async ({ body }) => {
    const { prompt } = body as { prompt: string };
    const nats = await getNatsService();
    
    console.log(`🚀 API: Broadcasting refactor request to NATS: "${prompt.substring(0, 50)}..."`);
    
    // Publish to the Grapes
    await nats.publish("agent.refactor.request", {
      prompt,
      timestamp: new Date().toISOString()
    });

    return { 
      success: true, 
      message: "Refactor request broadcast to local Grapes via NATS." 
    };
  }, {
    body: t.Object({
      prompt: t.String()
    })
  });
