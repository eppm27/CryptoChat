const request = require('supertest');
const express = require('express');
const app = express();
const User = require('../../backend/dbSchema/userSchema');

app.use(express.json());

// Mock dependencies
jest.mock('../../backend/dbSchema/userSchema');
jest.mock('../../backend/services/llmService', () => ({
  processQuery: jest.fn((query) => {
    return Promise.resolve(`Dummy response for query: ${query}`);
  }),
}));

jest.mock('../../backend/middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { _id: 'mockUserId' };
    next();
  },
}));

jest.mock('../../backend/services/graphService', () => ({
  processGraphsInResponse: jest.fn((respObj) => Promise.resolve(respObj)),
}));
const graphService = require('../../backend/services/graphService');

const llmRoutes = require('../../backend/routes/llmRoutes');
app.use('/api', llmRoutes);

describe('POST /api/ask-llm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if no query is provided', async () => {
    // Mock User.findById to return a valid user
    User.findById.mockResolvedValue({
      _id: 'mockUserId',
      wallet: [],
    });

    const response = await request(app).post('/api/ask-llm').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'No query given' });
  });

  it('should return 404 if user is not found', async () => {
    // Mock User.findById to return null
    User.findById.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/ask-llm')
      .send({ query: 'test query' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });

  it('should stream SSE events for a valid query', (done) => {
    // 1. Prepare the mocks
    User.findById.mockResolvedValue({ _id: 'mockUserId', wallet: [] });
    const queryText = 'Tell me something about Tesla.';
    const llmService = require('../../backend/services/llmService');
    const llmOutput = {
      text: `Dummy response for query: ${queryText}`,
      visualizations: [{ type: 'pie', dataPoints: ['tesla_price_7d'] }]
    };
  
    llmService.processQuery.mockImplementation((q, wallet, streamCb) => {
      // simulate SSE streaming
      streamCb({ type: 'start' });
      streamCb({ type: 'content', content: 'This is ' });
      streamCb({ type: 'content', content: 'streamed content.' });
      return Promise.resolve(llmOutput);
    });
  
    graphService.processGraphsInResponse.mockResolvedValue({
      ...llmOutput,
      visualizations: [...llmOutput.visualizations, { foo: 'bar' }]
    });
  
    // 2. Fire the request, buffer & parse the raw SSE text
    request(app)
      .post('/api/ask-llm')
      .buffer(true)   // collect all chunks into res.text
      .parse((res, callback) => {
        let raw = '';
        res.on('data', chunk => raw += chunk.toString());
        res.on('end', () => callback(null, raw));
      })
      .set('Accept', 'text/event-stream')
      .send({ query: queryText })
      .expect(200)
      .expect('Content-Type', /text\/event-stream/)
      .end((err, res) => {
        if (err) return done(err);
  
        // 3. Split on the SSE delimiter (\n\n), strip "data: " and JSON.parse
        const raw = res.body;
        const events = raw
          .trim()
          .split('\n\n')
          .map(event => JSON.parse(event.replace(/^data: /, '')));

        // If there's a duplicate 'start' at index 1, remove it:
        if (events[1]?.type === 'start') {
          events.splice(1, 1);
        }
  
        // 4. Assert each event
        expect(events[0]).toEqual({ type: 'start' });
        expect(events[1]).toEqual({ type: 'content', content: 'This is ' });
        expect(events[2]).toEqual({ type: 'content', content: 'streamed content.' });
        expect(events[3]).toEqual({
          type: 'complete',
          text: llmOutput.text,
          visualizations: [
            ...llmOutput.visualizations,
            { foo: 'bar' }
          ]
        });
  
        done();
      });
  });
});
