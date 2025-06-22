#!/bin/bash

set -e

# Convert .au to .wav 
echo "Converting .au files to .wav..."
python convert_au_to_wav.py --input_root /audio/au_files --output_root /audio/wav_files

# Preprocess for RAVE
echo "Preprocessing WAV files for RAVE..."
rave preprocess --input_path /audio/folder --output_path /dataset/path --channels 1

# Train RAVE Model
echo "Training RAVE model..."
rave train --db_path /dataset/path --out_path /model/out --name give_a_name --channels 1 --workers 16 --gpu 0 --config noise

# Export RAVE Model 
echo "Exporting RAVE model..."
rave export --name your_model_name --run /model/out/version/best.ckpt --output model/export/

# Generate Audio from Trained Model 
echo "Generating new audio from trained model..."
python generate_from_ts.py --model_path /model/export/model.ts --output_dir /generate/path 

echo "Pipeline complete!"
