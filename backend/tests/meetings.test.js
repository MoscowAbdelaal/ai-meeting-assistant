const request = require('supertest');
const app = require('../src/index');

describe('Meetings API', () => {
    let authToken;
    let meetingId;

    beforeAll(async () => {
        // Create a test user and get token
        const signupRes = await request(app)
            .post('/api/auth/signup')
            .send({
                email: 'test@example.com',
                password: 'test123456'
            });
        
        if (signupRes.status === 201) {
            authToken = signupRes.body.session.access_token;
        }
    });

    test('POST /api/meetings - should create a meeting', async () => {
        const res = await request(app)
            .post('/api/meetings')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: 'Test Meeting',
                transcript: 'This is a test transcript'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe('Test Meeting');
        meetingId = res.body.id;
    });

    test('GET /api/meetings - should list meetings', async () => {
        const res = await request(app)
            .get('/api/meetings')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('meetings');
        expect(Array.isArray(res.body.meetings)).toBe(true);
    });

    test('GET /api/meetings/:id - should get a specific meeting', async () => {
        const res = await request(app)
            .get(`/api/meetings/${meetingId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(meetingId);
    });

    test('POST /api/meetings/:id/process - should process meeting with AI', async () => {
        const res = await request(app)
            .post(`/api/meetings/${meetingId}/process`)
            .set('Authorization', `Bearer ${authToken}`);

        // Accept 200 or 400 (already processed)
        expect([200, 400]).toContain(res.statusCode);
    });
});
