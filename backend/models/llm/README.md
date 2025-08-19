# LLM Models Directory (Optional)

Directory นี้สำหรับ Local LLM models (ไม่บังคับ)

## Options สำหรับ LLM:

### Option 1: API Services (แนะนำ)
```python
# ไม่ต้องวาง model files
# ใช้ API keys ใน environment variables:
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

### Option 2: Local LLM Servers
```python
# Ollama
# Install: curl -fsSL https://ollama.ai/install.sh | sh
# Run: ollama serve
# Models: ollama pull llama2

# LM Studio
# Download และ run LM Studio
# Load model จาก Hugging Face
```

### Option 3: Local Model Files (ขั้นสูง)
วางไฟล์เหล่านี้หากใช้ local LLM:

```
backend/models/llm/
├── model.bin         # Model weights
├── config.json       # Model configuration  
├── tokenizer.json    # Tokenizer settings
├── vocab.txt         # Vocabulary file
└── special_tokens_map.json
```

## Current LLM Status:
ปัจจุบันใน `backend/api/compose.py` ใช้ **Mock LLM** ที่:
- สร้างประโยคจาก templates
- ไม่ต้องการ API keys
- พร้อมใช้งานทันที

## การอัปเกรด LLM:

### 1. OpenAI Integration:
```python
import openai

def generate_sentence(hand_result, face_result):
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{
            "role": "user", 
            "content": f"Create sentence: hand={hand_result}, emotion={face_result}"
        }]
    )
    return response.choices[0].message.content
```

### 2. Local LLM Integration:
```python
import requests

def generate_sentence(hand_result, face_result):
    response = requests.post('http://localhost:11434/api/generate', {
        'model': 'llama2',
        'prompt': f"Create sentence: hand={hand_result}, emotion={face_result}"
    })
    return response.json()['response']
```

## Environment Setup:
```bash
# สำหรับ API services
echo "OPENAI_API_KEY=your_key" >> .env
echo "GOOGLE_API_KEY=your_key" >> .env

# สำหรับ Local LLM
echo "LLM_TYPE=local" >> .env
echo "LLM_ENDPOINT=http://localhost:11434" >> .env
```

ระบบจะทำงานได้โดยไม่ต้องมี LLM models ในโฟลเดอร์นี้
