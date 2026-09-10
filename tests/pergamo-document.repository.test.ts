import { PergamoDocumentRepository } from '../src/infrastructure/pergamo/pergamo-document.repository';

const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const isLogin = (url: string) => url.endsWith('/organization/login');

describe('PergamoDocumentRepository', () => {
    const fetchMock = jest.fn();
    const repository = () => new PergamoDocumentRepository('http://pergamo/', 'markbot', 'secret');

    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    it('logs in once for concurrent requests and sends the raw token', async () => {
        fetchMock.mockImplementation(async (url: string) => (isLogin(url) ? json(200, { token: 't1' }) : json(200, { results: [] })));

        const repo = repository();
        await Promise.all([repo.search('a', 5), repo.search('b', 5)]);

        expect(fetchMock.mock.calls.filter(([url]) => isLogin(url))).toHaveLength(1);
        expect(fetchMock.mock.calls[1][0]).toBe('http://pergamo/search');
        expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('t1');
    });

    it('renews an expired token once and retries', async () => {
        fetchMock
            .mockResolvedValueOnce(json(200, { token: 'old' }))
            .mockResolvedValueOnce(json(401, { error: 'Malformed token' }))
            .mockResolvedValueOnce(json(200, { token: 'new' }))
            .mockResolvedValueOnce(json(200, {
                results: [{ document_id: 'd1', content: 'x', page: 2, section: null, heading_path: ['A', 'B'], similarity: 0.9 }],
            }));

        const results = await repository().search('q', 5);

        expect(results).toEqual([{ documentId: 'd1', content: 'x', page: 2, section: undefined, headingPath: ['A', 'B'], similarity: 0.9 }]);
        expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe('new');
    });

    it('fails instead of returning an empty result when Pergamo is down', async () => {
        fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

        await expect(repository().search('q', 5)).rejects.toMatchObject({ status: 502 });
    });

    it('reports a rejected login as a Pergamo failure, not a user error', async () => {
        fetchMock.mockResolvedValue(json(404, { error: 'Incorrect Login' }));

        await expect(repository().list()).rejects.toMatchObject({ status: 502 });
    });

    it('maps the document metadata and returns undefined when it does not exist', async () => {
        fetchMock
            .mockResolvedValueOnce(json(200, { token: 't' }))
            .mockResolvedValueOnce(json(200, { uuid: 'd1', name: 'manual', original_name: 'manual.pdf', creation_date: ' 1757000000000.' }))
            .mockResolvedValueOnce(json(404, { error: 'Document not found' }));

        const repo = repository();
        const doc = await repo.getById('d1');

        expect(doc).toMatchObject({ id: 'd1', name: 'manual', originalName: 'manual.pdf' });
        expect(doc?.creationDate.getTime()).toBe(1757000000000);
        await expect(repo.getById('missing')).resolves.toBeUndefined();
    });
});
