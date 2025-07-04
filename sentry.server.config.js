import * as Sentry from "@sentry/astro";

// Server-side Sentry configuration
Sentry.init({
  // Server-specific configuration
  // Performance monitoring for server-side rendering
  profilesSampleRate: 0.1, // 10% of transactions will have profiling
  // Server-side specific options
  serverName: process.env.HOSTNAME || "crocafe-server",
  // Custom server-side transaction names
  beforeSendTransaction: (event) => {
    // Add custom context for server-side transactions
    if (event.contexts?.trace?.op === "http.server") {
      event.tags = {
        ...event.tags,
        "render.type": "ssr",
      };
    }
    return event;
  },
});