import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const url = context.url;
  
  // Handle URLs with trailing spaces that cause decodeURI errors
  if (url.pathname.includes('%20')) {
    try {
      // Try to decode the URL safely
      const decodedPath = decodeURIComponent(url.pathname);
      
      // If the decoded path has trailing spaces, redirect to clean version
      if (decodedPath.endsWith(' ') || decodedPath.includes(' .')) {
        const cleanPath = decodedPath.replace(/ +/g, '-').replace(/-+/g, '-');
        return Response.redirect(new URL(cleanPath, url.origin), 301);
      }
    } catch (error) {
      // If decodeURIComponent fails, try to clean the encoded URL
      if (error instanceof URIError) {
        console.warn('URI decoding error:', error.message);
        
        // Handle malformed URLs by redirecting to a safe fallback
        if (url.pathname.includes('/guests/')) {
          return Response.redirect(new URL('/all/guests/', url.origin), 302);
        }
        if (url.pathname.includes('/episodes/')) {
          return Response.redirect(new URL('/all/episodes/', url.origin), 302);
        }
        
        // For other paths, redirect to home
        return Response.redirect(new URL('/', url.origin), 302);
      }
    }
  }
  
  return next();
});