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
        name="converter"
        options={{
          title: 'Language Converter',
        }}
      />
    </Stack>
  );
}
