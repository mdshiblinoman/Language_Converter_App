import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

type SignUpFormProps = {
    name: string;
    phoneNumber: string;
    email: string;
    password: string;
    confirmPassword: string;
    isSubmitting: boolean;
    isOtpLoading: boolean;
    isOtpSent: boolean;
    isPhoneVerified: boolean;
    authError: string;
    otpCode: string;
    onNameChange: (value: string) => void;
    onPhoneNumberChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onOtpCodeChange: (value: string) => void;
    onSendOtp: () => void;
    onVerifyOtp: () => void;
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
    isOtpLoading,
    isOtpSent,
    isPhoneVerified,
    authError,
    otpCode,
    onNameChange,
    onPhoneNumberChange,
    onEmailChange,
    onPasswordChange,
    onConfirmPasswordChange,
    onOtpCodeChange,
    onSendOtp,
    onVerifyOtp,
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
                value={name}
                onChangeText={onNameChange}
                autoCapitalize="words"
                placeholder="Name"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />

            <TextInput
                value={phoneNumber}
                onChangeText={onPhoneNumberChange}
                keyboardType="phone-pad"
                placeholder="Phone Number (+8801...)"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />

            <Pressable
                onPress={onSendOtp}
                disabled={isOtpLoading}
                className="min-h-11 items-center justify-center rounded-xl border border-sky-300 bg-sky-100 dark:border-sky-700 dark:bg-sky-950"
                style={{ opacity: isOtpLoading ? 0.7 : 1 }}>
                {isOtpLoading ? (
                    <ActivityIndicator color="#0c4a6e" />
                ) : (
                    <Text className="font-semibold text-sky-900 dark:text-sky-200">
                        {isOtpSent ? 'Resend Code' : 'Send Code'}
                    </Text>
                )}
            </Pressable>

            {isOtpSent ? (
                <View className="gap-2">
                    <TextInput
                        value={otpCode}
                        onChangeText={onOtpCodeChange}
                        keyboardType="number-pad"
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#64748b"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />

                    <Pressable
                        onPress={onVerifyOtp}
                        disabled={isOtpLoading || isPhoneVerified}
                        className="min-h-11 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950"
                        style={{ opacity: isOtpLoading || isPhoneVerified ? 0.7 : 1 }}>
                        <Text className="font-semibold text-emerald-900 dark:text-emerald-200">
                            {isPhoneVerified ? 'Phone Verified' : 'Verify Code'}
                        </Text>
                    </Pressable>
                </View>
            ) : null}

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
                value={confirmPassword}
                onChangeText={onConfirmPasswordChange}
                secureTextEntry
                placeholder="Confirm Password"
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
                disabled={isSubmitting || !isPhoneVerified}
                className="min-h-12 items-center justify-center rounded-xl bg-violet-700 dark:bg-violet-500"
                style={{ opacity: isSubmitting || !isPhoneVerified ? 0.7 : 1 }}>
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
