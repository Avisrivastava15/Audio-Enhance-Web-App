# AudioEnhance - Professional Audio Enhancement Tool

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Python 3.9+ installed with pip

### Running the Application

#### 1. Start the Python Backend (Required for audio processing)

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run the Flask server
python app.py
```

The Python server will run on http://localhost:5000

#### 2. Start the Frontend (React application)

Open a new terminal:

```bash
# Navigate to project root
cd /path/to/project

# Install Node dependencies
npm install

# Run the development server
npm run dev
```

The frontend will run on http://localhost:5173

### How It Works

1. **Upload**: Upload MP3 or WAV audio files (max 100MB)
2. **Process**: Python backend uses librosa, scipy, and noisereduce for real audio processing:
   - Spectral analysis (STFT)
   - Noise reduction (spectral gating)
   - Echo detection (autocorrelation)
   - Echo removal (Wiener adaptive filtering)
   - Reverb reduction (spectral masking)
3. **Download**: Enhanced audio saved as high-quality WAV file

### Features

- Real signal processing algorithms, not simulations
- Echo and reverb removal using professional techniques
- Noise reduction with adaptive filtering
- Support for MP3 and WAV formats
- Progress visualization during processing
- Sign up required for downloads (guest mode for testing)

### Tech Stack

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- Lucide React icons
- Supabase for authentication

**Backend:**
- Python + Flask
- librosa (audio processing)
- scipy (signal processing)
- noisereduce (noise removal)
- soundfile (audio I/O)

### API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload` - Upload audio file
- `POST /api/process` - Process uploaded audio
- `GET /api/stream/<file_id>` - Stream processed audio
- `GET /api/download/<file_id>` - Download processed audio
- `DELETE /api/cleanup/<file_id>` - Clean up files

### Notes

- Both servers must be running for full functionality
- Python server handles actual audio processing
- Node server serves the frontend UI
- Guest users can upload and listen but cannot download
