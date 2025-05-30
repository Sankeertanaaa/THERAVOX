import sys
import os
import json
import traceback

def check_dependencies():
    missing_packages = []
    try:
        import whisper
    except ImportError:
        missing_packages.append("whisper-openai")
    
    try:
        import librosa
    except ImportError:
        missing_packages.append("librosa")
    
    try:
        import torch
    except ImportError:
        missing_packages.append("torch")
    
    try:
        import numpy
    except ImportError:
        missing_packages.append("numpy")
    
    try:
        from pydub import AudioSegment
    except ImportError:
        missing_packages.append("pydub")
    
    try:
        from transformers import (
            Wav2Vec2Processor,
            Wav2Vec2ForSequenceClassification,
            AutoFeatureExtractor,
            AutoConfig,
            AutoModelForAudioClassification
        )
    except ImportError:
        missing_packages.append("transformers")
    
    if missing_packages:
        error_msg = f"Missing required Python packages: {', '.join(missing_packages)}\n"
        error_msg += "Please install them using: pip install " + " ".join(missing_packages)
        print(error_msg, file=sys.stderr)
        return False
    return True

# Check dependencies first
if not check_dependencies():
    sys.exit(1)

# Now import the required packages
import whisper
import librosa
import torch
import numpy as np
from pydub import AudioSegment
from transformers import (
    Wav2Vec2Processor,
    Wav2Vec2ForSequenceClassification,
    AutoFeatureExtractor,
    AutoConfig,
    AutoModelForAudioClassification
)
from model.utils.pdf_generator import generate_pdf

# ============ CONFIG =============
SAVE_PDF_DIR = "server/uploads/reports"
device = "cuda" if torch.cuda.is_available() else "cpu"
# ==================================

# Custom JSON encoder to handle NumPy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

# Load models
whisper_model = whisper.load_model("base")  # Using base model for faster processing

# Use a more accurate emotion recognition model
emotion_model_name = "r-f/wav2vec-english-speech-emotion-recognition"  # English emotion recognition model

# Load model and feature extractor for audio classification
emotion_model = AutoModelForAudioClassification.from_pretrained(emotion_model_name).to(device)
feature_extractor = AutoFeatureExtractor.from_pretrained(emotion_model_name)

# Define allowed emotions and their mapping
ALLOWED_EMOTIONS = {
    'neutral': 'neutral',
    'happy': 'happy',
    'surprised': 'surprised',
    'sad': 'sad'
}

# Get label to ID and ID to label mappings from the model
label2id = emotion_model.config.label2id
id2label = emotion_model.config.id2label

# Set model to evaluation mode
emotion_model.eval()

