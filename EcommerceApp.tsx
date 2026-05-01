import React, { useState, useEffect } from 'react';
import { ecommerceService } from '../services/ecommerceService';
import { Gender, LocationType, IncomeLevel, Product, EcommerceProfile, Order, OrderStatus } from '../types';
import { 
  UserPlus, Database, Download, Play, ShoppingCart, LogOut, 
  Package, ClipboardList, Users, Plus, Edit, CheckCircle, XCircle, 
  Truck, AlertCircle, MessageSquare, History, Search, Save, X
} from 'lucide-react';

const EcommerceApp: React.FC = () => {
  const [view, setView] = useState<'register' | 'login' | 'admin-login' | 'store' | 'admin'>('store');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'products' | 'orders' | 'customers'>('dashboard');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('shopsmart_admin_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<EcommerceProfile | null>(() => {
    const saved = localStorage.getItem('shopsmart_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [stats, setStats] = useState(ecommerceService.getStats());
  
  // Admin Data State
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminUsers, setAdminUsers] = useState<EcommerceProfile[]>([]);
  
  // Form States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    name: '', price: 0, category: 'Electronics', image: '📦', description: '', stock: 0, enabled: true
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Login Form State
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [adminLoginForm, setAdminLoginForm] = useState({ password: '' });

  useEffect(() => {
    if (view === 'admin' && !isAdminAuthenticated) {
      setView('admin-login');
    }
    if (view === 'admin' || view === 'admin-login') {
      refreshAdminData();
    }
  }, [view, adminTab, isAdminAuthenticated]);

  useEffect(() => {
    localStorage.setItem('shopsmart_admin_auth', isAdminAuthenticated.toString());
  }, [isAdminAuthenticated]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('shopsmart_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('shopsmart_current_user');
    }
  }, [currentUser]);

  const refreshAdminData = () => {
    setAdminProducts(ecommerceService.getProducts());
    setAdminOrders(ecommerceService.getAllOrders().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setAdminUsers(ecommerceService.getAllUsers());
    setStats(ecommerceService.getStats());
  };

  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', age: 25, gender: Gender.Female, location: LocationType.Urban, income: IncomeLevel.Medium
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = ecommerceService.registerUser({
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        age: regForm.age,
        gender: regForm.gender,
        location: regForm.location,
        incomeLevel: regForm.income
      });
      setCurrentUser(newUser);
      refreshAdminData();
      setView('store');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = ecommerceService.login(loginForm.email, loginForm.password);
      setCurrentUser(user);
      refreshAdminData();
      setView('store');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLoginForm.password === 'adminlogin') {
      setIsAdminAuthenticated(true);
      setView('admin');
    } else {
      alert("Invalid Admin Password");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminAuthenticated(false);
    setCart([]);
    setView('store');
  };

  const addToCart = (product: Product) => {
    if (!product.enabled || product.stock <= 0) return;
    setCart(prev => [...prev, { product, qty: 1 }]);
  };

  const handleCheckout = () => {
    if (!currentUser) {
      alert("Please login/register first");
      setView('register');
      return;
    }
    if (currentUser.isBlocked) {
      alert("Your account is blocked. Please contact support.");
      return;
    }
    ecommerceService.placeOrder(currentUser.id, cart);
    alert("Order Placed Successfully!");
    setCart([]);
    refreshAdminData();
  };

  const handleExport = () => {
    const csvData = ecommerceService.generateCLVDataCSV();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ecommerce_transaction_export.csv';
    a.click();
  };

  // --- Admin Handlers ---
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      ecommerceService.updateProduct(editingProduct.id, productForm);
    } else {
      ecommerceService.addProduct(productForm);
    }
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm({ name: '', price: 0, category: 'Electronics', image: '📦', description: '', stock: 0, enabled: true });
    refreshAdminData();
  };

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ ...p });
    setShowProductForm(true);
  };

  const handleToggleProduct = (p: Product) => {
    ecommerceService.updateProduct(p.id, { enabled: !p.enabled });
    refreshAdminData();
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    ecommerceService.updateOrderStatus(orderId, status);
    refreshAdminData();
  };

  const handleToggleUserBlock = (u: EcommerceProfile) => {
    ecommerceService.updateUserStatus(u.id, !u.isBlocked);
    refreshAdminData();
  };

  return (
    <div className="bg-white min-h-[700px] rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
             <ShoppingCart className="text-orange-500 w-8 h-8" />
             <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3 border-2 border-slate-900"></div>
          </div>
          <span className="font-bold tracking-wide text-xl">
             <span className="text-orange-500">Shop</span><span className="text-green-500">Smart</span> 
             <span className="text-slate-500 text-xs font-normal ml-2">(Operational Layer)</span>
          </span>
        </div>
        <div className="flex gap-4 text-sm">
           <button onClick={() => setView('store')} className={`hover:text-emerald-400 ${view === 'store' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>Shop</button>
           <button onClick={() => {
             if (isAdminAuthenticated) setView('admin');
             else setView('admin-login');
           }} className={`hover:text-emerald-400 ${(view === 'admin' || view === 'admin-login') ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>Admin Panel</button>
           {currentUser ? (
             <div className="flex items-center gap-2 border-l border-slate-700 pl-4 ml-2">
                <span className="text-slate-300">Hi, {currentUser.name}</span>
                <button onClick={handleLogout}><LogOut size={14}/></button>
             </div>
           ) : (
             <div className="flex gap-3">
               <button onClick={() => setView('login')} className={`hover:text-emerald-400 ${view === 'login' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>Login</button>
               <button onClick={() => setView('register')} className={`hover:text-emerald-400 ${view === 'register' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>Register</button>
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50">
        
        {/* VIEW: STORE */}
        {view === 'store' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-slate-800">Featured Products</h2>
               {cart.length > 0 && (
                 <button 
                  onClick={handleCheckout}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-emerald-700 flex items-center gap-2 animate-bounce"
                 >
                   <ShoppingCart size={18}/> Checkout ({cart.length})
                 </button>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {adminProducts.filter(p => p.enabled).map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4 bg-slate-100 h-32 flex items-center justify-center rounded-lg">{p.image}</div>
                  <h3 className="font-bold text-slate-800">{p.name}</h3>
                  <p className="text-slate-500 text-xs mb-2 line-clamp-2">{p.description}</p>
                  <p className="text-slate-400 text-xs mb-3">{p.category}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-emerald-600">${p.price}</span>
                      <span className={`text-[10px] ${p.stock < 5 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                        {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    <button 
                      disabled={p.stock <= 0}
                      onClick={() => addToCart(p)}
                      className={`text-sm px-3 py-1.5 rounded-md transition-colors ${p.stock > 0 ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <div className="flex justify-center items-center h-full p-8">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md border border-slate-200 w-full max-w-md space-y-4">
              <div className="text-center mb-6">
                <LogOut className="w-12 h-12 text-indigo-500 mx-auto mb-2 rotate-180" />
                <h2 className="text-xl font-bold">Welcome Back</h2>
                <p className="text-sm text-slate-500">Login to your ShopSmart account</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input required type="email" className="w-full border p-2 rounded" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input required type="password" className="w-full border p-2 rounded" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 mt-4">
                Login
              </button>
              
              <p className="text-center text-sm text-slate-500 mt-4">
                Don't have an account? <button type="button" onClick={() => setView('register')} className="text-indigo-600 font-bold">Register</button>
              </p>
            </form>
          </div>
        )}

        {/* VIEW: ADMIN LOGIN */}
        {view === 'admin-login' && (
          <div className="flex justify-center items-center h-full p-8">
            <form onSubmit={handleAdminLogin} className="bg-white p-8 rounded-xl shadow-md border border-slate-200 w-full max-w-md space-y-4">
              <div className="text-center mb-6">
                <Database className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Admin Access</h2>
                <p className="text-sm text-slate-500">Enter the administrative password</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password</label>
                <input 
                  required 
                  type="password" 
                  className="w-full border p-2 rounded" 
                  value={adminLoginForm.password} 
                  onChange={e => setAdminLoginForm({password: e.target.value})} 
                  placeholder="Enter admin password..."
                />
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 mt-4">
                Verify Identity
              </button>
            </form>
          </div>
        )}

        {/* VIEW: REGISTER */}
        {view === 'register' && (
          <div className="flex justify-center items-center h-full p-8">
            <form onSubmit={handleRegister} className="bg-white p-8 rounded-xl shadow-md border border-slate-200 w-full max-w-md space-y-4">
              <div className="text-center mb-6">
                <UserPlus className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h2 className="text-xl font-bold">New Customer Registration</h2>
                <p className="text-sm text-slate-500">Create a profile to generate demographic data</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input required type="text" className="w-full border p-2 rounded" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input required type="email" className="w-full border p-2 rounded" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input required type="password" className="w-full border p-2 rounded" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                    <input type="number" className="w-full border p-2 rounded" value={regForm.age} onChange={e => setRegForm({...regForm, age: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select className="w-full border p-2 rounded" value={regForm.gender} onChange={e => setRegForm({...regForm, gender: e.target.value as Gender})}>
                      {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                    <select className="w-full border p-2 rounded" value={regForm.location} onChange={e => setRegForm({...regForm, location: e.target.value as LocationType})}>
                      {Object.values(LocationType).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Income</label>
                    <select className="w-full border p-2 rounded" value={regForm.income} onChange={e => setRegForm({...regForm, income: e.target.value as IncomeLevel})}>
                      {Object.values(IncomeLevel).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 mt-4">
                Create Account
              </button>
            </form>
          </div>
        )}

        {/* VIEW: ADMIN */}
        {view === 'admin' && (
          <div className="flex h-full">
            {/* Admin Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
              <div className="p-6 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Database size={18} className="text-indigo-600"/> Admin Panel
                </h2>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                <button 
                  onClick={() => setAdminTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${adminTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Play size={18} /> Dashboard
                </button>
                <button 
                  onClick={() => setAdminTab('products')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${adminTab === 'products' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Package size={18} /> Products
                </button>
                <button 
                  onClick={() => setAdminTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${adminTab === 'orders' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <ClipboardList size={18} /> Orders
                </button>
                <button 
                  onClick={() => setAdminTab('customers')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${adminTab === 'customers' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Users size={18} /> Customers
                </button>
              </nav>
            </div>

            {/* Admin Content */}
            <div className="flex-1 p-8 overflow-auto">
              
              {/* DASHBOARD TAB */}
              {adminTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-3xl font-bold text-slate-900">{stats.users}</div>
                      <div className="text-xs text-slate-500 uppercase font-bold mt-1">Total Users</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-3xl font-bold text-emerald-600">{stats.orders}</div>
                      <div className="text-xs text-slate-500 uppercase font-bold mt-1">Total Transactions</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-3xl font-bold text-indigo-600">${stats.revenue.toFixed(0)}</div>
                      <div className="text-xs text-slate-500 uppercase font-bold mt-1">Total Revenue</div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-indigo-900 text-lg">Export Data for Analytics</h3>
                      <p className="text-indigo-700 text-sm max-w-md mt-1">
                        Extracts raw transactional data, aggregates behavioral metrics (RFM), and generates a CSV compatible with the CLV Predictor Pro system.
                      </p>
                    </div>
                    <button 
                      onClick={handleExport}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2"
                    >
                      <Download size={20} /> Download CSV
                    </button>
                  </div>
                </div>
              )}

              {/* PRODUCTS TAB */}
              {adminTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Product Management</h3>
                    <button 
                      onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: 0, category: 'Electronics', image: '📦', description: '', stock: 0, enabled: true }); setShowProductForm(true); }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700"
                    >
                      <Plus size={18} /> Add Product
                    </button>
                  </div>

                  {showProductForm && (
                    <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-md animate-in fade-in slide-in-from-top-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800">{editingProduct ? 'Edit Product' : 'New Product'}</h4>
                        <button onClick={() => setShowProductForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                      </div>
                      <form onSubmit={handleSaveProduct} className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Product Name</label>
                          <input required className="w-full border p-2 rounded text-sm" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Price ($)</label>
                          <input type="number" step="0.01" required className="w-full border p-2 rounded text-sm" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                          <select className="w-full border p-2 rounded text-sm" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                            <option>Electronics</option>
                            <option>Furniture</option>
                            <option>Food & Bev</option>
                            <option>Wearables</option>
                            <option>Fashion</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Stock Level</label>
                          <input type="number" required className="w-full border p-2 rounded text-sm" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Icon/Emoji</label>
                          <input className="w-full border p-2 rounded text-sm" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                          <textarea className="w-full border p-2 rounded text-sm h-20" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                        </div>
                        <div className="col-span-2 flex justify-end gap-3 mt-2">
                          <button type="button" onClick={() => setShowProductForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                            <Save size={16}/> {editingProduct ? 'Update Product' : 'Create Product'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 font-bold text-slate-700">Product</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Category</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Price</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Stock</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Status</th>
                          <th className="px-6 py-3 font-bold text-slate-700 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminProducts.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{p.image}</span>
                                <div className="font-medium text-slate-900">{p.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{p.category}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">${p.price.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`font-mono ${p.stock < 10 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{p.stock}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                {p.enabled ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => handleEditProduct(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit size={16}/></button>
                              <button onClick={() => handleToggleProduct(p)} className={`p-1.5 transition-colors ${p.enabled ? 'text-green-400 hover:text-red-500' : 'text-slate-300 hover:text-green-600'}`}>
                                {p.enabled ? <XCircle size={16}/> : <CheckCircle size={16}/>}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ORDERS TAB */}
              {adminTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Order Management</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input 
                        placeholder="Search orders..." 
                        className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 font-bold text-slate-700">Order ID</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Customer</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Date</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Total</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Status</th>
                          <th className="px-6 py-3 font-bold text-slate-700 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminOrders.filter(o => o.id.includes(searchQuery) || o.customerId.includes(searchQuery)).map(o => (
                          <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{o.id}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{adminUsers.find(u => u.id === o.customerId)?.name || o.customerId}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(o.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">${o.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase 
                                ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                  o.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 
                                  o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                  'bg-amber-100 text-amber-700'}`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {o.status === 'pending' && (
                                  <button onClick={() => handleUpdateOrderStatus(o.id, 'shipped')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ship Order"><Truck size={16}/></button>
                                )}
                                {o.status === 'shipped' && (
                                  <button onClick={() => handleUpdateOrderStatus(o.id, 'delivered')} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark Delivered"><CheckCircle size={16}/></button>
                                )}
                                {(o.status === 'pending' || o.status === 'shipped') && (
                                  <button onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancel Order"><XCircle size={16}/></button>
                                )}
                                {o.status === 'delivered' && (
                                  <button onClick={() => handleUpdateOrderStatus(o.id, 'returned')} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Process Return"><AlertCircle size={16}/></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CUSTOMERS TAB */}
              {adminTab === 'customers' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Customer Management</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input 
                        placeholder="Search customers..." 
                        className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 font-bold text-slate-700">Customer</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Email</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Joined</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Orders</th>
                          <th className="px-6 py-3 font-bold text-slate-700">Status</th>
                          <th className="px-6 py-3 font-bold text-slate-700 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900">{u.name}</div>
                              <div className="text-[10px] text-slate-400 uppercase font-bold">{u.id}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{u.email}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(u.joinedDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-mono text-slate-600">
                              {adminOrders.filter(o => o.customerId === u.id).length}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {u.isBlocked ? 'Blocked' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button className="p-1.5 text-slate-400 hover:text-indigo-600" title="View History"><History size={16}/></button>
                                <button className="p-1.5 text-slate-400 hover:text-amber-600" title="Complaints"><MessageSquare size={16}/></button>
                                <button 
                                  onClick={() => handleToggleUserBlock(u)}
                                  className={`p-1.5 rounded transition-colors ${u.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                                  title={u.isBlocked ? 'Unblock User' : 'Block User'}
                                >
                                  {u.isBlocked ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EcommerceApp;
