🎧 Audio Processing Web App

An AI-powered audio enhancement web application that removes echo, reduces noise, and improves audio clarity using a Flask-based signal processing backend and a modern React + TypeScript frontend.

🚀 Features
🎙️ Upload MP3 / WAV audio files
🔊 Noise reduction using adaptive filtering
📡 Echo detection and removal
🎚️ Reverb reduction using spectral processing
⚡ Real-time step-by-step processing UI
📊 Progress simulation with interactive loaders
🎧 Audio preview (before & after)
⬇️ Download enhanced audio (WAV format)
🔐 Optional authentication (guest + user mode)
🧠 Tech Stack
Frontend
React (Vite)
TypeScript
Tailwind CSS
Context API (Auth + State management)
Lucide Icons
Backend
Flask (Python)
NumPy
Librosa
SciPy
Noisereduce
SoundFile (SF)
Pydub
📁 Project Structure
Audio-Processing-Web-App/
│
├── frontend/              # React + TypeScript UI
│   ├── src/
│   ├── public/
│   ├── package.json
│
├── backend/               # Flask API server
│   ├── app.py
│   ├── uploads/
│   ├── processed/
│   ├── venv/ (ignored)
│
├── README.md
└── .gitignore
⚙️ How It Works
User uploads an audio file (MP3/WAV)
Frontend sends file to Flask backend
Backend pipeline:
Noise reduction
Echo detection (autocorrelation)
Echo removal (adaptive filtering)
Reverb reduction (spectral masking)
Normalization
Processed audio is saved and returned
User can preview or download enhanced audio
🧪 Backend API Endpoints
🔹 Upload Audio
POST /api/upload
🔹 Process Audio
POST /api/process
🔹 Stream Processed Audio
GET /api/stream/<file_id>
🔹 Download Audio
GET /api/download/<file_id>
🖥️ Local Setup
1. Clone repo
git clone https://github.com/Avisrivastava15/Audio-Processing-Web-App.git
cd Audio-Processing-Web-App
2. Backend setup
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python app.py

Backend runs at:

http://localhost:5000
3. Frontend setup
cd frontend
npm install
npm run dev

Frontend runs at:

http://localhost:5173
🌐 Environment Variables
Frontend (.env)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
📸 UI Preview

(Add screenshots here later)

⚠️ Known Issues / Limitations
Heavy audio files may take longer processing time
Echo removal may slightly affect voice naturalness (tradeoff in DSP)
Backend runs locally (deployment needed for production use)
🚀 Future Improvements
Real-time audio processing (streaming)
Better deep learning-based enhancement model
Background noise classification
Deployment (Vercel + Render / AWS)
WebSocket-based progress tracking
👨‍💻 Author

Avi Srivastava

GitHub: @Avisrivastava15
