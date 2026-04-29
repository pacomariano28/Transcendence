/**
 * Extends Express type definitions so `res.locals.user` is recognized across the app.
 *
 * Why this is needed:
 * - The auth middleware stores the authenticated user in `res.locals.user`.
 * - By default, Express does not know this property exists.
 * - This declaration merging adds a typed `user` field to `Express.Locals`,
 *   giving type safety and autocomplete in downstream middlewares/route handlers.
 *
 * Note: This file affects TypeScript types only; it does not run at runtime.
 */

export {};

declare global {
  namespace Express {
    interface Locals {
      user?: {
        id: string;
        email: string;
        username: string;
      };
    }
  }
}
