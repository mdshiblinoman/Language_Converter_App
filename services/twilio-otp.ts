const OTP_API_BASE_URL = process.env.EXPO_PUBLIC_OTP_API_URL;

if (!OTP_API_BASE_URL) {
    // Keep this explicit so missing config fails fast during development.
    console.warn('EXPO_PUBLIC_OTP_API_URL is not set. Twilio OTP will not work.');
}

type OtpSendResponse = {
    success: boolean;
    status: string;
};

type OtpVerifyResponse = {
    success: boolean;
    status: string;
};

const postJson = async <T>(path: string, payload: Record<string, string>) => {
    if (!OTP_API_BASE_URL) {
        throw new Error('OTP API URL is missing. Set EXPO_PUBLIC_OTP_API_URL in .env');
    }

    const response = await fetch(`${OTP_API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.message ?? 'OTP request failed');
    }

    return data as T;
};

export const sendOtpCode = async (phoneNumber: string) =>
    postJson<OtpSendResponse>('/otp/send', { phoneNumber });

export const verifyOtpCode = async (phoneNumber: string, code: string) =>
    postJson<OtpVerifyResponse>('/otp/verify', { phoneNumber, code });
