import torch
import librosa
from transformers import Wav2Vec2Processor, Wav2Vec2ForSequenceClassification

# Choose device
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load the pre-trained model and processor from Hugging Face
model_name = "superb/wav2vec2-base-superb-er"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name).to(device)

def predict_emotion(audio_path):
    # Load audio
    y, sr = librosa.load(audio_path, sr=16000)
    # Preprocess
    inputs = processor(y, sampling_rate=sr, return_tensors="pt", padding=True).to(device)
    # Predict
    with torch.no_grad():
        logits = model(**inputs).logits
    # For multi-label, use sigmoid; for single-label, use softmax
    probs = torch.sigmoid(logits).squeeze().cpu().numpy()
    labels = model.config.id2label
    # Get emotions with probability > 0.3
    emotions = [labels[i] for i, p in enumerate(probs) if p > 0.3]
    return emotions

# Example usage
if __name__ == "__main__":
    audio_file = "path/to/your/audio.wav"
    emotions = predict_emotion(audio_file)
    print("Predicted emotions:", emotions)
