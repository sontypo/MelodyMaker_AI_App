from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import io
import wave
import time
import os
import random
import glob
import argparse
import torch
import torchaudio
from pydub import AudioSegment

app = Flask(__name__)
CORS(app)  

# @app.route('/generate', methods=['POST'])
# def generate_music():
#     """測試版本"""
#     try:
#         # 獲取請求數據
#         data = request.json
#         print(f"Received request: {data}")
        
#         # 提取參數
#         genre = data.get('genre', 'Pop')
#         # instruments = data.get('instruments', 'Piano')
#         # tempo = data.get('tempo', 'Medium')
#         # length = data.get('length', '30 seconds')
        
#         print(genre)
        
#         if GENERATE_MODE == 0:
#             selected_file = select_audio_file_mode_0(genre)
#         elif GENERATE_MODE == 1:
#             selected_file = select_audio_file_mode_1(genre)
#         elif GENERATE_MODE == 2:
#             selected_file = select_audio_file_mode_2(genre)

#         # 回傳檔案
#         return send_file(
#             selected_file,
#             mimetype='audio/basic',  # .au 檔案的 MIME type
#             as_attachment=True,
#             download_name=f"generated_{genre.lower()}_{int(time.time())}.au"
#         )
        
#     except Exception as e:
#         print(f"Error: {str(e)}")
#         return jsonify({
#             'status': 'error',
#             'message': str(e)
#         }), 500
        
@app.route('/generate', methods=['POST'])
def generate_music():
    """測試版本"""
    try:
        data = request.json
        print(f"Received request: {data}")

        genre = data.get('genre', 'Pop')
        generate_mode = int(data.get('generate_mode', GENERATE_MODE))  # <-- use mode from request

        print(f"Genre: {genre}, Generate Mode: {generate_mode}")

        if generate_mode == 0:
            selected_file = select_audio_file_mode_0(genre)
        elif generate_mode == 1:
            selected_file = select_audio_file_mode_1(genre)
        elif generate_mode == 2:
            selected_file = select_audio_file_mode_2(genre)
        else:
            return jsonify({'status': 'error', 'message': 'Invalid generate_mode'}), 400

        return send_file(
            selected_file,
            mimetype='audio/basic',
            as_attachment=True,
            download_name=f"generated_{genre.lower()}_{int(time.time())}.au"
        )
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
        
        
def select_audio_file_mode_0(genre, GENRES_FOLDER='genres'):
    """模式 0"""
    # 模擬處理時間
    time.sleep(1)
    
    # 從 genres 資料夾中隨機選擇一個 .au 檔案
    au_files = []
    
    # 尋找所有 .au 檔案
    if os.path.exists(GENRES_FOLDER):
        
        # 如果有特定的 genre 子資料夾，優先從該資料夾選擇
        genre_folder = os.path.join(GENRES_FOLDER, genre.lower())
        if os.path.exists(genre_folder):
            genre_files = glob.glob(os.path.join(genre_folder, '*.au'))
            if genre_files:
                au_files = genre_files
    
    if not au_files:
        # 如果找不到 .au 檔案，返回錯誤
        return jsonify({
            'status': 'error',
            'message': f'No .au files found in {GENRES_FOLDER} folder'
        }), 404
    
    # 隨機選擇一個檔案
    selected_file = random.choice(au_files)
    print(f"Selected file: {selected_file}")
    
    # 檢查檔案是否存在
    if not os.path.exists(selected_file):
        return jsonify({
            'status': 'error',
            'message': f'File not found: {selected_file}'
        }), 404   
        
    return selected_file

def select_audio_file_mode_1(genre, GENRES_FOLDER='rave_model'):
    """模式 1"""
    # 模擬處理時間
    time.sleep(1)

    # 直接取得記憶體中的 BytesIO 音訊物件
    au_buffer = generate_from_rave(genre, GENRES_FOLDER)

    # 設定指標回到開頭，避免部分資料沒送到前端
    au_buffer.seek(0)

    return au_buffer
        
def select_audio_file_mode_2(genre, GENRES_FOLDER='output'):
    """模式 2"""
    # 模擬處理時間
    time.sleep(1)
    
    # 從 genres 資料夾中隨機選擇一個 .au 檔案
    au_files = []
    
    # 尋找所有 .au 檔案
    if os.path.exists(GENRES_FOLDER):
        
        # 如果有特定的 genre 子資料夾，優先從該資料夾選擇
        genre_folder = os.path.join(GENRES_FOLDER, genre.lower())
        if os.path.exists(genre_folder):
            genre_files = glob.glob(os.path.join(genre_folder, '*.au'))
            if genre_files:
                au_files = genre_files
    
    if not au_files:
        # 如果找不到 .au 檔案，返回錯誤
        return jsonify({
            'status': 'error',
            'message': f'No .au files found in {GENRES_FOLDER} folder'
        }), 404
    
    # 隨機選擇一個檔案
    selected_file = random.choice(au_files)
    print(f"Selected file: {selected_file}")
    
    # 檢查檔案是否存在
    if not os.path.exists(selected_file):
        return jsonify({
            'status': 'error',
            'message': f'File not found: {selected_file}'
        }), 404   
        
    return selected_file
  
def generate_from_rave(genre, GENRES_FOLDER='rave_model'):
    """使用 RAVE 模型生成音樂並轉換為 .au 格式"""
    
    os.makedirs('tmp', exist_ok=True)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = torch.jit.load(f'{GENRES_FOLDER}/{genre}.ts').to(device).eval()
    
    duration = 30  # 假設生成 30 秒的音頻
    sample_rate = 44100  # 假設使用 44100 Hz 的取
    latent_size = 16  # 假設使用 16 通道的潛在向量
    upsample_ratio = 2048  # 假設使用 2048 的上
    
    latent_len = int(duration * sample_rate / upsample_ratio)
    latent = torch.randn(1, latent_size, latent_len).to(device)
    
    with torch.no_grad():
        audio_tensor = model.decode(latent).cpu().clamp(-1, 1)
        
    try:
        # a. 將 PyTorch 張量儲存為 .wav 格式到記憶體緩衝區
        wav_buffer = io.BytesIO()
        torchaudio.save(wav_buffer, audio_tensor.squeeze(0), sample_rate=sample_rate, format="wav")
        wav_buffer.seek(0) # 將指標移到開頭以便讀取

        # b. Pydub 從記憶體緩衝區讀取 .wav 數據
        audio_segment = AudioSegment.from_file(wav_buffer, format="wav")

        # c. Pydub 將音訊匯出為 .au 格式到另一個記憶體緩衝區
        au_buffer = io.BytesIO()
        audio_segment.export(au_buffer, format="au")
        au_buffer.seek(0) # 將指標移到開頭以便下一步寫入檔案

    except Exception as e:
        # 如果 pydub/ffmpeg 出錯，拋出例外
        raise RuntimeError(f"Audio conversion failed, possibly due to missing FFmpeg. Original error: {e}")
        
    return au_buffer
      

if __name__ == '__main__':
    # 設定命令行參數解析
    parser = argparse.ArgumentParser(description='Music Generation Server')
    parser.add_argument(
        '--generate_mode', 
        type=int, 
        choices=[0, 1, 2], 
        default=2,
        help='Generation mode: 0=Original Dataset, 1=Rave Generated, 2=Api Generated'
    )
    
    # 解析命令行參數
    args = parser.parse_args()
    GENERATE_MODE = args.generate_mode
    
    print(f"Starting server in generate mode: {GENERATE_MODE}")
    
    
    app.run(host='127.0.0.1', port=8000, debug=True)