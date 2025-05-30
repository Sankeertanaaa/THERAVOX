# Technical Documentation

## System Architecture

### Frontend Architecture
The frontend is built using React.js with a component-based architecture:

1. **Component Structure**
   - Pages: Main route components
   - Components: Reusable UI elements
   - Hooks: Custom React hooks for shared logic
   - Context: Global state management

2. **State Management**
   - React Context for global state
   - Local state for component-specific data
   - Custom hooks for shared state logic

3. **Routing**
   - React Router for navigation
   - Protected routes for authenticated users
   - Role-based route access

### Backend Architecture
The backend follows a modular architecture:

1. **API Structure**
   - RESTful API design
   - Express.js middleware
   - Route handlers
   - Controller logic

2. **Database Schema**
   ```javascript
   // User Model
   {
     _id: ObjectId,
     name: String,
     email: String,
     password: String (hashed),
     role: String (enum: ['patient', 'doctor']),
     createdAt: Date
   }

   // Report Model
   {
     _id: ObjectId,
     patient: ObjectId (ref: User),
     doctor: ObjectId (ref: User),
     audioFile: String,
     emotions: [String],
     transcript: String,
     pitch: Number,
     pace: Number,
     silence: Number,
     summary: String,
     pdfPath: String,
     createdAt: Date
   }
   ```

3. **File Storage**
   - Audio files: `server/uploads/audio/`
   - PDF reports: `server/uploads/reports/`
   - File naming convention: `[timestamp]-[originalname]`

### ML Pipeline
The machine learning pipeline processes audio files:

1. **Audio Processing**
   - Input: WAV/MP3/WebM files
   - Preprocessing: Normalization, noise reduction
   - Feature extraction: MFCC, pitch, energy

2. **Emotion Detection**
   - Model: Pre-trained neural network
   - Input: Audio features
   - Output: Emotion probabilities
   - Supported emotions: angry, calm, disgust, fearful, happy, neutral, sad, surprised

3. **Report Generation**
   - Input: Analysis results
   - Output: PDF report
   - Sections: Patient info, emotions, transcript, metrics

## API Endpoints

### Authentication
```javascript
POST /api/auth/register
Body: {
  name: String,
  email: String,
  password: String,
  role: String
}

POST /api/auth/login
Body: {
  email: String,
  password: String
}

GET /api/auth/me
Headers: {
  Authorization: Bearer [token]
}
```

### Reports
```javascript
POST /api/upload/audio
Headers: {
  Authorization: Bearer [token]
}
Body: FormData {
  audio: File,
  patientId: String
}

GET /api/reports/user
Headers: {
  Authorization: Bearer [token]
}

GET /api/reports/:id/pdf
Headers: {
  Authorization: Bearer [token]
}
```

## Security Implementation

### Authentication
- JWT-based authentication
- Token expiration: 24 hours
- Refresh token mechanism
- Password hashing using bcrypt

### Authorization
- Role-based access control
- Middleware for route protection
- User role verification
- Resource ownership validation

### File Security
- File type validation
- Size limits
- Secure file naming
- Access control for file downloads

## Error Handling

### Client-side
```javascript
try {
  const response = await API.post('/upload/audio', formData);
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    setError(error.response.data.error);
  } else if (error.request) {
    // No response received
    setError('Network error');
  } else {
    // Other errors
    setError('An error occurred');
  }
}
```

### Server-side
```javascript
try {
  // Process request
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Server error',
    message: error.message
  });
}
```

## Performance Optimization

### Frontend
- Code splitting
- Lazy loading
- Memoization
- Optimized re-renders

### Backend
- Caching
- Database indexing
- File streaming
- Request rate limiting

## Testing

### Frontend Tests
- Unit tests for components
- Integration tests for pages
- E2E tests for critical flows

### Backend Tests
- API endpoint tests
- Authentication tests
- File upload tests
- PDF generation tests

## Deployment

### Requirements
- Node.js server
- MongoDB database
- Python environment
- File storage system

### Environment Variables
```env
# Server
PORT=5000
MONGODB_URI=mongodb://localhost:27017/speech-emotion
JWT_SECRET=your-secret-key
NODE_ENV=development

# Client
REACT_APP_API_URL=http://localhost:5000
```

## Monitoring and Logging

### Server Logs
- Request logging
- Error tracking
- Performance metrics
- Security events

### Client Logs
- User actions
- Error reporting
- Performance metrics
- Analytics

## Future Improvements

1. **Features**
   - Real-time emotion detection
   - Batch processing
   - Advanced analytics
   - Mobile app

2. **Technical**
   - Microservices architecture
   - WebSocket integration
   - Cloud storage
   - CI/CD pipeline 