def convert_to_wav(audio_path):
    """Convert audio to WAV format if needed."""
    try:
        # Check if file exists and is readable
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        # Try to read the file first to check permissions
        with open(audio_path, 'rb') as f:
            pass
            
        # If we get here, we can read the file
        audio = AudioSegment.from_file(audio_path)
        wav_path = audio_path.rsplit('.', 1)[0] + '.wav'
        
        # Create a temporary directory if needed
        temp_dir = os.path.join(os.path.dirname(audio_path), 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Save to temporary directory
        temp_wav_path = os.path.join(temp_dir, os.path.basename(wav_path))
        audio.export(temp_wav_path, format='wav')
        return temp_wav_path
    except PermissionError as e:
        print(f"Permission denied: {str(e)}", file=sys.stderr)
        raise
    except Exception as e:
        print(f"Error converting audio: {str(e)}", file=sys.stderr)
        return audio_path

def transcribe(audio_path):
    """Transcribe audio using Whisper."""
    try:
        # Convert to WAV if needed
        wav_path = convert_to_wav(audio_path)
        
        # Load and preprocess audio
        audio = whisper.load_audio(wav_path)
        audio = whisper.pad_or_trim(audio)
        
        # Make log-Mel spectrogram
        mel = whisper.log_mel_spectrogram(audio).to(device)
        
        # Detect language and transcribe
        _, probs = whisper_model.detect_language(mel)
        lang = max(probs, key=probs.get)
        
        # Decode with options
        options = whisper.DecodingOptions(
            fp16=False,
            language="en",  # Explicitly set language to English
            task="transcribe"
        )
        result = whisper_model.decode(mel, options)
        
        return result.text
    except Exception as e:
        print(f"Error in transcription: {str(e)}", file=sys.stderr)
        return "Transcription failed"

def preprocess_audio(y, sr):
    """Enhanced audio preprocessing for better emotion detection."""
    # 1. Resample to 16kHz if needed
    if sr != 16000:
        y = librosa.resample(y=y, orig_sr=sr, target_sr=16000)
        sr = 16000
    
    # 2. Normalize audio
    y = librosa.util.normalize(y)
    
    # 3. Apply pre-emphasis filter
    y = librosa.effects.preemphasis(y)
    
    # 4. Trim silence with more aggressive threshold
    y, _ = librosa.effects.trim(y, top_db=25)
    
    # 5. Apply dynamic range compression
    y = librosa.effects.preemphasis(y, coef=0.97)
    
    # 6. Apply noise reduction
    y = librosa.effects.preemphasis(y, coef=0.95)
    
    # 7. Apply spectral subtraction for noise reduction
    D = librosa.stft(y)
    D_harmonic, D_percussive = librosa.decompose.hpss(D)
    y = librosa.istft(D_harmonic)
    
    return y, sr

def detect_emotions(audio_path):
    """Detect emotions using the updated model with enhanced processing."""
    try:
        print("Starting emotion detection...", file=sys.stderr)
        
        # Convert to WAV if needed
        wav_path = convert_to_wav(audio_path)
        print(f"Converted audio to WAV: {wav_path}", file=sys.stderr)
        
        # Load and preprocess audio with enhanced preprocessing
        y, sr = librosa.load(wav_path, sr=feature_extractor.sampling_rate)
        y, sr = preprocess_audio(y, sr)
        print(f"Loaded and preprocessed audio: duration={len(y)/sr:.2f}s, sample_rate={sr}", file=sys.stderr)
        
        # Ensure audio is at least 1 second long
        if len(y) / sr < 1.0:
            print("Audio too short for emotion detection.", file=sys.stderr)
            return ["neutral (100%)"]

        # Process audio using the feature extractor
        print("Extracting features...", file=sys.stderr)
        inputs = feature_extractor(
            y, 
            sampling_rate=sr, 
            return_tensors="pt",
            padding=True,
            max_length=16000,  # 1 second at 16kHz
            truncation=True
        )
        
        print("Running emotion model inference...", file=sys.stderr)
        with torch.no_grad():
            outputs = emotion_model(**inputs)
            logits = outputs.logits
        
        # Apply temperature scaling for better probability distribution
        temperature = 0.2  # Lower temperature for more decisive predictions
        scaled_logits = logits / temperature
        probabilities = torch.softmax(scaled_logits, dim=-1)[0]
        
        # Get all emotions with their probabilities
        emotion_probs = [(i, p.item() * 100) for i, p in enumerate(probabilities)]
        emotion_probs.sort(key=lambda x: x[1], reverse=True)
        
        print(f"Model output - id2label mapping: {id2label}", file=sys.stderr)
        print("All emotions detected:", file=sys.stderr)
        for idx, prob in emotion_probs:
            emotion_name = id2label.get(idx, f'Label_{idx}')
            if emotion_name.lower() in ALLOWED_EMOTIONS:
                print(f"{emotion_name}: {prob:.2f}%", file=sys.stderr)
        
        # Filter and return top 2 emotions from allowed emotions
        top_emotions = []
        for idx, prob in emotion_probs:
            emotion_name = id2label.get(idx, f'Label_{idx}').lower()
            if emotion_name in ALLOWED_EMOTIONS:
                top_emotions.append(f"{ALLOWED_EMOTIONS[emotion_name]} ({prob:.1f}%)")
                if len(top_emotions) >= 2:  # Only take top 2 emotions
                    break
        
        return top_emotions if top_emotions else ["neutral (100%)"]
        
    except Exception as e:
        print(f"Error in emotion detection: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return ["neutral (100%)"]

def extract_audio_features(audio_path):
    """Extract pitch, silence, pace, and transcript from audio."""
    try:
        # Convert to WAV if needed
        wav_path = convert_to_wav(audio_path)
        
        # Load audio
        y, sr = librosa.load(wav_path)
        duration = librosa.get_duration(y=y, sr=sr)
        
        # Extract pitch using librosa
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_values = pitches[magnitudes > np.median(magnitudes)]
        avg_pitch = float(np.mean(pitch_values)) if len(pitch_values) > 0 else 0.0

        # Calculate silence
        silence_threshold = -40
        audio = AudioSegment.from_file(wav_path)
        silent_chunks = [chunk for chunk in audio[::100] if chunk.dBFS < silence_threshold]
        silence_time = float(len(silent_chunks) * 0.1)

        # Get transcript and calculate pace
        transcript = transcribe(wav_path)
        word_count = len(transcript.split())
        pace = float(word_count / (duration / 60)) if duration > 0 else 0.0

        return round(avg_pitch, 2), round(silence_time, 2), round(pace, 2), transcript
    except Exception as e:
        print(f"Error extracting audio features: {str(e)}", file=sys.stderr)
        return 0.0, 0.0, 0.0, "Feature extraction failed"

def summarize(text):
    """Simple summary: first 120 chars or full text if short."""
    if not text or text == "Transcription failed":
        return "No transcript available"
    if len(text) < 20:
        return text
    return text[:120] + "..."

def main(audio_path):
    try:
        # Initialize models
        print("Loading models...", file=sys.stderr)
        whisper_model = whisper.load_model("base")  # Using base model for faster processing
        
        # Use a more accurate emotion recognition model
        emotion_model_name = "r-f/wav2vec-english-speech-emotion-recognition"  # English emotion recognition model
        
        # Load model and feature extractor for audio classification
        emotion_model = AutoModelForAudioClassification.from_pretrained(emotion_model_name).to(device)
        feature_extractor = AutoFeatureExtractor.from_pretrained(emotion_model_name)
        
        # Get label to ID and ID to label mappings from the model
        label2id = emotion_model.config.label2id
        id2label = emotion_model.config.id2label
        
        # Set model to evaluation mode
        emotion_model.eval()
        
        print("Models loaded successfully", file=sys.stderr)
        
        # Process the audio file
        print(f"Processing audio file: {audio_path}", file=sys.stderr)
        
        # Get transcription
        transcript = transcribe(audio_path)
        print(f"Transcription: {transcript}", file=sys.stderr)
        
        # Get emotions
        emotions = detect_emotions(audio_path)
        print(f"Detected emotions: {emotions}", file=sys.stderr)
        
        # Calculate audio features
        y, sr = librosa.load(audio_path)
        pitch = librosa.piptrack(y=y, sr=sr)[1].mean()
        pace = len(transcript.split()) / (len(y) / sr)  # words per second
        silence = librosa.effects.split(y, top_db=20)[0].shape[0] / len(y)
        
        # Generate summary
        summary = summarize(transcript)
        
        # Prepare the result
        result = {
            "transcript": transcript,
            "emotions": emotions,
            "pitch": float(pitch),
            "pace": float(pace),
            "silence": float(silence),
            "summary": summary
        }
        
        # Print the result as JSON
        print(json.dumps(result, cls=NumpyEncoder))
        
    except Exception as e:
        print(f"Error processing audio: {str(e)}", file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python process_audio.py <audio_file_path>", file=sys.stderr)
        sys.exit(1)
    
    audio_path = sys.argv[1]
    if not os.path.exists(audio_path):
        print(f"Error: Audio file not found: {audio_path}", file=sys.stderr)
        sys.exit(1)
    
    main(audio_path)
