'use client';

import { User } from '@/types';
import { db } from './database';

class AuthService {
  private currentUser: User | null = null;
  private storage = typeof window !== 'undefined' ? localStorage : null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadCurrentUser();
    }
  }

  private loadCurrentUser(): void {
    if (!this.storage) return;
    const userData = this.storage.getItem('currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  private saveCurrentUser(user: User | null): void {
    if (!this.storage) return;
    if (user) {
      this.storage.setItem('currentUser', JSON.stringify(user));
    } else {
      this.storage.removeItem('currentUser');
    }
    this.currentUser = user;
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = db.getUserByEmail(email);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // In a real app, you'd verify the password hash
      // For demo purposes, we'll accept any password
      
      this.saveCurrentUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  async register(userData: {
    fullName: string;
    email: string;
    phone: string;
    idNumber: string;
    password: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if user already exists
      const existingUser = db.getUserByEmail(userData.email);
      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }

      // Create new user
      const newUser = db.createUser({
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        idNumber: userData.idNumber,
        role: 'member',
        isVerified: false,
      });

      // Create welcome notification
      db.createNotification({
        userId: newUser.id,
        title: 'Welcome to Jivunie SACCO!',
        message: 'Your account has been created successfully. Start contributing to unlock loan benefits.',
        type: 'success',
        read: false,
        date: new Date().toISOString(),
      });

      this.saveCurrentUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  }

  logout(): void {
    this.saveCurrentUser(null);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  updateCurrentUser(updates: Partial<User>): User | null {
    if (!this.currentUser) return null;
    
    const updatedUser = db.updateUser(this.currentUser.id, updates);
    if (updatedUser) {
      this.saveCurrentUser(updatedUser);
    }
    return updatedUser;
  }
}

export const authService = new AuthService();