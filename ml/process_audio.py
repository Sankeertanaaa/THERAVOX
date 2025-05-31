import sys
import os
import json
import traceback

# Add the ml directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
            AutoModelForAudioClassification,
            pipeline
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
    AutoModelForAudioClassification,
    pipeline
)
from model.utils.pdf_generator import generate_pdf

# ============ CONFIG =============
SAVE_PDF_DIR = "server/uploads/reports"
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load text emotion classification pipeline
# print("Loading text emotion model...", file=sys.stderr)
# text_emotion_classifier = pipeline("sentiment-analysis", model="j-hartmann/emotion-english-distilroberta-base", device=0 if device=="cuda" else -1)
# print("Text emotion model loaded successfully", file=sys.stderr)

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
    'sad': 'sad',
    'angry': 'angry'
}

# Get label to ID and ID to label mappings from the model
label2id = emotion_model.config.label2id
id2label = emotion_model.config.id2label

# Set model to evaluation mode
emotion_model.eval()

# def analyze_text_emotions(text):
#     """Analyze emotions from text transcript using a pre-trained model."""
#     try:
#         if not text or text == "Transcription failed":
#             return []
#         # The dair-ai/emotion model outputs a list of dictionaries with label and score
#         results = text_emotion_classifier(text)
#         // console.log('[DashboardPatient] Raw text emotion analysis results:', results);
#         // Filter and format results (e.g., only report top emotions or those above a threshold)
#         formatted_emotions = []
#         # Example: Get the top 3 emotions with score > 0.5
#         for result in results[0]: # The pipeline returns a list containing one dictionary per input text
#             if result['score'] > 0.5:
#                  formatted_emotions.append(f"{result['label']} ({result['score']:.1%})")
#         return formatted_emotions
#     except Exception as e:
#         print(f"Error analyzing text emotions: {str(e)}", file=sys.stderr)
#         traceback.print_exc(file=sys.stderr)
#         return []

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
        emotion_probs = [(id2label.get(i, f'Label_{i}').lower(), p.item() * 100) for i, p in enumerate(probabilities)]
        
        print("All detected emotions with probabilities:", file=sys.stderr)
        for emotion, prob in emotion_probs:
            print(f"{emotion}: {prob:.2f}%", file=sys.stderr)

        # Filter and collect allowed emotions above a threshold
        reported_emotions = []
        threshold = 15.0 # Only report emotions with probability above this threshold
        
        for emotion, prob in sorted(emotion_probs, key=lambda item: item[1], reverse=True):
            if emotion in ALLOWED_EMOTIONS and prob >= threshold:
                 reported_emotions.append(f"{ALLOWED_EMOTIONS[emotion]} ({prob:.1f}%)")
            # Optional: include the top emotion even if below threshold if no others meet it
            # if not reported_emotions and emotion in ALLOWED_EMOTIONS:
            #     reported_emotions.append(f"{ALLOWED_EMOTIONS[emotion]} ({prob:.1f}%)")
            #     break

        # If no emotions are above the threshold, report the top one regardless
        if not reported_emotions and emotion_probs:
            top_emotion, top_prob = sorted(emotion_probs, key=lambda item: item[1], reverse=True)[0]
            if top_emotion in ALLOWED_EMOTIONS:
                 reported_emotions.append(f"{ALLOWED_EMOTIONS[top_emotion]} ({top_prob:.1f}%)")
            else: # If even the top emotion isn't in ALLOWED_EMOTIONS, default to neutral
                 reported_emotions.append("neutral (100%)")

        # If no emotions were detected at all (very unlikely but for safety)
        if not reported_emotions:
             reported_emotions.append("neutral (100%)")

        print(f"Reported emotions: {reported_emotions}", file=sys.stderr)
        
        return reported_emotions
        
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

def main(audio_path, patient_name="N/A", patient_age="N/A", patient_gender="N/A"):
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
        
        # Get audio emotions
        audio_emotions = detect_emotions(audio_path)
        print(f"Detected audio emotions: {audio_emotions}", file=sys.stderr)

        # Calculate audio features
        y, sr = librosa.load(audio_path)
        pitch = librosa.piptrack(y=y, sr=sr)[1].mean()
        pace = len(transcript.split()) / (len(y) / sr) if (len(y)/sr) > 0 else 0.0  # words per second, handle division by zero
        silence = librosa.effects.split(y, top_db=20)[0].shape[0] / len(y) if len(y) > 0 else 0.0 # silence duration ratio, handle division by zero
        
        # Generate summary
        summary = summarize(transcript)
        
        # Prepare the result including patient info and both emotion types
        result = {
            "patientName": patient_name,
            "patientAge": patient_age,
            "patientGender": patient_gender,
            "transcript": transcript,
            "audioEmotions": audio_emotions,
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
    if len(sys.argv) < 2 or len(sys.argv) > 5:
        print("Usage: python process_audio.py <audio_file_path> [<patient_name>] [<patient_age>] [<patient_gender>] ", file=sys.stderr)
        sys.exit(1)
    
    audio_path = sys.argv[1]
    patient_name = sys.argv[2] if len(sys.argv) > 2 else "N/A"
    patient_age = sys.argv[3] if len(sys.argv) > 3 else "N/A"
    patient_gender = sys.argv[4] if len(sys.argv) > 4 else "N/A"

    if not os.path.exists(audio_path):
        print(f"Error: Audio file not found: {audio_path}", file=sys.stderr)
        sys.exit(1)
    
    main(audio_path, patient_name, patient_age, patient_gender)
