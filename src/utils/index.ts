// Storage utilities
export const storage = {
  setItem: async (key: string, value: string): Promise<void> => {
    // AsyncStorage implementation will be added here
  },
  getItem: async (key: string): Promise<string | null> => {
    // AsyncStorage implementation will be added here
    return null;
  },
  removeItem: async (key: string): Promise<void> => {
    // AsyncStorage implementation will be added here
  },
};

// Validation utilities
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  phone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },
  password: (password: string): boolean => {
    return password.length >= 8;
  },
};

// Format utilities
export const formatters = {
  currency: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },
  date: (date: Date): string => {
    return date.toLocaleDateString();
  },
};