import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: 'AIzaSyAk9tChp8bAvAqrSOSBmPjrXd49IV2pXbg',
    authDomain: 'language-converter-8681e.firebaseapp.com',
    databaseURL: 'https://language-converter-8681e-default-rtdb.firebaseio.com',
    projectId: 'language-converter-8681e',
    storageBucket: 'language-converter-8681e.firebasestorage.app',
    messagingSenderId: '725003905970',
    appId: '1:725003905970:web:a49b5f74e4abb1735192ab',
    measurementId: 'G-HY73QKLG8F',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;

try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch {
    auth = getAuth(app);
}

export { auth };
