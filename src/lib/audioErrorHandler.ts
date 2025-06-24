export interface AudioError {
  type: 'network' | 'decode' | 'permission' | 'cors' | 'unknown';
  message: string;
  userMessage: string;
  canRetry: boolean;
  originalError?: Error;
}

export class AudioErrorHandler {
  static handleError(error: Error | DOMException): AudioError {
    // Network errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        type: 'network',
        message: error.message,
        userMessage: 'Connection issue. Please check your internet and try again.',
        canRetry: true,
        originalError: error
      };
    }
    
    // CORS errors
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      return {
        type: 'cors',
        message: error.message,
        userMessage: 'Unable to load audio from server. Please try again later.',
        canRetry: false,
        originalError: error
      };
    }
    
    // Decode errors
    if (error instanceof DOMException && error.name === 'NotSupportedError') {
      return {
        type: 'decode',
        message: error.message,
        userMessage: 'Audio format not supported. Please try a different browser.',
        canRetry: false,
        originalError: error
      };
    }
    
    // Permission errors (autoplay)
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return {
        type: 'permission',
        message: error.message,
        userMessage: 'Click play to start audio',
        canRetry: true,
        originalError: error
      };
    }
    
    // Unknown errors
    return {
      type: 'unknown',
      message: error.message,
      userMessage: 'Something went wrong. Please try again.',
      canRetry: true,
      originalError: error
    };
  }
  
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry certain errors
        const audioError = this.handleError(lastError);
        if (!audioError.canRetry) {
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }
}