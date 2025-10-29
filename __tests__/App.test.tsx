import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock the store to avoid Redux issues in tests
jest.mock('../src/store', () => ({
  store: {
    getState: () => ({}),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  },
}));

describe('App Component', () => {
  it('should render without crashing', () => {
    const { getByText } = render(<App />);
    expect(getByText('Swipely Commerce App')).toBeTruthy();
  });

  it('should display the project initialization message', () => {
    const { getByText } = render(<App />);
    expect(getByText('Project structure initialized successfully!')).toBeTruthy();
  });

  it('should render the main container', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('app-container')).toBeTruthy();
  });

  it('should have correct test IDs', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('app-title')).toBeTruthy();
    expect(getByTestId('app-subtitle')).toBeTruthy();
  });
});