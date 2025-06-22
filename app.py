from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import io
import wave
import time
import os
import random
import glob

app = Flask(__name__)
CORS(app)  

# 設定 genres 資料夾路徑
GENRES_FOLDER = 'genres' 

@app.route('/generate', methods=['POST'])
def generate_music():
    """測試版本"""
    try:
        # 獲取請求數據
        data = request.json
        print(f"Received request: {data}")
        
        # 提取參數
        genre = data.get('genre', 'Pop')
        instruments = data.get('instruments', 'Piano')
        tempo = data.get('tempo', 'Medium')
        length = data.get('length', '30 seconds')
        
        print(genre)
        
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
        
        # 回傳檔案
        return send_file(
            selected_file,
            mimetype='audio/basic',  # .au 檔案的 MIME type
            as_attachment=True,
            download_name=f"generated_{genre.lower()}_{int(time.time())}.au"
        )
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    # 確保 genres 資料夾存在
    if not os.path.exists(GENRES_FOLDER):
        print(f"Warning: {GENRES_FOLDER} folder not found!")
        print(f"Please create the folder at: {os.path.abspath(GENRES_FOLDER)}")
    else:
        # 顯示找到的檔案數量
        au_files = glob.glob(os.path.join(GENRES_FOLDER, '**', '*.au'), recursive=True)
        print(f"Found {len(au_files)} .au files in {GENRES_FOLDER}")
    
    app.run(host='127.0.0.1', port=8000, debug=True)