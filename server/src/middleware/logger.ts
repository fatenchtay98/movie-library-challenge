import morgan from 'morgan';

// 'dev' is concise and colorized for local use; a real deployment would swap
// this for a structured/JSON format, but that's more than a one-day scope needs.
export const requestLogger = morgan('dev');
