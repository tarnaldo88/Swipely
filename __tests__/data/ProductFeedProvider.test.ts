import { ApiProductFeedProvider } from '../../src/data/providers/ProductFeedProvider';

describe('ApiProductFeedProvider DummyJSON integration', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('maps DummyJSON products into ProductFeedResponse cards', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 100,
        products: [
          {
            id: 1,
            title: 'Essence Mascara Lash Princess',
            description: 'Lengthening mascara',
            category: 'beauty',
            price: 9.99,
            rating: 4.94,
            stock: 5,
            brand: 'Essence',
            thumbnail: 'https://cdn.example/thumb.jpg',
            images: ['https://cdn.example/1.jpg', 'https://cdn.example/2.jpg'],
          },
        ],
      }),
    });

    const provider = new ApiProductFeedProvider('https://dummyjson.com');
    const result = await provider.getPersonalizedFeed({ page: 2, limit: 10 });

    expect((global as any).fetch).toHaveBeenCalledWith(
      'https://dummyjson.com/products?limit=10&skip=10'
    );
    expect(result.pagination.total).toBe(100);
    expect(result.pagination.page).toBe(2);
    expect(result.products[0]).toMatchObject({
      id: '1',
      title: 'Essence Mascara Lash Princess',
      price: 9.99,
      currency: 'USD',
      category: { id: 'beauty', name: 'Beauty' },
      availability: true,
      reviewRating: 4.94,
    });
    expect(result.products[0].imageUrls).toEqual([
      'https://cdn.example/thumb.jpg',
      'https://cdn.example/1.jpg',
      'https://cdn.example/2.jpg',
    ]);
  });

  it('returns local success for swipe action in DummyJSON mode', async () => {
    const provider = new ApiProductFeedProvider('https://dummyjson.com');
    const result = await provider.recordSwipeAction('1', 'like', 'user-1');

    expect(result).toEqual({
      success: true,
      message: 'like action recorded locally',
    });
    expect((global as any).fetch).not.toHaveBeenCalled();
  });
});
