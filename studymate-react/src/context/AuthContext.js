import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session on app load
    const savedUser = localStorage.getItem('studymate_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('studymate_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Demo authentication (replace with real API call)
      if (email === 'demo@studymate.com' && password === 'password123') {
        const userData = {
          id: '1',
          name: 'Demo User',
          email: 'demo@studymate.com',
          avatar: 'https://via.placeholder.com/150',
          role: 'student',
          joinedAt: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('studymate_user', JSON.stringify(userData));
        toast.success('Welcome back!');
        return { success: true };
      } else {
        throw new Error('Invalid credentials. Try demo@studymate.com / password123');
      }
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      
      // Demo signup (replace with real API call)
      const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        avatar: 'https://via.placeholder.com/150',
        role: 'student',
        joinedAt: new Date().toISOString()
      };
      
      setUser(newUser);
      localStorage.setItem('studymate_user', JSON.stringify(newUser));
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('studymate_user');
    toast.success('Logged out successfully');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('studymate_user', JSON.stringify(updatedUser));
    toast.success('Profile updated successfully');
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
