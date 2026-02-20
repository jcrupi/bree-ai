import { Elysia, t } from "elysia";
import { requireSuperAdmin } from "../../middleware/auth";
import { identityZeroAuthRoute } from "./auth";
import { usersRoutes } from "./users";
import { organizationsRoutes } from "./organizations";

// Identity Zero - Central Identity & Access Management API
export const identityZeroRoutes = new Elysia({ prefix: "/identity-zero" })
  // Public Auth Routes
  .use(identityZeroAuthRoute)
  
  // Protected Routes - Require Identity Zero Super Admin
  .use(requireSuperAdmin)

  // Sub-routes
  .use(usersRoutes)
  .use(organizationsRoutes);
