import request from 'supertest';
import { app } from '../src/app';
import { userRepository } from '../src/infrastructure/db/repositories/user.repository';

jest.mock('../src/infrastructure/db/repositories/user.repository');
jest.mock('../src/infrastructure/db/repositories/user-asset.repository');
jest.mock('../src/api/http/middlewares/authentication.middleware', () => ({
    authenticationMiddleware: jest.fn((req, res, next) => {
        if (!req.headers.authorization) {
            return res.status(401).send('Unauthorized');
        }
        (req as any).user = { userId: '123', email: 'test@example.com' };
        next();
    }),
}));

describe('Users Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('DELETE /api/users/:userId', () => {
        it('should delete user if authorized', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '123', email: 'test@example.com' });
            (userRepository.delete as jest.Mock).mockResolvedValue(true);

            const res = await request(app)
                .delete('/api/users/123')
                .set('Authorization', 'mock-token');

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('User deleted successfully');
        });

        it('should return 401 if not authorized', async () => {
            const res = await request(app)
                .delete('/api/users/123');

            expect(res.status).toBe(401);
        });
    });
});
