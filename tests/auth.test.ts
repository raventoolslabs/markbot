import request from 'supertest';
import { app } from '../src/app';
import { userRepository } from '../src/infrastructure/db/repositories/user.repository';
import { PasswordUtil } from '../src/infrastructure/auth/password.util';
import { emailService } from '../src/infrastructure/email/email.service';

jest.mock('../src/infrastructure/db/repositories/user.repository');
jest.mock('../src/infrastructure/auth/password.util');
jest.mock('../src/infrastructure/email/email.service');
jest.mock('../src/infrastructure/db/repositories/verification-code.repository');
jest.mock('../src/infrastructure/db/repositories/user-asset.repository');

describe('Auth Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (userRepository.create as jest.Mock).mockResolvedValue({});
            (PasswordUtil.hash as jest.Mock).mockResolvedValue('hashedpassword');
            (emailService.sendVerificationEmail as jest.Mock).mockResolvedValue(true);

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe('test@example.com');
        });

        it('should fail if user already exists', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '123' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.status).toBe(409);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({
                id: '123',
                email: 'test@example.com',
                password_hash: 'hashedpassword',
                two_factor_enabled: false
            });
            (PasswordUtil.verify as jest.Mock).mockResolvedValue(true);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail with invalid credentials', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'wrong' });

            expect(res.status).toBe(401);
        });
    });
});
