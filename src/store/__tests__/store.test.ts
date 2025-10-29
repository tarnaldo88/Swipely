import { store } from '../index';

describe('Redux Store', () => {
  it('should initialize store successfully', () => {
    expect(store).toBeDefined();
    expect(store.getState).toBeDefined();
    expect(store.dispatch).toBeDefined();
  });

  it('should have correct initial state structure', () => {
    const state = store.getState();
    expect(typeof state).toBe('object');
  });

  it('should allow dispatching actions', () => {
    expect(() => {
      store.dispatch({ type: 'TEST_ACTION' });
    }).not.toThrow();
  });
});