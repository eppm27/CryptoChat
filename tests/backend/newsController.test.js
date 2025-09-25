// Unit tests for newsController
const { mockRequest, mockResponse } = require('jest-mock-req-res');
const NewsArticle = require('../../backend/dbSchema/newsSchema');
const newsController = require('../../backend/controllers/newsController');

// Mock all dependencies
jest.mock('../../backend/dbSchema/newsSchema');
jest.mock('../../backend/services/newsService');

describe('News Controller', () => {
  describe('getLatestNews', () => {
    it('should return latest news with default limit', async () => {
      const mockNews = [{ title: 'Test News' }];
      NewsArticle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockNews),
        }),
      });

      const req = mockRequest({ query: {} });
      const res = mockResponse();

      await newsController.getLatestNews(req, res);

      expect(NewsArticle.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockNews);
    });

    it('should return news with custom limit', async () => {
      const mockNews = [{ title: 'Test News' }];
      NewsArticle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockNews),
        }),
      });

      const req = mockRequest({ query: { limit: '5' } });
      const res = mockResponse();

      await newsController.getLatestNews(req, res);

      expect(NewsArticle.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockNews);
      expect(NewsArticle.find().sort().limit).toHaveBeenCalledWith(5);
    });

    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      NewsArticle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error(errorMessage)),
        }),
      });

      const req = mockRequest({ query: {} });
      const res = mockResponse();

      await newsController.getLatestNews(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getNewsByTicker', () => {
    it('should return news for a valid ticker', async () => {
      const mockNews = [{ title: 'BTC News', tickers: ['CRYPTO:BTC'] }];
      NewsArticle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockNews),
        }),
      });

      const req = mockRequest({
        params: { ticker: 'btc' },
        query: {},
      });
      const res = mockResponse();

      await newsController.getNewsByTicker(req, res);

      expect(NewsArticle.find).toHaveBeenCalledWith({
        $or: [{ tickers: 'CRYPTO:BTC' }, { tickers: 'BTC' }],
      });
      expect(res.json).toHaveBeenCalledWith(mockNews);
    });

    it('should return 400 if ticker is missing', async () => {
      const req = mockRequest({ params: {}, query: {} });
      const res = mockResponse();

      await newsController.getNewsByTicker(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Ticker is required' });
    });

    it('should handle custom limit parameter', async () => {
      const mockNews = [{ title: 'BTC News', tickers: ['CRYPTO:BTC'] }];
      NewsArticle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockNews),
        }),
      });

      const req = mockRequest({
        params: { ticker: 'btc' },
        query: { limit: '3' },
      });
      const res = mockResponse();

      await newsController.getNewsByTicker(req, res);

      expect(NewsArticle.find().sort().limit).toHaveBeenCalledWith(3);
    });

    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      NewsArticle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error(errorMessage)),
        }),
      });

      const req = mockRequest({
        params: { ticker: 'btc' },
        query: {},
      });
      const res = mockResponse();

      await newsController.getNewsByTicker(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
