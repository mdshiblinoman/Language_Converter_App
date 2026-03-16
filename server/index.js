const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGIN || '*',
    })
);

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    console.error('Missing Twilio env vars. Check server/.env');
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

app.get('/health', (_req, res) => {
    res.json({ ok: true });
});

app.post('/otp/send', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ success: false, message: 'phoneNumber is required' });
        }

        const verification = await client.verify.v2
            .services(TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({ to: phoneNumber, channel: 'sms' });

        return res.json({
            success: true,
            status: verification.status,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Failed to send OTP',
        });
    }
});

app.post('/otp/verify', async (req, res) => {
    try {
        const { phoneNumber, code } = req.body;

        if (!phoneNumber || !code) {
            return res.status(400).json({ success: false, message: 'phoneNumber and code are required' });
        }

        const check = await client.verify.v2
            .services(TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks.create({ to: phoneNumber, code });

        return res.json({
            success: check.status === 'approved',
            status: check.status,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Failed to verify OTP',
        });
    }
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
    console.log(`OTP server running on http://localhost:${port}`);
});
