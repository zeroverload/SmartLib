import { Book, BorrowRecord, User, Reservation, Review, SystemSettings } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    name: '系统管理员',
    role: 'admin',
    status: 'active',
    contact: 'admin@library.edu',
    password: '123456', 
    avatar: 'https://picsum.photos/seed/admin/200/200',
    joinedDate: '2022-01-01'
  },
  {
    id: 1001,
    username: 'student1',
    name: '张三',
    role: 'reader',
    status: 'active',
    contact: '13800138000',
    password: 'student1',
    avatar: 'https://picsum.photos/seed/u1/200/200',
    joinedDate: '2023-09-01'
  },
  {
    id: 1002,
    username: 'student2',
    name: '李四',
    role: 'reader',
    status: 'active', 
    contact: '13900139000',
    password: 'student2',
    avatar: 'https://picsum.photos/seed/u2/200/200',
    joinedDate: '2023-09-05'
  },
  {
    id: 1003,
    username: '2023001',
    name: '王小明',
    role: 'reader',
    status: 'active',
    contact: '13700000001',
    password: '123456',
    avatar: 'https://picsum.photos/seed/xiaoming/200/200',
    joinedDate: '2023-09-10'
  },
  {
    id: 1004,
    username: 'prof_chen',
    name: '陈教授',
    role: 'reader',
    status: 'active',
    contact: 'chen@univ.edu',
    password: '123456',
    avatar: 'https://picsum.photos/seed/prof/200/200',
    joinedDate: '2020-03-15'
  },
  {
    id: 1005,
    username: 'guest',
    name: '访客用户',
    role: 'reader',
    status: 'frozen', 
    contact: 'guest@library.edu',
    password: '123456',
    avatar: 'https://picsum.photos/seed/guest/200/200',
    joinedDate: '2023-11-20'
  },
  // --- New Demo User ---
  {
    id: 1006,
    username: 'zhaoliu',
    name: '赵六',
    role: 'reader',
    status: 'active',
    contact: '15999999999',
    password: '123456',
    avatar: 'https://picsum.photos/seed/zhaoliu/200/200',
    joinedDate: '2023-05-20'
  }
];

export const INITIAL_BOOKS: Book[] = [
  {
    id: 2001,
    isbn: '978-7-302-54321-0',
    title: '数据库系统概念',
    author: 'Abraham Silberschatz',
    publisher: '机械工业出版社',
    publishDate: '2021-05-01',
    category: '计算机科学',
    status: 'available',
    coverUrl: 'https://picsum.photos/seed/db/300/400',
    location: 'A-01-02',
    description: '数据库领域的经典教材，详细讲解了数据库系统的基本概念、原理和应用。'
  },
  {
    id: 2002,
    isbn: '978-7-111-12345-6',
    title: '算法导论',
    author: 'Thomas H. Cormen',
    publisher: '高等教育出版社',
    publishDate: '2019-01-01',
    category: '计算机科学',
    status: 'borrowed',
    coverUrl: 'https://picsum.photos/seed/algo/300/400',
    location: 'A-02-05',
    description: '深入浅出地介绍了各种常见的算法及其设计与分析方法。'
  },
  {
    id: 2003,
    isbn: '978-7-544-25897-5',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    publisher: '南海出版公司',
    publishDate: '2011-06-01',
    category: '文学',
    status: 'available',
    coverUrl: 'https://picsum.photos/seed/100years/300/400',
    location: 'B-10-01',
    description: '魔幻现实主义文学代表作，描写了布恩迪亚家族七代人的传奇故事。'
  },
  {
    id: 2004,
    isbn: '978-7-115-56789-1',
    title: 'Vue.js设计与实现',
    author: '霍春阳',
    publisher: '人民邮电出版社',
    publishDate: '2022-02-01',
    category: '计算机科学',
    status: 'borrowed', // Changed to borrowed for demo
    coverUrl: 'https://picsum.photos/seed/vue/300/400',
    location: 'A-03-12',
    description: '深入剖析Vue.js框架的核心原理与实现细节。'
  },
  {
    id: 2005,
    isbn: '978-7-506-36543-7',
    title: '三体全集',
    author: '刘慈欣',
    publisher: '重庆出版社',
    publishDate: '2008-01-01',
    category: '科幻小说',
    status: 'borrowed',
    coverUrl: 'https://picsum.photos/seed/3body/300/400',
    location: 'C-05-08',
    description: '中国科幻文学的里程碑之作，讲述了人类文明与三体文明的信息交流、生死搏杀及两个文明在宇宙中的兴衰历程。'
  }
];

export const INITIAL_RECORDS: BorrowRecord[] = [
  {
    id: 5001,
    userId: 1001,
    bookId: 2002, // 算法导论
    borrowDate: '2025-01-10',
    dueDate: '2025-03-10', // 2 months later
    status: 'borrowed',
    fine: 0
  },
  {
    id: 5002,
    userId: 1001,
    bookId: 2003, // 百年孤独
    borrowDate: '2025-01-01',
    dueDate: '2025-03-01',
    returnDate: '2025-01-28',
    status: 'returned',
    fine: 0
  },
  {
    id: 5003,
    userId: 1002,
    bookId: 2005, // 三体
    borrowDate: '2024-11-01',
    dueDate: '2025-01-01', // Overdue
    status: 'overdue',
    fine: 15.0 // ~30 days * 0.5
  },
  // Record for Demo User Zhao Liu
  {
    id: 5004,
    userId: 1006, // Zhao Liu
    bookId: 2004, // Vue.js
    borrowDate: '2024-10-01',
    dueDate: '2024-12-01', // Heavily Overdue
    status: 'overdue',
    fine: 45.0 // ~90 days * 0.5
  }
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 6001,
    userId: 1001,
    bookId: 2005, // 三体
    reservationTime: '2025-02-05 14:30:00',
    status: 'pending'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 7001,
    userId: 1001,
    bookId: 2003,
    rating: 5,
    content: "非常震撼的阅读体验，家族的兴衰史。",
    date: "2025-01-29"
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  dailyFine: 0.5, // Updated to 0.5 as requested
  maxBorrowLimit: 10,
  libraryAnnouncement: "欢迎使用LumiLib图书馆系统！借阅时长已升级为2个月。逾期罚金调整为 0.5元/天。",
  maintenanceMode: false
};