import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

type SignUpFormProps = {
    name: string;
    phoneNumber: string;
    email: string;
    password: string;
    confirmPassword: string;
    isSubmitting: boolean;
    authError: string;
    onNameChange: (value: string) => void;
    onPhoneNumberChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onSubmit: () => void;
    onSwitchToSignIn: () => void;
};

export function SignUpForm({
    name,
    phoneNumber,
    email,
    password,
    confirmPassword,
    isSubmitting,
    authError,
    onNameChange,
    onPhoneNumberChange,
    onEmailChange,
    onPasswordChange,
    onConfirmPasswordChange,
    onSubmit,
    onSwitchToSignIn,
}: SignUpFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <View className="gap-4">
            <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">Create Account</Text>
            <Text className="text-base text-slate-600 dark:text-slate-300">
                Sign up to start using Language Converter.
            </Text>

            <View className="gap-4">
                <TextInput
                    value={name}
                    onChangeText={onNameChange}
                    autoCapitalize="words"
                    placeholder="Name"
                    placeholderTextColor="#64748b"
                    className="mb-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />

                <TextInput
                    value={phoneNumber}
                    onChangeText={onPhoneNumberChange}
                    keyboardType="phone-pad"
                    placeholder="Phone Number"
                    placeholderTextColor="#64748b"
                    className="mb-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />

                <TextInput
                    value={email}
                    onChangeText={onEmailChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Email"
                    placeholderTextColor="#64748b"
                    className="mb-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />

                <View className="mb-3 flex-row items-center rounded-xl border border-slate-300 bg-slate-50 pr-1 dark:border-slate-700 dark:bg-slate-950">
                    <TextInput
                        value={password}
                        onChangeText={onPasswordChange}
                        secureTextEntry={!showPassword}
                        placeholder="Password"
                        placeholderTextColor="#64748b"
                        className="flex-1 px-4 py-3 text-slate-900 dark:text-slate-100"
                    />
                    <Pressable
                        onPress={() => setShowPassword((prev) => !prev)}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        className="px-3 py-2.5">
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#64748b"
                        />
                    </Pressable>
                </View>

                <View className="flex-row items-center rounded-xl border border-slate-300 bg-slate-50 pr-1 dark:border-slate-700 dark:bg-slate-950">
                    <TextInput
                        value={confirmPassword}
                        onChangeText={onConfirmPasswordChange}
                        secureTextEntry={!showConfirmPassword}
                        placeholder="Confirm Password"
                        placeholderTextColor="#64748b"
                        className="flex-1 px-4 py-3 text-slate-900 dark:text-slate-100"
                    />
                    <Pressable
                        onPress={() => setShowConfirmPassword((prev) => !prev)}
                        accessibilityRole="button"
                        accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="px-3 py-2.5">
                        <Ionicons
                            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#64748b"
                        />
                    </Pressable>
                </View>
            </View>

            <Pressable
                onPress={onSubmit}
                disabled={isSubmitting}
                className="min-h-12 items-center justify-center rounded-xl bg-violet-700 dark:bg-violet-500"
                style={{ opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text className="font-bold text-white">Create Account</Text>
                )}
            </Pressable>

            <Pressable
                onPress={onSwitchToSignIn}
                className="items-center rounded-xl border border-slate-300 bg-slate-100 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                <Text className="font-semibold text-slate-900 dark:text-slate-200">
                    Already have an account? Sign In
                </Text>
            </Pressable>

            {authError ? <Text className="font-semibold text-red-700">{authError}</Text> : null}
        </View>
    );
}
