import React, { useState, useMemo, useEffect } from 'react';
import { 
  Book as BookIcon, 
  Search, 
  User as UserIcon, 
  LogOut, 
  Bell, 
  LayoutDashboard, 
  Users, 
  Settings, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  Menu,
  Heart,
  Filter,
  Star,
  Lock,
  Edit,
  Trash2,
  Plus,
  History,
  Save,
  Megaphone,
  Phone,
  MessageSquare,
  Eye
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Book, User, BorrowRecord, Reservation, BookStatus, Role, Review, SystemSettings } from './types';
import { api } from './api';

// --- Helper Components ---

const Badge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    borrowed: 'bg-amber-100 text-amber-700 border-amber-200',
    maintenance: 'bg-gray-100 text-gray-700 border-gray-200',
    lost: 'bg-rose-100 text-rose-700 border-rose-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    frozen: 'bg-rose-100 text-rose-700 border-rose-200',
    returned: 'bg-blue-100 text-blue-700 border-blue-200',
    overdue: 'bg-rose-100 text-rose-700 border-rose-200',
    pending: 'bg-amber-100 text-amber-700',
    notified: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-500'
  };

  const labels: Record<string, string> = {
    available: '在架',
    borrowed: '借出',
    maintenance: '维修中',
    lost: '遗失',
    active: '正常',
    frozen: '冻结',
    returned: '已还',
    overdue: '逾期',
    pending: '排队中',
    notified: '待取',
    cancelled: '已取消'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
  </div>
);

