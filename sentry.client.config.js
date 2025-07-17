import * as Sentry from "@sentry/astro";

// Client-side Sentry configuration
Sentry.init({
  // Ensure all errors are captured
  sampleRate: 1.0, // 100% of errors will be sent
  // Browser-specific tracing configuration
  integrations: [
    Sentry.browserTracingIntegration({
      // Capture interactions for INP (Interaction to Next Paint)
      enableInp: true,
      // Capture long tasks and animation frames
      enableLongTask: true,
      enableLongAnimationFrame: true,
      // Navigation and page load instrumentation
      instrumentNavigation: true,
      instrumentPageLoad: true,
      // Mark spans when tabs go to background
      markBackgroundSpans: true,
      // Custom span configuration
      beforeStartSpan: (context) => {
        // Parameterize transaction names for better grouping
        return {
          ...context,
          name: context.name
            // Replace UUIDs and hashes
            .replace(/\/[a-f0-9]{32}/g, "/<hash>")
            // Replace numeric IDs
            .replace(/\/\d+/g, "/<id>")
            // Replace episode slugs
            .replace(/\/episodes\/[^\/]+/g, "/episodes/<slug>")
            // Replace guest slugs
            .replace(/\/guests\/[^\/]+/g, "/guests/<slug>"),
        };
      },
      // Filter out health check requests
      shouldCreateSpanForRequest: (url) => {
        return !url.match(/\/api\/health/);
      },
    }),
  ],
  // Performance monitoring
  profilesSampleRate: 0.1, // 10% of transactions will have profiling
  // Web Vitals configuration
  enableTracing: true,
  // Send client reports
  sendClientReports: true,
  // Capture 404 errors
  beforeSend(event, hint) {
    // Ensure 404 messages are captured with proper transaction context
    if (event.message && event.message.includes('404 Page Not Found')) {
      // Add additional context for 404 errors
      event.fingerprint = ['404', event.tags?.pathname || 'unknown'];
      event.tags = {
        ...event.tags,
        error_type: '404',
      };
      // Ensure transaction name is set
      if (!event.transaction) {
        event.transaction = '404 Page Not Found';
      }
    }
    return event;
  },
  // Configure transaction sampling
  beforeSendTransaction(event) {
    // Ensure 404 transactions are properly named
    if (event.transaction === '404 Page Not Found' || event.tags?.['http.status_code'] === '404') {
      event.transaction = `404 ${event.tags?.pathname || event.contexts?.trace?.data?.pathname || 'unknown'}`;
    }
    return event;
  },
});