import os
import uuid
import numpy as np
import librosa
import soundfile as sf
from scipy import signal
from scipy.signal import wiener, medfilt
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import noisereduce as nr
import tempfile
import warnings
import logging

warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})





# Configuration
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'mpeg'}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def remove_echo(audio, sr, echo_strength=0.3):
    """
    Remove echo from audio using adaptive filtering and echo detection
    """
    # Normalize audio
    audio = audio / (np.max(np.abs(audio)) + 1e-8)

    # Apply Wiener filter for echo reduction
    # This helps in reducing the reverberant tail
    filtered = wiener(audio.astype(float))

    # Detect and reduce echo peaks
    # Use autocorrelation to find echo delay
    autocorr = np.correlate(audio, audio, mode='full')
    center = len(autocorr) // 2
    autocorr = autocorr[center:]

    # Find significant peaks after the main peak (echoes)
    threshold = np.max(autocorr) * 0.1
    peaks, _ = signal.find_peaks(autocorr, height=threshold, distance=sr//10)

    if len(peaks) > 1:
        # Apply comb filter to reduce echoes
        delay_samples = peaks[1] if len(peaks) > 1 else int(sr * 0.02)
        delay_samples = min(delay_samples, int(sr * 0.1))  # Max 100ms delay

        # Create inverse comb filter
        b = np.zeros(delay_samples + 1)
        b[0] = 1.0
        b[-1] = -echo_strength

        filtered = signal.lfilter(b, [1.0], filtered)

    return filtered

def reduce_reverb(audio, sr, reverb_strength=0.5):
    """
    Reduce reverb using spectral masking and temporal smoothing
    """
    # Short-time Fourier Transform
    D = librosa.stft(audio)
    magnitude = np.abs(D)
    phase = np.angle(D)

    # Estimate reverb tail (decay)
    # Use median filtering to identify and reduce reverb tail
    median_size = int(sr * 0.05)  # 50ms window

    # Convert to dB scale for better processing
    mag_db = librosa.amplitude_to_db(magnitude)

    # Apply spectral gating to reduce reverb
    # Adaptive threshold based on frame energy
    frame_energy = np.mean(mag_db, axis=0)
    threshold = np.median(frame_energy) - 10  # 10dB below median

    # Create spectral mask
    mask = np.zeros_like(magnitude)
    for i in range(magnitude.shape[1]):
        frame_threshold = max(threshold, frame_energy[i] - 20)
        mask[:, i] = (mag_db[:, i] > frame_threshold).astype(float)

    # Smooth the mask to avoid artifacts
    kernel_size = 3
    mask = signal.medfilt2d(mask, kernel_size=kernel_size)

    # Apply mask to reduce reverb
    enhanced_magnitude = magnitude * mask

    # Reconstruct audio
    enhanced_D = enhanced_magnitude * np.exp(1j * phase)
    audio_enhanced = librosa.istft(enhanced_D, length=len(audio))

    return audio_enhanced

def enhance_audio(audio, sr):
    """
    Main audio enhancement pipeline
    """
    # Step 1: Noise reduction
    audio_clean = nr.reduce_noise(y=audio, sr=sr, stationary=True)

    # Step 2: Remove echo
    audio_no_echo = remove_echo(audio_clean, sr, echo_strength=0.4)

    # Step 3: Reduce reverb
    audio_no_reverb = reduce_reverb(audio_no_echo, sr, reverb_strength=0.6)

    # Step 4: Final noise reduction pass
    audio_final = nr.reduce_noise(y=audio_no_reverb, sr=sr, stationary=False)

    # Step 5: Normalize and apply gentle compression
    audio_final = librosa.util.normalize(audio_final)

    # Apply soft clipping to avoid distortion
    audio_final = np.tanh(audio_final * 2) / 2

    return audio_final

@app.route('/')
def home():
    return "Audio Backend is running 🚀"

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Audio processing server is running'})

@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_audio():
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response

    try:
        logger.info(f"Received upload request")
        logger.info(f"Files in request: {list(request.files.keys())}")
        logger.info(f"Content-Type: {request.content_type}")

        if 'audio' not in request.files:
            logger.error("No 'audio' key in request.files")
            return jsonify({'error': 'No file provided. Key "audio" not found'}), 400

        file = request.files['audio']
        if file.filename == '':
            logger.error("Empty filename")
            return jsonify({'error': 'No file selected'}), 400

        logger.info(f"Received file: {file.filename}")

        if not allowed_file(file.filename):
            logger.error(f"Invalid file type: {file.filename}")
            return jsonify({'error': 'Invalid file type. Only MP3 and WAV allowed'}), 400

        # Generate unique ID
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        original_ext = filename.rsplit('.', 1)[1].lower()

        # Save original file
        original_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.{original_ext}")
        file.save(original_path)
        logger.info(f"File saved to: {original_path}")

        # Load audio with librosa
        try:
            audio, sr = librosa.load(original_path, sr=None, mono=True)
            logger.info(f"Audio loaded: duration={len(audio)/sr:.2f}s, sr={sr}")
        except Exception as e:
            logger.error(f"Failed to load audio: {str(e)}")
            return jsonify({'error': f'Failed to load audio: {str(e)}'}), 400

        # Get audio info
        duration = len(audio) / sr
        file_size = os.path.getsize(original_path)

        response = jsonify({
            'success': True,
            'fileId': file_id,
            'originalName': filename,
            'duration': float(duration),
            'sampleRate': int(sr),
            'fileSize': file_size,
            'format': original_ext.upper()
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/process', methods=['POST', 'OPTIONS'])
def process_audio():
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response

    try:
        data = request.json
        file_id = data.get('fileId')

        if not file_id:
            return jsonify({'error': 'No file ID provided'}), 400

        # Find the uploaded file
        file_path = None
        original_ext = None
        for ext in ['wav', 'mp3']:
            test_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.{ext}")
            if os.path.exists(test_path):
                file_path = test_path
                original_ext = ext
                break

        if not file_path:
            return jsonify({'error': 'File not found'}), 404

        # Load audio
        audio, sr = librosa.load(file_path, sr=None, mono=True)

        # Process audio
        enhanced_audio = enhance_audio(audio, sr)

        # Save processed audio
        processed_filename = f"{file_id}_enhanced.wav"
        processed_path = os.path.join(PROCESSED_FOLDER, processed_filename)

        # Save as WAV for best quality
        sf.write(processed_path, enhanced_audio, sr, format='WAV')

        response = jsonify({
            'success': True,
            'message': 'Audio enhanced successfully',
            'processedFileId': file_id,
            'format': 'wav'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        logger.error(f"Process error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<file_id>', methods=['GET', 'OPTIONS'])
def download_audio(file_id):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response

    try:
        processed_path = os.path.join(PROCESSED_FOLDER, f"{file_id}_enhanced.wav")

        if not os.path.exists(processed_path):
            return jsonify({'error': 'Processed file not found'}), 404

        response = send_file(
            processed_path,
            as_attachment=True,
            download_name=f"enhanced_audio_{file_id}.wav",
            mimetype='audio/wav'
        )
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        logger.error(f"Download error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/stream/<file_id>', methods=['GET', 'OPTIONS'])
def stream_audio(file_id):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response

    try:
        processed_path = os.path.join(PROCESSED_FOLDER, f"{file_id}_enhanced.wav")

        if not os.path.exists(processed_path):
            return jsonify({'error': 'Processed file not found'}), 404

        response = send_file(
            processed_path,
            mimetype='audio/wav'
        )
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        logger.error(f"Stream error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/cleanup/<file_id>', methods=['DELETE', 'OPTIONS'])
def cleanup_files(file_id):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
        return response

    try:
        # Delete original files
        for ext in ['wav', 'mp3']:
            original_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.{ext}")
            if os.path.exists(original_path):
                os.remove(original_path)

        # Delete processed files
        for ext in ['wav', 'mp3']:
            processed_path = os.path.join(PROCESSED_FOLDER, f"{file_id}_enhanced.{ext}")
            if os.path.exists(processed_path):
                os.remove(processed_path)

        response = jsonify({'success': True, 'message': 'Files cleaned up'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        logger.error(f"Cleanup error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

def home():
    return "Backend is running 🚀"

if __name__ == '__main__':
    print("=" * 60)
    print("Audio Enhancement Server")
    print("=" * 60)
    print("Server running on: http://localhost:5000")
    print("Supported formats: MP3, WAV")
    print("Max file size: 100MB")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)

