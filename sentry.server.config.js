import * as Sentry from "@sentry/astro";

// Server-side Sentry configuration
Sentry.init({
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  // Ensure all errors are captured
  sampleRate: 1.0, // 100% of errors will be sent
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
    // Ensure 404 messages are captured with proper transaction context
    if (event.message && event.message.includes('404 Page Not Found')) {
      // Add additional context for 404 errors
      event.fingerprint = ['404', event.tags?.pathname || 'unknown'];
      event.tags = {
        ...event.tags,
        error_type: '404',
        render_type: 'ssr',
      };
      // Ensure transaction name is set
      if (!event.transaction) {
        event.transaction = '404 Page Not Found';
      }
    }
    return event;
  },
});