import { 
  INITIAL_BOOKS, 
  INITIAL_USERS, 
  INITIAL_RECORDS, 
  INITIAL_RESERVATIONS, 
  INITIAL_REVIEWS,
  INITIAL_SETTINGS
} from './constants';
import { Book, User, BorrowRecord, Reservation, Review, SystemSettings, Role } from './types';

// Simulating Database in LocalStorage
const DB_KEYS = {
  BOOKS: 'lumilib_books',
  USERS: 'lumilib_users',
  RECORDS: 'lumilib_records',
  RESERVATIONS: 'lumilib_reservations',
  REVIEWS: 'lumilib_reviews',
  SETTINGS: 'lumilib_settings'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Database Initialization ---
function initDB() {
  if (!localStorage.getItem(DB_KEYS.BOOKS)) localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
  if (!localStorage.getItem(DB_KEYS.USERS)) localStorage.setItem(DB_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  if (!localStorage.getItem(DB_KEYS.RECORDS)) localStorage.setItem(DB_KEYS.RECORDS, JSON.stringify(INITIAL_RECORDS));
  if (!localStorage.getItem(DB_KEYS.RESERVATIONS)) localStorage.setItem(DB_KEYS.RESERVATIONS, JSON.stringify(INITIAL_RESERVATIONS));
  if (!localStorage.getItem(DB_KEYS.REVIEWS)) localStorage.setItem(DB_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
  if (!localStorage.getItem(DB_KEYS.SETTINGS)) localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
}

// Ensure DB is ready
initDB();

// --- Generic Helper ---
function get<T>(key: string): T {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function set(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- API Methods ---

export const api = {
  // Auth
  async login(username: string, role: Role): Promise<User | null> {
    await delay(500); // Simulate network
    const users = get<User[]>(DB_KEYS.USERS);
    // In a real app, we check password hash. Here we simplistically return user if found.
    return users.find(u => u.username === username && u.role === role) || null;
  },

  async updateUserProfile(user: User): Promise<User> {
    await delay(300);
    const users = get<User[]>(DB_KEYS.USERS);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...user };
      set(DB_KEYS.USERS, users);
      return users[idx];
    }
    throw new Error("User not found");
  },

  async changePassword(userId: number, oldPass: string, newPass: string): Promise<boolean> {
    await delay(400);
    const users = get<User[]>(DB_KEYS.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
       // Simple check (in production, use hashing)
       if (users[idx].password === oldPass) {
         users[idx].password = newPass;
         set(DB_KEYS.USERS, users);
         return true;
       }
    }
    return false;
  },

  // Books
  async getBooks(): Promise<Book[]> {
    await delay(200);
    return get<Book[]>(DB_KEYS.BOOKS);
  },

  async addBook(book: Book): Promise<void> {
    await delay(300);
    const books = get<Book[]>(DB_KEYS.BOOKS);
    set(DB_KEYS.BOOKS, [...books, book]);
  },

  // Users (Admin)
  async getUsers(): Promise<User[]> {
    await delay(300);
    return get<User[]>(DB_KEYS.USERS);
  },

  async adminCreateUser(user: User): Promise<void> {
    await delay(300);
    const users = get<User[]>(DB_KEYS.USERS);
    if (users.some(u => u.username === user.username)) throw new Error("Username exists");
    set(DB_KEYS.USERS, [...users, user]);
  },

  async adminUpdateUser(user: User): Promise<void> {
    await delay(300);
    const users = get<User[]>(DB_KEYS.USERS);
    const updated = users.map(u => u.id === user.id ? user : u);
    set(DB_KEYS.USERS, updated);
  },

  async adminDeleteUser(userId: number): Promise<void> {
    await delay(300);
    const users = get<User[]>(DB_KEYS.USERS);
    set(DB_KEYS.USERS, users.filter(u => u.id !== userId));
  },

  // Records & Borrowing
  async getRecords(): Promise<BorrowRecord[]> {
    await delay(200);
    return get<BorrowRecord[]>(DB_KEYS.RECORDS);
  },

  async borrowBook(userId: number, bookId: number): Promise<void> {
    await delay(400);
    const settings = get<SystemSettings>(DB_KEYS.SETTINGS);
    const records = get<BorrowRecord[]>(DB_KEYS.RECORDS);
    const userActiveRecords = records.filter(r => r.userId === userId && r.status !== 'returned');
    
    if (userActiveRecords.length >= settings.maxBorrowLimit) {
      throw new Error(`达到借阅上限 (${settings.maxBorrowLimit} 本)`);
    }

    // Update Records: Set due date to 60 days (2 months)
    const newRecord: BorrowRecord = {
      id: Date.now(),
      userId,
      bookId,
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'borrowed',
      fine: 0
    };
    set(DB_KEYS.RECORDS, [...records, newRecord]);

    // Update Book Status
    const books = get<Book[]>(DB_KEYS.BOOKS);
    const bookIdx = books.findIndex(b => b.id === bookId);
    if (bookIdx !== -1) {
      books[bookIdx].status = 'borrowed';
      set(DB_KEYS.BOOKS, books);
    }
  },

  async returnBook(recordId: number): Promise<void> {
    await delay(400);
    const records = get<BorrowRecord[]>(DB_KEYS.RECORDS);
    const idx = records.findIndex(r => r.id === recordId);
    
    if (idx !== -1) {
      const record = records[idx];
      record.status = 'returned';
      record.returnDate = new Date().toISOString().split('T')[0];
      set(DB_KEYS.RECORDS, records);

      // Update Book Status
      const books = get<Book[]>(DB_KEYS.BOOKS);
      const bookIdx = books.findIndex(b => b.id === record.bookId);
      if (bookIdx !== -1) {
        books[bookIdx].status = 'available';
        set(DB_KEYS.BOOKS, books);
      }
    }
  },

  // Reservation
  async getReservations(): Promise<Reservation[]> {
    await delay(200);
    return get<Reservation[]>(DB_KEYS.RESERVATIONS);
  },

  async reserveBook(userId: number, bookId: number): Promise<void> {
    await delay(300);
    const reservations = get<Reservation[]>(DB_KEYS.RESERVATIONS);
    
    // Check if already reserved
    if (reservations.some(r => r.userId === userId && r.bookId === bookId && r.status === 'pending')) {
      throw new Error("您已预约该书籍");
    }

    const newRes: Reservation = {
      id: Date.now(),
      userId,
      bookId,
      reservationTime: new Date().toLocaleString('zh-CN'),
      status: 'pending'
    };
    
    set(DB_KEYS.RESERVATIONS, [...reservations, newRes]);
  },

  async cancelReservation(id: number): Promise<void> {
    await delay(300);
    const reservations = get<Reservation[]>(DB_KEYS.RESERVATIONS);
    set(DB_KEYS.RESERVATIONS, reservations.filter(r => r.id !== id));
  },

  // Reviews
  async getReviews(bookId?: number): Promise<Review[]> {
    await delay(200);
    let reviews = get<Review[]>(DB_KEYS.REVIEWS);
    if (bookId) {
      reviews = reviews.filter(r => r.bookId === bookId);
    }
    // Hydrate user names
    const users = get<User[]>(DB_KEYS.USERS);
    return reviews.map(r => ({
      ...r,
      userName: users.find(u => u.id === r.userId)?.name || '未知用户'
    }));
  },

  async addReview(review: Review): Promise<void> {
    await delay(300);
    const reviews = get<Review[]>(DB_KEYS.REVIEWS);
    set(DB_KEYS.REVIEWS, [...reviews, review]);
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    await delay(100);
    // Ensure defaults if missing from LS
    const settings = get<SystemSettings>(DB_KEYS.SETTINGS);
    if (!settings || Object.keys(settings).length === 0) return INITIAL_SETTINGS;
    return settings;
  },

  async updateSettings(settings: SystemSettings): Promise<void> {
    await delay(300);
    set(DB_KEYS.SETTINGS, settings);
  }
};