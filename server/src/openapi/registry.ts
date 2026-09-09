import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Must run before anything calls `.openapi(...)` on a Zod schema — this
// module is imported first by every other file in this folder specifically
// so that ordering holds.
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// The auth cookie is httpOnly, so Swagger UI's "Try it out" can't read or
// set it via JS — but it doesn't need to. The browser still attaches it
// automatically to same-origin requests, so logging in through the app
// itself in the same browser tab is enough for protected routes to work
// here too.
registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'token',
});
