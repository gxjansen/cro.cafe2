import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { ThumbnailGenerator } from './src/ThumbnailGenerator.js';
import { validateRequest } from './src/validation.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize thumbnail generator
const thumbnailGenerator = new ThumbnailGenerator();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'crocafe-thumbnail-generator',
    timestamp: new Date().toISOString()
  });
});

// Main thumbnail generation endpoint
app.post('/generate', async (req, res) => {
  try {
    // Validate request
    const { error, value } = validateRequest(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    // Generate thumbnail
    const result = await thumbnailGenerator.generate(value);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Thumbnail generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🎨 CRO Café Thumbnail Generator running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🖼️  Generate endpoint: http://localhost:${PORT}/generate`);
});