// --- Helper Logic ---
// Dynamic fine calculation: 0.5 per day
const calculateRealtimeFine = (record: BorrowRecord) => {
  // If returned, use the finalized fine stored in the record
  if (record.status === 'returned') return record.fine;
  
  const now = new Date();
  const due = new Date(record.dueDate);
  
  // If not returned and past due date
  if (now > due) {
    const diffTime = Math.abs(now.getTime() - due.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * 0.5;
  }
  return 0;
};

// --- Main App ---

export default function App() {
  // Global State
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]); // For admin
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  
  // Book Modal Reviews State
  const [bookReviews, setBookReviews] = useState<Review[]>([]);

  // Login Form State
  const [loginRole, setLoginRole] = useState<Role>('reader');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // View State
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null); // For modals
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // --- Initial Data Load ---
  const refreshData = async () => {
    setLoading(true);
    try {
      const [bs, rs, ss, res] = await Promise.all([
        api.getBooks(),
        api.getRecords(),
        api.getSettings(),
        api.getReservations()
      ]);
      setBooks(bs);
      setRecords(rs);
      setSystemSettings(ss);
      setReservations(res);
      
      if (currentUser?.role === 'admin') {
        const us = await api.getUsers();
        setUsers(us);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);
  
  // Load reviews when selectedBook changes
  useEffect(() => {
    if (selectedBook) {
      api.getReviews(selectedBook.id).then(setBookReviews);
    }
  }, [selectedBook]);

  // --- Actions ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const user = await api.login(username, loginRole);
      // In real backend, we check password. Here we simulate it simply:
      if (user && user.password === password) {
        if (user.status === 'frozen') {
          setLoginError('该账户已被冻结，请联系管理员');
          return;
        }
        setCurrentUser(user);
        setCurrentView('dashboard');
      } else {
        setLoginError('用户名或密码错误 (试一试: admin/123456 或 2023001/123456)');
      }
    } catch (e) {
      setLoginError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setCurrentView('dashboard');
  };

  const handleBorrow = async (book: Book) => {
    if (!currentUser) return;
    try {
      await api.borrowBook(currentUser.id, book.id);
      await refreshData();
      setSelectedBook(null);
      alert(`借阅成功！`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReserve = async (book: Book) => {
    if (!currentUser) return;
    try {
      await api.reserveBook(currentUser.id, book.id);
      await refreshData();
      setSelectedBook(null);
      alert("预约成功！您已加入等待队列。");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReturn = async (recordId: number) => {
    try {
      await api.returnBook(recordId);
      await refreshData();
      alert("归还成功！");
    } catch (e) {
      alert("归还失败");
    }
  };

  // --- Views Rendering ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md w-full max-w-4xl h-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
          {/* Left Side: Brand */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-brand-600 to-accent-600 p-10 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white p-2 rounded-lg">
                  <BookIcon className="w-8 h-8 text-brand-600" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">LumiLib</h1>
              </div>
              <h2 className="text-4xl font-extrabold mb-4 leading-tight">
                Welcome to <br /> Your Smart Library
              </h2>
              <p className="text-brand-100 text-lg">
                探索知识的海洋，开启智慧之旅。
              </p>
            </div>
            <div className="text-sm opacity-70">
              © 2025 University Library System
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">登录账户</h3>
              <p className="text-gray-500">请输入您的凭证以继续访问</p>
            </div>

            {/* Role Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button 
                onClick={() => setLoginRole('reader')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginRole === 'reader' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                我是读者
              </button>
              <button 
                onClick={() => setLoginRole('admin')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginRole === 'admin' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                管理员
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账号 / 学号</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
                    placeholder={loginRole === 'reader' ? "请输入学号 (如: 2023001)" : "请输入管理员账号 (admin)"}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 w-5 h-5 text-gray-400 font-mono text-lg select-none">***</span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
                    placeholder="请输入密码"
                  />
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 p-3 rounded-lg border border-rose-100">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '登录中...' : '登 录'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- Authenticated Layout ---

  const SidebarItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${
        currentView === id 
          ? 'bg-brand-50 text-brand-700 font-semibold' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${currentView === id ? 'text-brand-600' : 'text-gray-400'}`} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10 shadow-sm">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-200">
            <BookIcon className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">LumiLib</span>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="mb-6">
            <h4 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</h4>
            {currentUser.role === 'admin' ? (
              <>
                <SidebarItem id="dashboard" icon={LayoutDashboard} label="管理仪表盘" />
                <SidebarItem id="books-admin" icon={BookOpen} label="图书管理" />
                <SidebarItem id="users-admin" icon={Users} label="用户管理" />
                <SidebarItem id="settings" icon={Settings} label="系统设置" />
              </>
            ) : (
              <>
                <SidebarItem id="dashboard" icon={Search} label="图书查询" />
                <SidebarItem id="my-borrows" icon={BookOpen} label="我的借阅" />
                <SidebarItem id="my-reservations" icon={Clock} label="预约记录" />
                <SidebarItem id="profile" icon={UserIcon} label="个人中心" />
              </>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-700 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.role === 'admin' ? '管理员' : '读者'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {currentView === 'dashboard' ? (currentUser.role === 'admin' ? '管理仪表盘' : '图书查询') : 
               currentView === 'my-borrows' ? '我的借阅' :
               currentView === 'my-reservations' ? '预约记录' :
               currentView === 'books-admin' ? '图书入库与管理' :
               currentView === 'users-admin' ? '用户管理' :
               currentView === 'settings' ? '系统设置' :
               currentView === 'profile' ? '个人中心' :
               '欢迎回来'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {systemSettings?.libraryAnnouncement && (
             <div className="flex items-center gap-2 text-sm bg-brand-50 text-brand-700 px-4 py-2 rounded-lg max-w-md truncate">
               <Megaphone className="w-4 h-4" />
               {systemSettings.libraryAnnouncement}
             </div>
          )}
          <div className="flex gap-4">
             <button className="p-2.5 bg-white text-gray-600 rounded-xl border border-gray-200 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm relative group">
               <Bell className="w-5 h-5" />
               <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
             </button>
          </div>
        </header>

        {/* --- Dynamic Content Area --- */}
        <div className="animate-fade-in pb-10">
          {loading && !books.length ? (
            <LoadingSpinner />
          ) : (
            <>
              {currentUser.role === 'admin' && currentView === 'dashboard' && <AdminDashboard books={books} records={records} users={users} onNavigate={setCurrentView} />}
              {currentUser.role === 'admin' && currentView === 'books-admin' && <AdminBookManagement books={books} records={records} users={users} />}
              {currentUser.role === 'admin' && currentView === 'users-admin' && <AdminUserManagement users={users} setUsers={setUsers} records={records} books={books} />}
              {currentUser.role === 'admin' && currentView === 'settings' && <AdminSettings settings={systemSettings} onUpdate={refreshData} />}
              
              {currentUser.role === 'reader' && currentView === 'dashboard' && (
                <ReaderBookSearch 
                  books={books} 
                  onBorrow={(book: Book) => setSelectedBook(book)} 
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                />
              )}
              
              {currentUser.role === 'reader' && currentView === 'my-borrows' && (
                <ReaderMyBorrows 
                  userId={currentUser.id} 
                  records={records} 
                  books={books} 
                  onReturn={handleReturn}
                  currentUser={currentUser}
                />
              )}

              {currentUser.role === 'reader' && currentView === 'my-reservations' && (
                <ReaderReservations 
                    reservations={reservations}
                    books={books}
                    setReservations={setReservations}
                />
              )}

              {currentUser.role === 'reader' && currentView === 'profile' && (
                <ReaderProfile 
                  user={currentUser} 
                  records={records} 
                  books={books}
                  onUpdateUser={setCurrentUser}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* --- Modal: Book Details & Action --- */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">图书详情</h3>
              <button onClick={() => setSelectedBook(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <div className="flex gap-6 mb-8">
                <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-32 h-44 object-cover rounded-lg shadow-md flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-800 text-2xl mb-2">{selectedBook.title}</h4>
                  <p className="text-gray-600 mb-1">作者: {selectedBook.author}</p>
                  <p className="text-gray-500 mb-1">出版社: {selectedBook.publisher}</p>
                  <p className="text-gray-500 mb-1">ISBN: {selectedBook.isbn}</p>
                  <p className="text-gray-500 mb-3">位置: {selectedBook.location}</p>
                  <div className="mt-2">
                     <Badge status={selectedBook.status} />
                  </div>
                  <p className="mt-4 text-gray-600 text-sm leading-relaxed">{selectedBook.description}</p>
                </div>
              </div>
              
              <div className="bg-brand-50 rounded-xl p-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">借阅期限:</span>
                  <span className="font-medium text-gray-800">60 天</span>
                </div>
                {selectedBook.status === 'available' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">预计归还:</span>
                    <span className="font-bold text-brand-600">
                      {new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="border-t border-gray-100 pt-6">
                 <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <MessageSquare className="w-5 h-5" />
                   读者评价 ({bookReviews.length})
                 </h4>
                 <div className="space-y-4">
                    {bookReviews.map(review => (
                      <div key={review.id} className="bg-gray-50 p-4 rounded-xl">
                         <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-sm text-gray-700">{review.userName}</span>
                            <div className="flex text-amber-400">
                               {[...Array(5)].map((_, i) => (
                                 <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                               ))}
                            </div>
                         </div>
                         <p className="text-gray-600 text-sm">{review.content}</p>
                         <p className="text-xs text-gray-400 mt-2">{review.date}</p>
                      </div>
                    ))}
                    {bookReviews.length === 0 && <p className="text-gray-400 text-sm">暂无评价</p>}
                 </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white">
              <button 
                onClick={() => setSelectedBook(null)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
              {selectedBook.status === 'available' ? (
                <button 
                  onClick={() => handleBorrow(selectedBook)}
                  className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
                >
                  确认借阅
                </button>
              ) : (
                <button 
                  onClick={() => handleReserve(selectedBook)}
                  className="flex-1 py-3 rounded-xl bg-accent-600 text-white font-medium hover:bg-accent-700 transition-colors shadow-lg shadow-accent-500/30"
                >
                  预约此书
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-Components (Views) ---

function ReaderBookSearch({ books, onBorrow, searchTerm, setSearchTerm, categoryFilter, setCategoryFilter }: any) {
  const categories = ['all', ...Array.from(new Set(books.map((b: any) => b.category)))];

  const filteredBooks = books.filter((book: any) => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索书名、作者..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-5 h-5 text-gray-500" />
          {categories.map((cat: any) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat 
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredBooks.map((book: any) => (
          <div key={book.id} className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="relative mb-4 overflow-hidden rounded-xl">
              <img src={book.coverUrl} alt={book.title} className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3">
                 <Badge status={book.status} />
              </div>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1 truncate" title={book.title}>{book.title}</h3>
            <p className="text-gray-500 text-sm mb-3">{book.author}</p>
            <button 
              onClick={() => onBorrow(book)}
              className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-600"
            >
              查看详情
            </button>
          </div>
        ))}
        {filteredBooks.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>没有找到相关图书</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReaderProfile({ user, records, books, onUpdateUser }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user, password: '' });

  const handleSave = async () => {
    try {
      const updated = await api.updateUserProfile(formData);
      onUpdateUser(updated);
      setIsEditing(false);
      alert('个人信息更新成功');
    } catch (e) {
      alert('更新失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="relative group">
          <img src={user.avatar} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
          <button className="absolute bottom-0 right-0 p-2 bg-brand-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-500">@{user.username} · 加入于 {user.joinedDate}</p>
            </div>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                isEditing 
                ? 'bg-brand-600 text-white hover:bg-brand-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isEditing ? '保存修改' : '编辑资料'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">联系电话</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                  className="w-full mt-1 p-2 border border-gray-200 rounded-lg"
                />
              ) : (
                <p className="text-gray-700 font-medium mt-1">{user.contact}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">身份类型</label>
              <p className="text-gray-700 font-medium mt-1 capitalize">{user.role}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">账户状态</label>
              <div className="mt-1">
                <Badge status={user.status} />
              </div>
            </div>
            {isEditing && (
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">新密码</label>
                <input 
                  type="password" 
                  placeholder="不修改请留空"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full mt-1 p-2 border border-gray-200 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
          <BookOpen className="w-8 h-8 text-brand-500 mx-auto mb-3" />
          <h4 className="text-2xl font-bold text-gray-800">{records.length}</h4>
          <p className="text-gray-500 text-sm">累计借阅</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
          <Clock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h4 className="text-2xl font-bold text-gray-800">
            {records.filter((r: any) => r.userId === user.id && r.status !== 'returned').length}
          </h4>
          <p className="text-gray-500 text-sm">当前在读</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h4 className="text-2xl font-bold text-gray-800">
            {records.filter((r: any) => r.userId === user.id && r.fine > 0).length}
          </h4>
          <p className="text-gray-500 text-sm">违规记录</p>
        </div>
      </div>
    </div>
  );
}

function AdminBookManagement({ books, records, users }: any) {
  const [viewingBookId, setViewingBookId] = useState<number | null>(null);

  const getActiveBorrowInfo = (bookId: number) => {
    const record = records.find((r: BorrowRecord) => r.bookId === bookId && r.status !== 'returned');
    if (!record) return null;
    const user = users.find((u: User) => u.id === record.userId);
    return { record, user };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">图书库管理 ({books.length})</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" />
          新书入库
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold">
            <tr>
              <th className="p-4">封面</th>
              <th className="p-4">书名 / 作者</th>
              <th className="p-4">ISBN / 分类</th>
              <th className="p-4">位置</th>
              <th className="p-4">状态</th>
              <th className="p-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {books.map((book: any) => (
              <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <img src={book.coverUrl} alt="" className="w-12 h-16 object-cover rounded shadow-sm" />
                </td>
                <td className="p-4">
                  <div className="font-bold text-gray-800">{book.title}</div>
                  <div className="text-gray-500">{book.author}</div>
                </td>
                <td className="p-4">
                  <div className="text-gray-600 font-mono">{book.isbn}</div>
                  <div className="text-xs text-gray-400">{book.category}</div>
                </td>
                <td className="p-4 text-gray-600">{book.location}</td>
                <td className="p-4">
                  <Badge status={book.status} />
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                     onClick={() => setViewingBookId(book.id)}
                     className="text-brand-600 hover:text-brand-800 font-medium"
                  >
                    查看借阅
                  </button>
                  <button className="text-rose-500 hover:text-rose-700 font-medium">下架</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Borrower Modal */}
      {viewingBookId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-up">
               <h3 className="text-lg font-bold mb-4">当前借阅状态</h3>
               {(() => {
                  const info = getActiveBorrowInfo(viewingBookId);
                  if (info) {
                     return (
                       <div className="space-y-4">
                          <div className="bg-brand-50 p-4 rounded-xl">
                             <p className="text-sm text-gray-500 mb-1">借阅人</p>
                             <p className="font-bold text-lg">{info.user?.name} <span className="text-sm font-normal text-gray-500">(@{info.user?.username})</span></p>
                          </div>
                          <div className="flex gap-4">
                             <div className="flex-1 bg-gray-50 p-4 rounded-xl">
                                <p className="text-sm text-gray-500 mb-1">联系电话</p>
                                <p className="font-mono">{info.user?.contact}</p>
                             </div>
                             <div className={`flex-1 p-4 rounded-xl ${info.record.status === 'overdue' ? 'bg-rose-50 text-rose-700' : 'bg-gray-50'}`}>
                                <p className="text-sm opacity-70 mb-1">应还日期</p>
                                <p className="font-bold font-mono">{info.record.dueDate}</p>
                             </div>
                          </div>
                       </div>
                     )
                  }
                  return <p className="text-center text-gray-400 py-4">该书当前在架，未被借出。</p>;
               })()}
               <button onClick={() => setViewingBookId(null)} className="w-full mt-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">关闭</button>
            </div>
         </div>
      )}
    </div>
  );
}

function AdminUserManagement({ users, setUsers, records, books }: any) {
  const [viewRecordUserId, setViewRecordUserId] = useState<number | null>(null);

  const getUserActiveBorrows = (userId: number) => {
    return records.filter((r: BorrowRecord) => r.userId === userId && r.status !== 'returned');
  };

  const calculateFine = (dueDate: string) => {
    const diff = Date.now() - new Date(dueDate).getTime();
    if (diff <= 0) return 0;
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days * 0.5; // Fixed 0.5 rate
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">用户管理 ({users.length})</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" />
          添加用户
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold">
            <tr>
              <th className="p-4">用户</th>
              <th className="p-4">联系方式</th>
              <th className="p-4">角色</th>
              <th className="p-4">借阅统计</th>
              <th className="p-4">状态</th>
              <th className="p-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user: any) => {
              const userRecords = records.filter((r: any) => r.userId === user.id);
              const activeBorrows = userRecords.filter((r: any) => r.status !== 'returned').length;
              
              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                      <div>
                        <div className="font-bold text-gray-800">{user.name}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{user.contact}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => setViewRecordUserId(user.id)} className="text-brand-600 hover:underline font-medium">
                      当前: {activeBorrows} 本 (查看详情)
                    </button>
                    <div className="text-xs text-gray-500 mt-1">历史: {userRecords.length} 本</div>
                  </td>
                  <td className="p-4">
                    <Badge status={user.status} />
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button className="text-brand-600 hover:text-brand-800 font-medium">编辑</button>
                    {user.status === 'active' ? (
                      <button className="text-rose-500 hover:text-rose-700 font-medium">冻结</button>
                    ) : (
                      <button className="text-emerald-500 hover:text-emerald-700 font-medium">解冻</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

       {/* View Borrows Modal */}
       {viewRecordUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-up">
            <h3 className="text-lg font-bold mb-4">当前借阅记录</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
               {getUserActiveBorrows(viewRecordUserId).map((r: BorrowRecord) => {
                 const book = books.find((b: Book) => b.id === r.bookId);
                 const isOverdue = new Date(r.dueDate) < new Date();
                 const fine = isOverdue ? calculateFine(r.dueDate) : 0;
                 
                 return (
                   <div key={r.id} className={`p-4 rounded-xl border ${isOverdue ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100'}`}>
                     <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800">{book?.title || '未知书籍'}</h4>
                        {isOverdue && <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded font-bold">已逾期</span>}
                     </div>
                     <div className="flex justify-between text-sm text-gray-600">
                        <span>借阅日期: {r.borrowDate}</span>
                        <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>应还: {r.dueDate}</span>
                     </div>
                     {isOverdue && (
                       <div className="mt-2 pt-2 border-t border-rose-200 flex justify-between items-center text-rose-700">
                          <span className="text-xs">产生罚金 (0.5元/天)</span>
                          <span className="font-bold">¥ {fine.toFixed(1)}</span>
                       </div>
                     )}
                   </div>
                 )
               })}
               {getUserActiveBorrows(viewRecordUserId).length === 0 && <p className="text-gray-400 text-center py-6">该用户当前无借阅记录</p>}
            </div>
            <button onClick={() => setViewRecordUserId(null)} className="w-full mt-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminSettings({ settings, onUpdate }: any) {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    if(settings) setFormData(settings);
  }, [settings]);

  if (!formData) return null;

  const handleSave = async () => {
    await api.updateSettings(formData);
    onUpdate();
    alert("系统设置已保存");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          全局参数设置
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">每日逾期罚金 (元/天)</label>
            <input 
              type="number" 
              step="0.5"
              value={formData.dailyFine}
              onChange={e => setFormData({...formData, dailyFine: parseFloat(e.target.value)})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最大借阅数量限制 (本)</label>
            <input 
              type="number" 
              value={formData.maxBorrowLimit}
              onChange={e => setFormData({...formData, maxBorrowLimit: parseInt(e.target.value)})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">图书馆公告</label>
            <textarea 
              rows={4}
              value={formData.libraryAnnouncement}
              onChange={e => setFormData({...formData, libraryAnnouncement: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="maintenance"
              checked={formData.maintenanceMode}
              onChange={e => setFormData({...formData, maintenanceMode: e.target.checked})}
              className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500"
            />
            <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">启用维护模式 (仅管理员可登录)</label>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-transform hover:scale-105 shadow-lg shadow-brand-500/30"
          >
            <Save className="w-4 h-4" />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}

function ReaderMyBorrows({ userId, records, books, onReturn, onRenew, currentUser }: any) {
  const myRecords = records.filter((r: BorrowRecord) => r.userId === userId);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTargetId, setReviewTargetId] = useState<number | null>(null);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  
  // Sort: Overdue first, then borrowed, then returned
  const sortedRecords = [...myRecords].sort((a, b) => {
    const statusOrder: Record<string, number> = { overdue: 0, borrowed: 1, returned: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const totalFine = myRecords.reduce((acc: number, r: BorrowRecord) => acc + calculateRealtimeFine(r), 0);

  const openReviewModal = (bookId: number) => {
    setReviewTargetId(bookId);
    setReviewContent('');
    setReviewRating(5);
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewTargetId) return;
    const newReview: Review = {
      id: Date.now(),
      userId: userId,
      bookId: reviewTargetId,
      rating: reviewRating,
      content: reviewContent,
      date: new Date().toISOString().split('T')[0]
    };
    await api.addReview(newReview);
    alert('书评发表成功！');
    setShowReviewModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-brand-500 to-brand-400 p-6 rounded-2xl text-white shadow-lg shadow-brand-200">
           <p className="text-brand-100 text-sm mb-1">当前借阅</p>
           <p className="text-3xl font-bold">{myRecords.filter((r: BorrowRecord) => r.status !== 'returned').length} / 10</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <p className="text-gray-500 text-sm mb-1">即将到期</p>
           <p className="text-3xl font-bold text-amber-500">
             {myRecords.filter((r: BorrowRecord) => {
                if(r.status === 'returned') return false;
                const daysLeft = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                return daysLeft <= 3 && daysLeft >= 0;
             }).length}
           </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <p className="text-gray-500 text-sm mb-1">累计罚金</p>
           <p className="text-3xl font-bold text-rose-500">¥ {totalFine.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h3 className="font-bold text-gray-800">借阅记录 ({myRecords.length})</h3>
        </div>
        <ul>
          {sortedRecords.map((record: BorrowRecord) => {
            const book = books.find((b: Book) => b.id === record.bookId);
            const activeFine = calculateRealtimeFine(record);
            
            if (!book) return null;
            return (
              <li key={record.id} className="p-6 border-b border-gray-50 last:border-none flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-gray-50 transition-colors">
                 <img src={book.coverUrl} alt={book.title} className="w-16 h-20 object-cover rounded shadow-sm" />
                 <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">{book.title}</h4>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                       <span>借阅: {record.borrowDate}</span>
                       <span className={record.status === 'overdue' ? 'text-rose-500 font-bold' : ''}>
                         {record.status === 'returned' ? `归还: ${record.returnDate}` : `应还: ${record.dueDate}`}
                       </span>
                       {activeFine > 0 && <span className="text-rose-500">罚金: ¥{activeFine.toFixed(1)}</span>}
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <Badge status={record.status} />
                    {record.status !== 'returned' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onRenew(record.id)}
                          className="px-3 py-1.5 text-sm bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          续借
                        </button>
                        <button 
                          onClick={() => onReturn(record.id)}
                          className="px-3 py-1.5 text-sm bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors"
                        >
                          归还
                        </button>
                      </div>
                    )}
                    {record.status === 'returned' && (
                      <button 
                        onClick={() => openReviewModal(record.bookId)}
                        className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        写书评
                      </button>
                    )}
                 </div>
              </li>
            );
          })}
        </ul>
      </div>

       {/* Review Modal */}
       {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">撰写书评</h3>
            <div className="mb-4">
               <label className="block text-sm text-gray-500 mb-1">评分</label>
               <div className="flex gap-2">
                 {[1,2,3,4,5].map(v => (
                   <button key={v} onClick={() => setReviewRating(v)} className="text-2xl text-amber-400 focus:outline-none transition-transform hover:scale-110">
                     {v <= reviewRating ? '★' : '☆'}
                   </button>
                 ))}
               </div>
            </div>
            <textarea 
               className="w-full border border-gray-200 rounded-xl p-3 h-32 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
               placeholder="写下你的读后感..."
               value={reviewContent}
               onChange={e => setReviewContent(e.target.value)}
            ></textarea>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowReviewModal(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
              <button onClick={submitReview} className="flex-1 py-2 text-white bg-brand-600 rounded-lg hover:bg-brand-700">提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReaderReservations({ reservations, books, setReservations }: any) {
  const handleCancel = (id: number) => {
    setReservations(reservations.map((r: Reservation) => r.id === id ? {...r, status: 'cancelled'} : r));
    api.cancelReservation(id);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
       {reservations.length === 0 ? (
          <div className="p-10 text-center text-gray-400">暂无预约记录</div>
       ) : (
         <ul>
           {reservations.map((res: Reservation) => {
             const book = books.find((b: Book) => b.id === res.bookId);
             if(!book) return null;
             return (
               <li key={res.id} className="p-6 border-b border-gray-50 last:border-none flex justify-between items-center">
                 <div>
                    <h4 className="font-bold text-gray-800">{book.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">预约时间: {res.reservationTime}</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <Badge status={res.status} />
                    {res.status === 'pending' && (
                      <button 
                        onClick={() => handleCancel(res.id)}
                        className="text-sm text-rose-500 hover:text-rose-700 underline"
                      >
                        取消预约
                      </button>
                    )}
                 </div>
               </li>
             )
           })}
         </ul>
       )}
    </div>
  )
}

function AdminDashboard({ books, records, users, onNavigate }: { books: Book[], records: BorrowRecord[], users: User[], onNavigate: (view: string) => void }) {
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  // Mock Data for Charts
  const dailyData = [
    { name: 'Mon', borrow: 40, return: 24 },
    { name: 'Tue', borrow: 30, return: 13 },
    { name: 'Wed', borrow: 20, return: 58 },
    { name: 'Thu', borrow: 27, return: 39 },
    { name: 'Fri', borrow: 18, return: 48 },
    { name: 'Sat', borrow: 23, return: 38 },
    { name: 'Sun', borrow: 34, return: 43 },
  ];

  const categoryData = [
    { name: '计算机', value: books.filter(b => b.category === '计算机科学').length },
    { name: '文学', value: books.filter(b => b.category === '文学').length },
    { name: '科幻', value: books.filter(b => b.category === '科幻小说').length },
  ];
  const COLORS = ['#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b'];

  // Calculate actual overdue records based on date, not just status string
  const overdueRecords = records.filter(r => 
    r.status === 'overdue' || (r.status === 'borrowed' && new Date(r.dueDate) < new Date())
  );

  const StatCard = ({ title, value, color, icon: Icon, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-800">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="今日借阅" value={records.filter(r => r.borrowDate === new Date().toISOString().split('T')[0]).length} color="bg-brand-500" icon={BookOpen} />
        <StatCard title="今日归还" value={records.filter(r => r.returnDate === new Date().toISOString().split('T')[0]).length} color="bg-emerald-500" icon={CheckCircle2} />
        <StatCard 
          title="当前逾期" 
          value={overdueRecords.length} 
          color="bg-rose-500" 
          icon={AlertCircle} 
          onClick={() => setShowOverdueModal(true)}
        />
        <StatCard 
          title="总馆藏" 
          value={books.length} 
          color="bg-amber-500" 
          icon={Clock} 
          onClick={() => onNavigate('books-admin')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">近7日借还趋势</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" />
                <Bar dataKey="borrow" name="借出" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="return" name="归还" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">馆藏分类占比</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Overdue Modal */}
      {showOverdueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                逾期书籍列表 (实时统计)
              </h3>
              <button onClick={() => setShowOverdueModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              <table className="w-full text-left text-sm">
                <thead className="bg-rose-50 text-rose-800">
                  <tr>
                    <th className="p-3 rounded-l-lg">书名</th>
                    <th className="p-3">借阅人</th>
                    <th className="p-3">联系电话</th>
                    <th className="p-3">应还日期</th>
                    <th className="p-3 rounded-r-lg">当前罚金</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueRecords.map(r => {
                    const book = books.find(b => b.id === r.bookId);
                    const user = users.find(u => u.id === r.userId);
                    const fine = calculateRealtimeFine(r);
                    return (
                      <tr key={r.id} className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-800">{book?.title || '未知书籍'}</td>
                        <td className="p-3">{user?.name || '未知用户'}</td>
                        <td className="p-3 font-mono text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user?.contact}
                        </td>
                        <td className="p-3 text-rose-500 font-bold">{r.dueDate}</td>
                        <td className="p-3 text-rose-500">¥{fine.toFixed(1)}</td>
                      </tr>
                    )
                  })}
                  {overdueRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">目前没有逾期记录 🎉</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowOverdueModal(false)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}