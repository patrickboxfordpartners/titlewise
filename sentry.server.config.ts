import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  environment: process.env.NODE_ENV,

  // Don't send errors in development
  enabled: process.env.NODE_ENV === "production",

  beforeSend(event, hint) {
    // Don't log sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    // Filter out expected errors
    const error = hint.originalException;
    if (error instanceof Error) {
      // Ignore Clerk auth errors (users not signed in)
      if (error.message.includes("Unauthorized") || error.message.includes("auth")) {
        return null;
      }
    }

    return event;
  },
});
