import torch
import torchaudio
import os
import argparse

def main():
    parser = argparse.ArgumentParser(description="Generate audio from RAVE latent noise.")
    parser.add_argument('--model_path', type=str, required=True, help='Path to the exported .ts RAVE model.')
    parser.add_argument('--output_dir', type=str, required=True, help='Directory to save generated audio files.')
    parser.add_argument('--duration', type=int, default=30, help='Length of generated audio in seconds.')
    parser.add_argument('--num_samples', type=int, default=1, help='Number of audio samples to generate.')
    parser.add_argument('--sample_rate', type=int, default=44100, choices=[44100, 48000], help='Sample rate of output audio.')
    parser.add_argument('--latent_size', type=int, default=16, help='Latent channel size. Use 16 for mono, 32 for stereo usually.')
    parser.add_argument('--upsample_ratio', type=int, default=2048, help='RAVE upsampling ratio. Usually 2048.')
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print(f"🔄 Loading model from {args.model_path}")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = torch.jit.load(args.model_path).to(device).eval()

    print(f"🎧 Generating {args.num_samples} audio sample(s)...")
    for i in range(args.num_samples):
        latent_len = int(args.duration * args.sample_rate / args.upsample_ratio)
        latent = torch.randn(1, args.latent_size, latent_len).to(device)

        with torch.no_grad():
            audio = model.decode(latent).cpu().clamp(-1, 1)

        out_path = os.path.join(args.output_dir, f"sample_{i + 1}.wav")
        torchaudio.save(out_path, audio.squeeze(0), sample_rate=args.sample_rate)

    print(f"✅ Done! Files saved to: {args.output_dir}")

if __name__ == "__main__":
    main()
