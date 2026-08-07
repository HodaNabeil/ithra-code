import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

const redactPaths = [
  'password',
  'token',
  'authorization',
  'email',
  'req.headers.authorization',
  'req.headers.cookie',
];

export const logger = pino(
  isDev
    ? {
        level: 'info',
        redact: redactPaths,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      }
    : {
        level: 'info',
        redact: redactPaths,
      },
);
