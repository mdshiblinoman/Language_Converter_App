import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

type SignUpFormProps = {
    email: string;
    password: string;
    isSubmitting: boolean;
    authError: string;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: () => void;
    onSwitchToSignIn: () => void;
};

export function SignUpForm({
    email,
    password,
    isSubmitting,
    authError,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    onSwitchToSignIn,
}: SignUpFormProps) {
    return (
        <View className="gap-3 rounded-2xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">Create Account</Text>
            <Text className="text-base text-slate-600 dark:text-slate-300">
                Sign up to start using Language Converter.
            </Text>

            <TextInput
                value={email}
                onChangeText={onEmailChange}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />

            <TextInput
                value={password}
                onChangeText={onPasswordChange}
                secureTextEntry
                placeholder="Password"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />

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
