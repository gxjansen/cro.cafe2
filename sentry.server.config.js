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
  // Capture 404 errors
  beforeSend(event, hint) {
    // Ensure 404 messages are captured
    if (event.message && event.message.includes('404 Page Not Found')) {
      // Add additional context for 404 errors
      event.fingerprint = ['404', event.tags?.pathname || 'unknown'];
      event.tags = {
        ...event.tags,
        error_type: '404',
        render_type: 'ssr',
      };
    }
    return event;
  },
});