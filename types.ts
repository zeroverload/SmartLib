export type Role = 'reader' | 'admin';

export type BookStatus = 'available' | 'borrowed' | 'maintenance' | 'lost';

export type UserStatus = 'active' | 'frozen';

export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
  status: UserStatus;
  avatar?: string;
  contact: string;
  password?: string; // For mock backend authentication
  joinedDate?: string;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  category: string;
  status: BookStatus;
  coverUrl: string;
  location?: string;
  description?: string;
}

export interface BorrowRecord {
  id: number;
  userId: number;
  bookId: number;
  borrowDate: string; // ISO Date string
  dueDate: string; // ISO Date string
  returnDate?: string; // ISO Date string or null
  status: 'borrowed' | 'returned' | 'overdue';
  fine: number;
}

export interface Reservation {
  id: number;
  userId: number;
  bookId: number;
  reservationTime: string;
  status: 'pending' | 'notified' | 'cancelled';
}

export interface Review {
  id: number;
  userId: number;
  bookId: number;
  rating: number; // 1-5
  content: string;
  date: string;
  userName?: string; // Hydrated for display
}

export interface SystemSettings {
  dailyFine: number; // Fine per day
  maxBorrowLimit: number; // Max books per user
  libraryAnnouncement: string;
  maintenanceMode: boolean;
}

export interface StatData {
  name: string;
  value: number;
}