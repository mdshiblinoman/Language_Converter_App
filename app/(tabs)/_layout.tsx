import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Converter',
        }}
      />
      <Stack.Screen
        name="text-converter"
        options={{
          title: 'Text Converter',
        }}
      />
      <Stack.Screen
        name="voice-converter"
        options={{
          title: 'Voice Converter',
        }}
      />
      <Stack.Screen
        name="audio-converter"
        options={{
          title: 'Audio Converter',
        }}
      />
      <Stack.Screen
        name="video-converter"
        options={{
          title: 'Video Converter',
        }}
      />
      <Stack.Screen
        name="pdf-converter"
        options={{
          title: 'PDF Converter',
        }}
      />
      <Stack.Screen
        name="docs-converter"
        options={{
          title: 'Docs Converter',
        }}
      />
      <Stack.Screen
        name="other-converter"
        options={{
          title: 'Other Converter',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Stack>
  );
}
