import * as Sentry from "@sentry/astro";

// Client-side Sentry configuration
Sentry.init({
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
});