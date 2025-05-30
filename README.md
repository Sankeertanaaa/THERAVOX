# Speech Emotion Recognition System

A full-stack application that analyzes speech patterns to detect emotions and generate detailed reports for medical professionals.

## Features

- **Speech Analysis**: Upload or record audio to analyze speech patterns
- **Emotion Detection**: Identifies emotions from speech using ML models
- **Report Generation**: Creates detailed PDF reports with analysis results
- **User Roles**: Separate interfaces for doctors and patients
- **Secure Access**: Role-based authentication and authorization
- **Real-time Processing**: Immediate analysis and report generation

## Tech Stack

### Frontend
- React.js
- Material-UI (MUI)
- Axios for API calls
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB for data storage
- JWT for authentication
- PDFKit for report generation

### Machine Learning
- Python-based emotion detection model
- Audio processing libraries
- Speech-to-text capabilities

## Project Structure

```
SPEECH-EMOTION-RECOGNITION/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── api/          # API integration
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
├── server/                # Backend Node.js application
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   └── uploads/          # File storage
│       ├── audio/        # Audio file storage
│       └── reports/      # Generated PDF reports
└── ml/                   # Machine learning components
    ├── models/           # Trained ML models
    └── process_audio.py  # Audio processing script
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd SPEECH-EMOTION-RECOGNITION
```

2. Install frontend dependencies:
```bash
cd client
npm install
```

3. Install backend dependencies:
```bash
cd ../server
npm install
```

4. Set up Python environment:
```bash
cd ../ml
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

5. Configure environment variables:
Create `.env` files in both client and server directories with necessary configurations.

### Running the Application

1. Start the backend server:
```bash
cd server
npm start
```

2. Start the frontend development server:
```bash
cd client
npm start
```

3. The application will be available at `http://localhost:3000`

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Report Endpoints
- `POST /api/upload/audio` - Upload audio for analysis
- `GET /api/reports/user` - Get user's reports
- `GET /api/reports/:id/pdf` - Download report PDF
- `GET /api/reports/doctor` - Get doctor's reports (doctor only)

## User Roles

### Patient
- Upload audio recordings
- View personal reports
- Download PDF reports
- View analysis history

### Doctor
- View assigned patient reports
- Add clinical notes
- Filter reports by patient
- Download detailed PDF reports

## File Structure

### Audio Files
- Stored in `server/uploads/audio/`
- Supported formats: WAV, MP3, WebM
- Maximum file size: 50MB

### PDF Reports
- Generated in `server/uploads/reports/`
- Include:
  - Patient information
  - Emotion analysis
  - Speech transcript
  - Analysis metrics
  - Clinical notes (if any)

## Security Features

- JWT-based authentication
- Role-based access control
- Secure file uploads
- Input validation
- CORS protection
- Rate limiting

## Error Handling

The application implements comprehensive error handling:
- Client-side validation
- Server-side validation
- File upload validation
- Authentication error handling
- API error responses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Your License Here]

## Support

For support, please contact [Your Contact Information]

