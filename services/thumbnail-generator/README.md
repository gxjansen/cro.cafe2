# CRO Café Thumbnail Generator

Automated podcast thumbnail generation service that creates 3000x3000px episode thumbnails following 2025 best practices.

## Features

- **Adaptive Layout System**: Automatically adjusts design based on host/guest count (1-2 hosts, 0-3 guests)
- **2025 Best Practices**: Mobile-first design, 7-word rule, high contrast, professional typography
- **Brand Consistency**: CRO Café teal/coral color palette and visual identity
- **Multiple Image Sources**: Supports LinkedIn profile pics, NocoDB images, and GitHub fallbacks
- **Optimized Output**: JPEG/PNG with automatic compression to meet platform requirements
- **Error Handling**: Graceful fallbacks for missing images and failed requests

## API Endpoints

### POST /generate

Generates a podcast thumbnail based on episode and participant data.

**Request Body:**
```json
{
  "episode": {
    "id": "episode-123",
    "episode_number": 142,
    "title": "Strategic Growth Through Data Analytics",
    "show_name": "CRO CAFÉ"
  },
  "hosts": [
    {
      "name": "John Doe",
      "title": "Host",
      "company": "",
      "image_url": "https://example.com/john.jpg",
      "linkedin_profile_pic": "https://linkedin.com/photo.jpg"
    }
  ],
  "guests": [
    {
      "name": "Jane Smith",
      "title": "VP of Growth",
      "company": "TechCorp",
      "image_url": "https://example.com/jane.jpg"
    }
  ],
  "canvas": {
    "width": 3000,
    "height": 3000,
    "format": "jpeg",
    "quality": 85
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "image_data": "base64EncodedImageData...",
    "mime_type": "image/jpeg",
    "size_bytes": 245760,
    "dimensions": {
      "width": 3000,
      "height": 3000
    },
    "layout_used": "1 Host + 1 Guest",
    "participants": {
      "hosts": 1,
      "guests": 1
    }
  },
  "timestamp": "2025-01-13T00:15:01.482Z"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "crocafe-thumbnail-generator",
  "timestamp": "2025-01-13T00:15:01.482Z"
}
```

## Supported Layouts

The service automatically selects the optimal layout based on participant count:

1. **1 Host + 0 Guests**: Large centered host image (400px)
2. **1 Host + 1 Guest**: Balanced two-column layout (350px each)
3. **1 Host + 2 Guests**: Host prominent, guests below (320px/280px)
4. **1 Host + 3 Guests**: Compact layout (280px/240px)
5. **2 Hosts + 0 Guests**: Equal prominence (400px each)
6. **2 Hosts + 1-3 Guests**: Hierarchical arrangements (250px-300px)

## Design Specifications

### Brand Colors
- **Primary**: #5a8a87 (Teal)
- **Accent**: #c05559 (Coral)
- **Text**: #2d3748 (Dark gray)
- **Secondary Text**: #4a5568 (Medium gray)

### Typography (2025 Optimized)
- **Show Name**: 120px Arial, sans-serif
- **Episode Number**: 100px Arial, sans-serif
- **Episode Title**: 80px Georgia, serif (max 7 words)
- **Person Names**: 60px Arial, sans-serif
- **Roles/Companies**: 52px Arial, sans-serif

### Image Requirements
- **Canvas**: 3000x3000px (1:1 aspect ratio)
- **Format**: JPEG (primary) or PNG (fallback)
- **Quality**: 85% compression
- **File Size**: <512KB for platform compatibility
- **Participant Images**: Circular crop, adaptive sizing

## Installation

```bash
# Clone repository
git clone https://github.com/yourusername/crocafesparc.git
cd crocafesparc/services/thumbnail-generator

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

```bash
PORT=3001
NODE_ENV=production
GITHUB_RAW_BASE_URL=https://raw.githubusercontent.com/yourusername/crocafesparc/main
```

## Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Integration with n8n Workflow

This service is designed to work with the "Episode Thumbnail Generator" n8n workflow:

1. **Webhook Trigger**: NocoDB episode creation triggers workflow
2. **Data Gathering**: Workflow fetches episode, host, and guest data
3. **Thumbnail Generation**: POST request to `/generate` endpoint
4. **Upload**: Generated thumbnail uploaded to Transistor.fm
5. **Status Update**: NocoDB record updated with thumbnail URL

## Error Handling

- **Missing Images**: Automatic placeholder generation with person initials
- **Invalid Formats**: Validation with detailed error messages
- **File Size Limits**: Automatic compression with quality adjustment
- **Network Timeouts**: 10-second timeout with graceful fallbacks
- **Validation Errors**: Detailed field-level error reporting

## Performance

- **Generation Time**: ~2-5 seconds per thumbnail
- **Memory Usage**: <100MB per request
- **Concurrent Requests**: Supports multiple simultaneous generations
- **Image Processing**: Optimized with Sharp for speed and quality
- **Caching**: Browser-friendly headers for generated images

## Testing

```bash
# Run tests
npm test

# Test with sample data
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d @test/sample-request.json
```

## Monitoring

The service includes built-in monitoring:

- **Health Checks**: `/health` endpoint for uptime monitoring
- **Error Logging**: Structured error logs with context
- **Performance Metrics**: Generation time and success rates
- **Resource Usage**: Memory and CPU monitoring hooks

## Contributing

1. Follow existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Ensure mobile-first design principles
5. Validate accessibility and contrast requirements

## License

MIT License - see LICENSE file for details.