import pino from 'pino';
import pinoHttpDefault from 'pino-http';
import type { HttpLogger, Options } from 'pino-http';

// The default import above is the correct *runtime* value (pino-http's CJS
// module.exports is the function itself), but its bundled types declare an
// ESM `export default` with no package.json "exports" map — under NodeNext
// that makes the *inferred type* of the default import the non-callable
// module namespace. Re-typing via the package's own exported Options/
// HttpLogger interfaces fixes the type without changing the (correct)
// runtime value.
const pinoHttp = pinoHttpDefault as unknown as (options: Options) => HttpLogger;

const isProduction = process.env.NODE_ENV === 'production';

// One shared logger: request logs (below) and the error handler's 5xx logs
// both go through it, so production output is consistently structured JSON.
// Pretty-printing is dev-only and pino-pretty is a devDependency, so this
// never touches node_modules in the production image.
export const logger = pino(isProduction ? {} : { transport: { target: 'pino-pretty' } });

export const requestLogger = pinoHttp({ logger });
