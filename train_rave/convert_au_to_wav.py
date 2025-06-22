import os
import subprocess
import argparse

def convert_au_to_wav(input_root, output_root):
    for root, dirs, files in os.walk(input_root):
        for file in files:
            if file.endswith(".au"):
                input_file = os.path.join(root, file)
                # Get relative path to input_root
                rel_path = os.path.relpath(input_file, input_root)
                # Change extension to .wav
                rel_path_wav = os.path.splitext(rel_path)[0] + ".wav"
                output_file = os.path.join(output_root, rel_path_wav)
                output_dir = os.path.dirname(output_file)
                if not os.path.exists(output_dir):
                    os.makedirs(output_dir)
                # Run ffmpeg conversion
                cmd = [
                    "ffmpeg",
                    "-i", input_file,
                    "-ac", "1",
                    "-ar", "44100",
                    output_file
                ]
                print(f"Converting {input_file} to {output_file}...")
                subprocess.run(cmd)
    print("✅ All files converted!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert .au files to .wav using ffmpeg.")
    parser.add_argument("--input_root", type=str, required=True, help="Root directory containing .au files.")
    parser.add_argument("--output_root", type=str, required=True, help="Root directory to save .wav files.")
    args = parser.parse_args()

    convert_au_to_wav(args.input_root, args.output_root)