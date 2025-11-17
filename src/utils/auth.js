// Client-side authentication utilities
import bcrypt from 'bcryptjs';

// Storage keys
const STORAGE_KEYS = {
  USERS: 'crypto_tracker_users',
  SESSION: 'crypto_tracker_session',
  GUEST: 'crypto_tracker_guest'
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Hash password
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

// Verify password
export const verifyPassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

// Generate session token
export const generateSessionToken = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now();
};

// User storage operations
export const userStorage = {
  // Get all users
  getUsers: () => {
    try {
      const users = localStorage.getItem(STORAGE_KEYS.USERS);
      return users ? JSON.parse(users) : {};
    } catch (error) {
      console.error('Error getting users:', error);
      return {};
    }
  },
  
  // Save user
  saveUser: async (email, displayName, password) => {
    try {
      const users = userStorage.getUsers();
      
      // Check if user already exists
      if (users[email]) {
        throw new Error('Email already registered');
      }
      
      const passwordHash = await hashPassword(password);
      
      users[email] = {
        email,
        displayName: displayName || email.split('@')[0],
        passwordHash,
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return users[email];
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  },
  
  // Get user by email
  getUser: (email) => {
    try {
      const users = userStorage.getUsers();
      return users[email] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },
  
  // Update user
  updateUser: (email, updates) => {
    try {
      const users = userStorage.getUsers();
      if (users[email]) {
        users[email] = { ...users[email], ...updates };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return users[email];
      }
      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }
};

// Session management
export const sessionManager = {
  // Create session
  createSession: (user, rememberMe = false) => {
    try {
      const session = {
        token: generateSessionToken(),
        user: {
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt
        },
        createdAt: new Date().toISOString(),
        expiresAt: rememberMe ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      
      // Update last login
      userStorage.updateUser(user.email, { lastLogin: new Date().toISOString() });
      
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },
  
  // Get current session
  getSession: () => {
    try {
      // Check localStorage first
      let session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (session) {
        session = JSON.parse(session);
      } else {
        // Check sessionStorage
        session = sessionStorage.getItem(STORAGE_KEYS.SESSION);
        if (session) {
          session = JSON.parse(session);
        }
      }
      
      if (!session) return null;
      
      // Check if session expired
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        sessionManager.clearSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },
  
  // Clear session
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  },
  
  // Validate session
  isSessionValid: () => {
    const session = sessionManager.getSession();
    return session !== null;
  }
};

// Guest mode
export const guestManager = {
  // Create guest session
  createGuest: (displayName = 'Guest') => {
    try {
      const guest = {
        isGuest: true,
        displayName,
        token: generateSessionToken(),
        createdAt: new Date().toISOString()
      };
      
      sessionStorage.setItem(STORAGE_KEYS.GUEST, JSON.stringify(guest));
      return guest;
    } catch (error) {
      console.error('Error creating guest:', error);
      throw error;
    }
  },
  
  // Get guest session
  getGuest: () => {
    try {
      const guest = sessionStorage.getItem(STORAGE_KEYS.GUEST);
      return guest ? JSON.parse(guest) : null;
    } catch (error) {
      console.error('Error getting guest:', error);
      return null;
    }
  },
  
  // Clear guest session
  clearGuest: () => {
    sessionStorage.removeItem(STORAGE_KEYS.GUEST);
  }
};

// Export/Import functionality
export const dataManager = {
  // Export user data
  exportUserData: (email, includePassword = false) => {
    try {
      const user = userStorage.getUser(email);
      if (!user) throw new Error('User not found');
      
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        user: {
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt,
          ...(includePassword && { passwordHash: user.passwordHash })
        }
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },
  
  // Import user data
  importUserData: (jsonData, merge = false) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.user || !data.user.email) {
        throw new Error('Invalid data format');
      }
      
      const users = userStorage.getUsers();
      
      if (!merge && users[data.user.email]) {
        throw new Error('User already exists. Use merge option to update.');
      }
      
      users[data.user.email] = {
        ...users[data.user.email],
        ...data.user,
        importedAt: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return users[data.user.email];
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
};
