
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/app/config';
const { authenticator } = require('@otplib/preset-default');
// import { authenticator } from 'otplib';
import { userRepository } from '@/infrastructure/db/repositories/user.repository';

// Base URL for the API
const API_URL = `${config.appHost}/api`;

async function runTest() {
    const email = `test_2fa_${uuidv4()}@example.com`;
    const password = 'Password123!';
    let token = '';
    let userId = '';
    let secret = '';

    console.log('--- Starting 2FA Flow Test ---');

    try {
        // 1. Register
        console.log(`1. Registering user: ${email}...`);
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            email,
            password,
            name: 'Test 2FA User'
        });

        // Handle registration response which might not return user object directly if it returns message
        if (registerRes.data.user) {
            userId = registerRes.data.user.id;
        } else {
            // Try to find user by email if ID not returned
            const user = await userRepository.findByEmail(email);
            if (!user) throw new Error('User not found after registration');
            userId = user.id;
        }

        console.log('User registered. ID:', userId);

        // 1b. Verify Email (Simulated)
        await userRepository.update(userId, { email_verified: true });
        console.log('User manually verified in DB for testing.');

        // 2. Login (Before 2FA)
        console.log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        // 3. Enable 2FA Start
        console.log('3. Starting 2FA setup...');
        const startRes = await axios.post(`${API_URL}/auth/2fa/enable/start`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        secret = startRes.data.secret;
        console.log('2FA Setup started. Secret:', secret);

        // 4. Enable 2FA Complete
        console.log('4. Completing 2FA setup...');

        const validCode = authenticator.generate(secret);

        const completeRes = await axios.post(`${API_URL}/auth/2fa/enable/complete`, {
            code: validCode
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const recoveryCodes = completeRes.data.recovery_codes;
        console.log('2FA Enabled. Recovery codes count:', recoveryCodes.length);

        // 5. Logout (Clear token)
        token = '';
        console.log('Logged out.');

        // 6. Login (With 2FA enabled)
        console.log('6. Logging in with 2FA enabled...');
        const login2faRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        if (login2faRes.data.requires_2fa) {
            console.log('2FA Challenge received.');
            const tempToken = login2faRes.data.temp_token;

            // Generate new code
            const code2 = authenticator.generate(secret);

            const verifyRes = await axios.post(`${API_URL}/auth/2fa/verify`, {
                temp_token: tempToken,
                code: code2
            });

            token = verifyRes.data.token;
            console.log('2FA Login successful. Token obtained.');
        } else {
            console.error('Expected 2FA challenge but got straight login (or failure).');
            process.exit(1);
        }

        // 7. Disable 2FA
        console.log('7. Disabling 2FA...');
        const disableRes = await axios.post(`${API_URL}/auth/2fa/disable`, {
            password: password
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('2FA Disabled:', disableRes.data.message);

        console.log('--- Test Passed Successfully ---');

    } catch (error: any) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
        process.exit(1);
    }
}

runTest();
