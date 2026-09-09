import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import { registry } from './registry.js';
// Executing these for their registerPath()/register() side effects — the
// registry accumulates definitions as each module loads.
import './responseSchemas.js';
import './paths.js';

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Movie Library API',
      version: '1.0.0',
      description:
        'Auth is a JWT in an httpOnly cookie, not a bearer token — "Try it out" below works ' +
        'for protected routes once you log in through the app itself in this same browser tab ' +
        '(the browser attaches the cookie automatically; JS never needs to read it).',
    },
    servers: [{ url: '/', description: 'Same origin as this docs page' }],
  });
}
