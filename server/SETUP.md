# Language Converter Server Setup Guide

## Prerequisites

The server requires API keys to function. Choose one of the providers below:

### Option 1: OpenAI (Recommended for Production)

OpenAI provides excellent speech transcription (Whisper) and text-to-speech capabilities.

**Steps:**
1. [Get OpenAI API Key](https://platform.openai.com/api-keys)
   - Sign up or log in to OpenAI
   - Go to API Keys section
   - Create a new API key

2. Update `.env` file:
   ```
   AUDIO_TRANSLATION_PROVIDER=openai
   OPENAI_API_KEY=sk-your-api-key-here
   OPENAI_TTS_VOICE=alloy
   ```

3. Available voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

**Costs:**
- Whisper: $0.02 per minute of audio
- Text-to-Speech: $0.015 per 1K characters

---

### Option 2: Google Gemini (Free with limited usage)

Google Gemini provides free AI services with generous rate limits.

**Steps:**
1. [Get Gemini API Key](https://aistudio.google.com/app/apikeys)
   - Go to Google AI Studio
   - Click "Get API Key"
   - Create new API key for free

2. Update `.env` file:
   ```
   AUDIO_TRANSLATION_PROVIDER=gemini
   GEMINI_API_KEY=your-gemini-api-key
   GEMINI_TRANSCRIBE_MODEL=gemini-2.0-flash
   GEMINI_TRANSLATE_MODEL=gemini-2.0-flash
   GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
   GEMINI_TTS_VOICE=Kore
   ```

3. Available voices: `Kore`, and others (check Gemini documentation)

**Costs:**
- Free tier available with usage limits
- Paid plans available for higher volumes

---

## Features by Provider

| Feature | OpenAI | Gemini |
|---------|--------|--------|
| Text Translation | ✅ (via free API) | ✅ |
| Audio Transcription | ✅ (Whisper) | ✅ |
| Audio Translation | ✅ | ✅ |
| Video Translation | ✅ | ✅ |
| Text-to-Speech | ✅ | ✅ |
| Document Translation | ✅ | ✅ |
| PDF Translation | ✅ | ✅ |

---

## File Translation Features

### Audio/Video Files
- Extract audio from video
- Transcribe speech to text
- Translate text
- Generate dubbed audio
- Combine with original video

**Supported formats:** MP3, WAV, M4A, OGG, FLAC, MP4, MOV, MKV, WebM, MPEG

### PDF Files
- Extract text
- Translate content
- Generate translated PDF

### Documents (Word/Text)
- Support for DOCX, TXT, RTF
- Extract text
- Translate content
- Return as plain text

---

## Installation & Running

```bash
# Install dependencies
npm install

# Start server (development)
npm run dev

# Start server (production)
npm start
```

Server will run on `http://localhost:4000`

### Health Check
```bash
curl http://localhost:4000/health
# Response: {"status":"ok"}
```

---

## API Endpoints

### Text Translation
```
POST /api/text/translate
```

### Audio Translation
```
POST /api/audio/translate
- Body: multipart/form-data
- Fields: audio (file), sourceCode (auto|language), targetCode (language)
```

### Video Translation with Dubbing
```
POST /api/video/translate
- Body: multipart/form-data
- Fields: video (file), sourceCode (auto|language), targetCode (language)
```

### PDF Translation
```
POST /api/pdf/translate
- Body: multipart/form-data
- Fields: pdf (file), sourceCode (auto|language), targetCode (language)
```

### Document Translation
```
POST /api/docs/translate
- Body: multipart/form-data
- Fields: document (file), sourceCode (auto|language), targetCode (language)
```

---

## Troubleshooting

### Error: "OPENAI_API_KEY is not configured"
**Solution:** Add your OpenAI API key to `.env` file

### Error: "GEMINI_API_KEY is not configured"
**Solution:** Add your Gemini API key to `.env` file and set `AUDIO_TRANSLATION_PROVIDER=gemini`

### Error: "Could not transcribe speech from this audio file"
**Possible causes:**
- Audio file is corrupted
- Audio quality is too poor
- No speech in the audio
- Wrong source language specified
- FFmpeg not installed (needed for video processing)

### Error: "ffmpeg binary is not available"
**Solution:** Install ffmpeg
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

---

## Environment Variables Reference

```env
# Server Port
PORT=4000

# CORS Configuration
ALLOWED_ORIGIN=*

# Audio Provider Selection
AUDIO_TRANSLATION_PROVIDER=openai  # or 'gemini'

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_TTS_VOICE=alloy

# Gemini Configuration
GEMINI_API_KEY=...
GEMINI_TRANSCRIBE_MODEL=gemini-2.0-flash
GEMINI_TRANSLATE_MODEL=gemini-2.0-flash
GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
GEMINI_TTS_VOICE=Kore
```

---

## Next Steps

1. Choose a provider (OpenAI or Gemini)
2. Get API key
3. Update `.env` file
4. Start the server
5. Test endpoints

That's it! The language converter is ready to use.
