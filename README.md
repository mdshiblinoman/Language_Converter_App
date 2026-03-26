# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Firebase Authentication Setup

1. Create a Firebase project in the Firebase Console.
2. Enable `Authentication` and at least the `Email/Password` sign-in provider.
3. Copy `.env.example` to `.env` and fill in your Firebase web config values.
4. Restart Expo after updating `.env` so the `EXPO_PUBLIC_*` values are loaded.

Required environment variables:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_TRANSLATION_SERVER_URL` (optional in emulator, recommended on real device)

## PDF Translation (Upload -> Translate -> Download)

This project now includes a dedicated backend for PDF translation and download.

### 1) Configure environments

At project root:

```bash
cp .env.example .env
```

At server folder:

```bash
cp server/.env.example server/.env
```

If you run Expo on a real device, set `EXPO_PUBLIC_TRANSLATION_SERVER_URL` in root `.env` to your computer LAN IP, for example:

```bash
EXPO_PUBLIC_TRANSLATION_SERVER_URL=http://192.168.0.25:4000
```

### 2) Start backend server

```bash
npm run server:start
```

Or in watch mode:

```bash
npm run server:dev
```

Backend health endpoint:

```bash
http://localhost:4000/health
```

### 3) Use from app

1. Sign in.
2. Choose source and target languages.
3. In `PDF Translation` card, tap `Choose PDF`.
4. Tap `Translate PDF & Download`.
5. The app downloads (web) or opens share/save dialog (mobile) for translated PDF.

## Audio Translation (Upload -> Translate -> Download Audio)

This project now supports converting uploaded audio speech into another language and returning a downloadable translated audio file.

### 1) Configure server provider credentials

In `server/.env`, set:

```bash
AUDIO_TRANSLATION_PROVIDER=gemini

# Gemini (used when AUDIO_TRANSLATION_PROVIDER=gemini)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_TRANSCRIBE_MODEL=gemini-2.0-flash
GEMINI_TRANSLATE_MODEL=gemini-2.0-flash
GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
GEMINI_TTS_VOICE=Kore

# OpenAI (used when AUDIO_TRANSLATION_PROVIDER=openai)
OPENAI_API_KEY=your_openai_api_key
OPENAI_TTS_VOICE=alloy
```

Notes:

- Set `AUDIO_TRANSLATION_PROVIDER` to `gemini` or `openai`.
- For Gemini mode, `GEMINI_API_KEY` is required.
- For OpenAI mode, `OPENAI_API_KEY` is required.
- Voice fields are optional and have defaults.

### 2) Start backend server

```bash
npm run server:start
```

### 3) Use from app

1. Open `Audio File` converter tab.
2. Choose source and target languages.
3. Tap `Choose Audio File` and select an audio file.
4. Tap `Translate Audio & Download`.
5. The app downloads (web) or opens share/save dialog (mobile) for translated MP3 audio.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
