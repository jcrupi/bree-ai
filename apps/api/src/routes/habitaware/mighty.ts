import { Elysia, t } from "elysia";

const MIGHTY_BASE_URL = "https://api.mn.co/admin/v1";
const API_KEY = process.env.MIGHTY_API_KEY;
const NETWORK_ID = process.env.MIGHTY_NETWORK_ID;

async function mightyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_KEY) {
    throw new Error("MIGHTY_API_KEY not configured");
  }

  const url = `${MIGHTY_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Mighty API Error: ${response.status} - ${JSON.stringify(error)}`
    );
  }

  return response.json() as Promise<T>;
}

// Helper for pagination query params
const paginationQuery = t.Object({
  page: t.Optional(t.String()),
  per_page: t.Optional(t.String()),
});

function buildQuery(query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

export const mightyRoutes = new Elysia({ prefix: "/mighty" })

  // ============ ME ============
  .get("/me", async () => {
    return mightyFetch(`/networks/${NETWORK_ID}/me`);
  })

  // ============ NETWORK ============
  .get("/network", async () => {
    return mightyFetch(`/networks/${NETWORK_ID}/`);
  })

  // ============ MEMBERS ============
  .get("/members", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/members/by_email", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/by_email?email=${encodeURIComponent(query.email)}`);
  }, { query: t.Object({ email: t.String() }) })

  .get("/members/:memberId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/${params.memberId}/`);
  }, { params: t.Object({ memberId: t.String() }) })

  .post("/members", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Object({
    email: t.String(),
    first_name: t.Optional(t.String()),
    last_name: t.Optional(t.String()),
    bio: t.Optional(t.String()),
  }) })

  .patch("/members/:memberId", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/${params.memberId}/`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ memberId: t.String() }), body: t.Any() })

  .delete("/members/:memberId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/${params.memberId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ memberId: t.String() }) })

  // ============ SPACES ============
  .get("/spaces", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/spaces/:spaceId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces/${params.spaceId}`);
  }, { params: t.Object({ spaceId: t.String() }) })

  .post("/spaces", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Any() })

  .patch("/spaces/:spaceId", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces/${params.spaceId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ spaceId: t.String() }), body: t.Any() })

  .delete("/spaces/:spaceId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces/${params.spaceId}`, {
      method: "DELETE",
    });
  }, { params: t.Object({ spaceId: t.String() }) })

  // Space members
  .get("/spaces/:spaceId/members", async ({ params, query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces/${params.spaceId}/members${buildQuery(query as any)}`);
  }, { params: t.Object({ spaceId: t.String() }), query: paginationQuery })

  .post("/spaces/:spaceId/members", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces/${params.spaceId}/members`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ spaceId: t.String() }), body: t.Object({ user_id: t.Number() }) })

  .delete("/spaces/:spaceId/members/:userId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces/${params.spaceId}/members/${params.userId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ spaceId: t.String(), userId: t.String() }) })

  // ============ POSTS ============
  .get("/posts", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/posts/:postId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts/${params.postId}/`);
  }, { params: t.Object({ postId: t.String() }) })

  .post("/posts", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Object({
    space_id: t.Number(),
    body: t.String(),
    title: t.Optional(t.String()),
    post_type: t.Optional(t.String()),
  }) })

  .patch("/posts/:postId", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts/${params.postId}/`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ postId: t.String() }), body: t.Any() })

  .delete("/posts/:postId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts/${params.postId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ postId: t.String() }) })

  // ============ COMMENTS ============
  .get("/posts/:postId/comments", async ({ params, query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts/${params.postId}/comments${buildQuery(query as any)}`);
  }, { params: t.Object({ postId: t.String() }), query: paginationQuery })

  .post("/posts/:postId/comments", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts/${params.postId}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ postId: t.String() }), body: t.Object({ body: t.String() }) })

  .delete("/posts/:postId/comments/:commentId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts/${params.postId}/comments/${params.commentId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ postId: t.String(), commentId: t.String() }) })

  // ============ EVENTS ============
  .get("/events", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/events${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/events/:eventId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/events/${params.eventId}/`);
  }, { params: t.Object({ eventId: t.String() }) })

  .post("/events", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/events`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Any() })

  .patch("/events/:eventId", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/events/${params.eventId}/`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ eventId: t.String() }), body: t.Any() })

  .delete("/events/:eventId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/events/${params.eventId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ eventId: t.String() }) })

  // Event RSVPs
  .get("/events/:eventId/rsvps", async ({ params, query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/events/${params.eventId}/rsvps${buildQuery(query as any)}`);
  }, { params: t.Object({ eventId: t.String() }), query: paginationQuery })

  .post("/events/:eventId/rsvps", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/events/${params.eventId}/rsvps`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ eventId: t.String() }), body: t.Any() })

  // ============ POLLS ============
  .get("/polls", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/polls${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/polls/:pollId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/polls/${params.pollId}/`);
  }, { params: t.Object({ pollId: t.String() }) })

  .post("/polls", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/polls`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Any() })

  .delete("/polls/:pollId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/polls/${params.pollId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ pollId: t.String() }) })

  // ============ PLANS ============
  .get("/plans", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/plans${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/plans/:planId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/plans/${params.planId}/`);
  }, { params: t.Object({ planId: t.String() }) })

  .get("/plans/:planId/members", async ({ params, query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/plans/${params.planId}/members${buildQuery(query as any)}`);
  }, { params: t.Object({ planId: t.String() }), query: paginationQuery })

  .post("/plans/:planId/members", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/plans/${params.planId}/members`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ planId: t.String() }), body: t.Object({ member_id: t.Number() }) })

  .delete("/plans/:planId/members/:memberId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/plans/${params.planId}/members/${params.memberId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ planId: t.String(), memberId: t.String() }) })

  // Plan invites
  .get("/plans/:planId/invites", async ({ params, query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/plans/${params.planId}/invites${buildQuery(query as any)}`);
  }, { params: t.Object({ planId: t.String() }), query: paginationQuery })

  .post("/plans/:planId/invites", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/plans/${params.planId}/invites`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ planId: t.String() }), body: t.Object({ email: t.String() }) })

  // ============ INVITES ============
  .get("/invites", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/invites${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .post("/invites", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/invites`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Object({ email: t.String(), plan_id: t.Optional(t.Number()) }) })

  .delete("/invites/:inviteId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/invites/${params.inviteId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ inviteId: t.String() }) })

  // ============ BADGES ============
  .get("/badges", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/badges${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/badges/:badgeId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/badges/${params.badgeId}/`);
  }, { params: t.Object({ badgeId: t.String() }) })

  .post("/badges", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/badges`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Object({ name: t.String(), description: t.Optional(t.String()) }) })

  .delete("/badges/:badgeId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/badges/${params.badgeId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ badgeId: t.String() }) })

  // Member badges
  .get("/members/:memberId/badges", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/${params.memberId}/badges`);
  }, { params: t.Object({ memberId: t.String() }) })

  .post("/members/:memberId/badges", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/${params.memberId}/badges`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ memberId: t.String() }), body: t.Object({ badge_id: t.Number() }) })

  .delete("/members/:memberId/badges/:badgeId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/${params.memberId}/badges/${params.badgeId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ memberId: t.String(), badgeId: t.String() }) })

  // ============ TAGS ============
  .get("/tags", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/tags${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/tags/:tagId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/tags/${params.tagId}/`);
  }, { params: t.Object({ tagId: t.String() }) })

  .post("/tags", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/tags`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Object({ name: t.String() }) })

  .delete("/tags/:tagId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/tags/${params.tagId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ tagId: t.String() }) })

  // Member tags
  .get("/members/:memberId/tags", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/${params.memberId}/tags`);
  }, { params: t.Object({ memberId: t.String() }) })

  .post("/members/:memberId/tags", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/${params.memberId}/tags`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ memberId: t.String() }), body: t.Object({ tag_id: t.Number() }) })

  .delete("/members/:memberId/tags/:tagId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/${params.memberId}/tags/${params.tagId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ memberId: t.String(), tagId: t.String() }) })

  // ============ COLLECTIONS ============
  .get("/collections", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/collections${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/collections/:collectionId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/collections/${params.collectionId}/`);
  }, { params: t.Object({ collectionId: t.String() }) })

  .post("/collections", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/collections`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Object({ name: t.String() }) })

  .delete("/collections/:collectionId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/collections/${params.collectionId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ collectionId: t.String() }) })

  // ============ CUSTOM FIELDS ============
  .get("/custom_fields", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/custom_fields${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/custom_fields/:fieldId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/custom_fields/${params.fieldId}/`);
  }, { params: t.Object({ fieldId: t.String() }) })

  .post("/custom_fields", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/custom_fields`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Any() })

  .delete("/custom_fields/:fieldId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/custom_fields/${params.fieldId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ fieldId: t.String() }) })

  // ============ SUBSCRIPTIONS ============
  .get("/subscriptions", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/subscriptions${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/subscriptions/:subscriptionId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/subscriptions/${params.subscriptionId}`);
  }, { params: t.Object({ subscriptionId: t.String() }) })

  .delete("/subscriptions/:subscriptionId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/subscriptions/${params.subscriptionId}`, {
      method: "DELETE",
    });
  }, { params: t.Object({ subscriptionId: t.String() }) })

  // ============ PURCHASES ============
  .get("/purchases", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/purchases${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  .get("/purchases/:purchaseId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/purchases/${params.purchaseId}/`);
  }, { params: t.Object({ purchaseId: t.String() }) })

  .delete("/purchases/:purchaseId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/purchases/${params.purchaseId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ purchaseId: t.String() }) })

  // ============ COURSEWORKS ============
  .get("/spaces/:spaceId/courseworks", async ({ params, query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces/${params.spaceId}/courseworks${buildQuery(query as any)}`);
  }, { params: t.Object({ spaceId: t.String() }), query: paginationQuery })

  .get("/spaces/:spaceId/courseworks/:courseworkId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces/${params.spaceId}/courseworks/${params.courseworkId}/`);
  }, { params: t.Object({ spaceId: t.String(), courseworkId: t.String() }) })

  .post("/spaces/:spaceId/courseworks", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces/${params.spaceId}/courseworks`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ spaceId: t.String() }), body: t.Any() })

  .delete("/spaces/:spaceId/courseworks/:courseworkId", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/spaces/${params.spaceId}/courseworks/${params.courseworkId}/`, {
      method: "DELETE",
    });
  }, { params: t.Object({ spaceId: t.String(), courseworkId: t.String() }) })

  // ============ ABUSE REPORTS ============
  .get("/abuse_reports", async ({ query }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/abuse_reports${buildQuery(query as any)}`);
  }, { query: paginationQuery })

  // ============ ASSETS ============
  .post("/assets", async ({ body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/assets`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { body: t.Any() })

  // ============ PASSWORD RESETS ============
  .post("/members/:memberId/password_resets", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/members/${params.memberId}/password_resets`, {
      method: "POST",
    });
  }, { params: t.Object({ memberId: t.String() }) })

  // ============ REACTIONS ============
  .get("/posts/:postId/reactions", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts/${params.postId}/reactions`);
  }, { params: t.Object({ postId: t.String() }) })

  .post("/posts/:postId/reactions", async ({ params, body }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts/${params.postId}/reactions`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, { params: t.Object({ postId: t.String() }), body: t.Any() })

  .delete("/posts/:postId/reactions", async ({ params }) => {
    return mightyFetch(`/networks/${NETWORK_ID}/posts/${params.postId}/reactions`, {
      method: "DELETE",
    });
  }, { params: t.Object({ postId: t.String() }) })

  // ============ POSTS BY SPACE ============
  .get("/posts-by-space", async ({ query }) => {
    // Fetch spaces and posts in parallel
    const [spacesResponse, postsResponse] = await Promise.all([
      mightyFetch<{ items: Array<{ id: number; name: string }> }>(
        `/networks/${NETWORK_ID}/spaces?per_page=100`
      ),
      mightyFetch<{ items: Array<{ id: number; space_id: number; title: string; body: string; post_type: string; created_at: string; creator: { name: string; email: string }; permalink: string }> }>(
        `/networks/${NETWORK_ID}/posts?per_page=${query.per_page || "100"}`
      ),
    ]);

    // Group posts by space_id
    const postsBySpaceId = new Map<number, Array<any>>();
    for (const post of postsResponse.items) {
      if (!postsBySpaceId.has(post.space_id)) {
        postsBySpaceId.set(post.space_id, []);
      }
      postsBySpaceId.get(post.space_id)!.push(post);
    }

    // Build the result with spaces and their posts
    const spacesWithPosts = spacesResponse.items.map((space) => ({
      space,
      posts: postsBySpaceId.get(space.id) || [],
    }));

    // Sort by number of posts descending (spaces with posts first)
    spacesWithPosts.sort((a, b) => b.posts.length - a.posts.length);

    return { spaces: spacesWithPosts };
  }, { query: paginationQuery })

  // ============ MEMBERS WITH SUBSCRIPTIONS ============
  .get("/members-with-subscriptions", async ({ query }) => {
    // Fetch members and subscriptions in parallel
    const [membersResponse, subscriptionsResponse] = await Promise.all([
      mightyFetch<{ items: Array<{ id: number; email: string; first_name: string; last_name: string; bio: string; location: string | null; created_at: string; avatar: string; permalink: string }> }>(
        `/networks/${NETWORK_ID}/members?per_page=${query.per_page || "100"}`
      ),
      mightyFetch<{ items: Array<{ member_id: number; plan: { id: number; name: string; amount: number; currency: string; type: string }; subscription: { canceled_at: string | null; trial_end: string | null } }> }>(
        `/networks/${NETWORK_ID}/subscriptions?per_page=200`
      ),
    ]);

    // Create a map of member_id to subscription info
    const subscriptionMap = new Map<number, { planName: string; planType: string; amount: number; currency: string; isActive: boolean; isTrial: boolean }>();
    for (const sub of subscriptionsResponse.items) {
      const isTrial = sub.subscription.trial_end ? new Date(sub.subscription.trial_end) > new Date() : false;
      subscriptionMap.set(sub.member_id, {
        planName: sub.plan.name,
        planType: sub.plan.type,
        amount: sub.plan.amount,
        currency: sub.plan.currency,
        isActive: !sub.subscription.canceled_at,
        isTrial,
      });
    }

    // Enhance members with subscription info
    const membersWithSubs = membersResponse.items.map((member) => {
      const subscription = subscriptionMap.get(member.id);
      return {
        ...member,
        subscription: subscription || null,
        isPaid: subscription ? subscription.planType === "subscription" && subscription.amount > 0 : false,
        subscriptionStatus: subscription
          ? subscription.planType === "subscription" && subscription.amount > 0
            ? subscription.isTrial ? "trial" : "paid"
            : "free"
          : "none",
      };
    });

    return { items: membersWithSubs };
  }, { query: paginationQuery })

  // ============ ALL COMMENTS (AGGREGATED) ============
  .get("/all-comments", async ({ query }) => {
    // First fetch posts to get their IDs
    const postsResponse = await mightyFetch<{ items: Array<{ id: number; title: string }> }>(
      `/networks/${NETWORK_ID}/posts?per_page=${query.per_page || "50"}`
    );

    // Fetch comments for each post in parallel
    const commentPromises = postsResponse.items.map(async (post) => {
      try {
        const comments = await mightyFetch<{ items: Array<{ id: number; body: string; created_at: string; updated_at: string; creator?: { id: number; name: string; email: string } }> }>(
          `/networks/${NETWORK_ID}/posts/${post.id}/comments`
        );
        return comments.items.map((c) => ({ ...c, post_id: post.id, post_title: post.title }));
      } catch {
        return [];
      }
    });

    const allComments = (await Promise.all(commentPromises)).flat();
    // Sort by created_at descending
    allComments.sort((a, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { items: allComments };
  }, { query: paginationQuery })

  // ============ ALL COURSEWORKS (AGGREGATED) ============
  .get("/all-courseworks", async ({ query }) => {
    // First fetch spaces to get their IDs
    const spacesResponse = await mightyFetch<{ items: Array<{ id: number; name: string }> }>(
      `/networks/${NETWORK_ID}/spaces?per_page=100`
    );

    // Fetch courseworks for each space in parallel
    const courseworkPromises = spacesResponse.items.map(async (space) => {
      try {
        const courseworks = await mightyFetch<{ items: Array<{ id: number; title: string; description: string; status: string; created_at: string; updated_at: string }> }>(
          `/networks/${NETWORK_ID}/spaces/${space.id}/courseworks`
        );
        return courseworks.items.map((c) => ({ ...c, space_id: space.id, space_name: space.name }));
      } catch {
        return [];
      }
    });

    const allCourseworks = (await Promise.all(courseworkPromises)).flat();
    // Sort by created_at descending
    allCourseworks.sort((a, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { items: allCourseworks };
  }, { query: paginationQuery })

  // ============ GENERIC PROXY ============
  .post("/proxy", async ({ body }) => {
    return mightyFetch(body.endpoint.replace("{network_id}", NETWORK_ID!), {
      method: body.method || "GET",
      body: body.data ? JSON.stringify(body.data) : undefined,
    });
  }, { body: t.Object({
    endpoint: t.String(),
    method: t.Optional(t.String()),
    data: t.Optional(t.Any()),
  }) });
