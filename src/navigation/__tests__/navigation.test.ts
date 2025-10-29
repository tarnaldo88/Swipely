import { RootStack, AuthStack, MainTab, NavigationContainer } from '../index';

describe('Navigation Setup', () => {
  it('should export RootStack navigator', () => {
    expect(RootStack).toBeDefined();
    expect(RootStack.Navigator).toBeDefined();
    expect(RootStack.Screen).toBeDefined();
  });

  it('should export AuthStack navigator', () => {
    expect(AuthStack).toBeDefined();
    expect(AuthStack.Navigator).toBeDefined();
    expect(AuthStack.Screen).toBeDefined();
  });

  it('should export MainTab navigator', () => {
    expect(MainTab).toBeDefined();
    expect(MainTab.Navigator).toBeDefined();
    expect(MainTab.Screen).toBeDefined();
  });

  it('should export NavigationContainer', () => {
    expect(NavigationContainer).toBeDefined();
  });
});