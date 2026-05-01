import { EcommerceProfile, Order, Product, Gender, LocationType, IncomeLevel, OrderItem, Complaint } from '../types';

// --- MOCK DATABASE ---
// In a real scenario, this would be PostgreSQL managed by Django.

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: "Premium Wireless Headphones", price: 249.99, category: "Electronics", image: "🎧", description: "High-fidelity sound with noise cancellation.", stock: 50, enabled: true },
  { id: 2, name: "Ergonomic Office Chair", price: 199.50, category: "Furniture", image: "🪑", description: "Adjustable lumbar support for long hours.", stock: 20, enabled: true },
  { id: 3, name: "Mechanical Keyboard", price: 129.99, category: "Electronics", image: "⌨️", description: "Tactile switches with RGB lighting.", stock: 35, enabled: true },
  { id: 4, name: "Organic Coffee Subscription", price: 25.00, category: "Food & Bev", image: "☕", description: "Freshly roasted beans delivered monthly.", stock: 100, enabled: true },
  { id: 5, name: "Smart Fitness Watch", price: 159.00, category: "Wearables", image: "⌚", description: "Track your health and workouts.", stock: 40, enabled: true },
  { id: 6, name: "Designer Sunglasses", price: 89.99, category: "Fashion", image: "🕶️", description: "UV protection with a stylish frame.", stock: 60, enabled: true },
];

class EcommerceBackendService {
  private users: EcommerceProfile[] = [];
  private orders: Order[] = [];
  private products: Product[] = [...MOCK_PRODUCTS];
  private STORAGE_KEY = 'shopsmart_enterprise_db';

  constructor() {
    this.loadFromStorage();
    this.seedData();
  }

  private loadFromStorage() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.users = data.users || [];
        this.orders = data.orders || [];
        this.products = data.products || [...MOCK_PRODUCTS];
      } catch (e) {
        console.error("Failed to load data from storage", e);
      }
    }
  }

  private saveToStorage() {
    const data = {
      users: this.users,
      orders: this.orders,
      products: this.products
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private seedData() {
    if (this.users.length === 0) {
      // ... same seed logic ...
      for (let i = 0; i < 50; i++) {
        const id = `USR-${1000 + i}`;
        this.users.push({
          id,
          name: `Customer ${i + 1}`,
          email: `user${i + 1}@example.com`,
          password: 'password123',
          age: 18 + Math.floor(Math.random() * 50),
          gender: Math.random() > 0.5 ? Gender.Male : Gender.Female,
          location: Object.values(LocationType)[Math.floor(Math.random() * 3)],
          incomeLevel: Object.values(IncomeLevel)[Math.floor(Math.random() * 3)],
          joinedDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 700).toISOString(),
          isBlocked: false,
          complaints: []
        });

        const orderCount = Math.floor(Math.random() * 10);
        for (let j = 0; j < orderCount; j++) {
           this.createMockOrder(id);
        }
      }
      this.saveToStorage();
    }
  }

  private createMockOrder(userId: string) {
    const product = this.products[Math.floor(Math.random() * this.products.length)];
    const qty = 1 + Math.floor(Math.random() * 2);
    const date = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365).toISOString();
    
    this.orders.push({
        id: `ORD-${Math.random().toString(36).substr(2, 9)}`,
        customerId: userId,
        date: date,
        totalAmount: product.price * qty,
        items: [{ productId: product.id, quantity: qty, priceAtPurchase: product.price }],
        status: 'delivered'
    });
  }

  // --- PUBLIC API METHODS ---

  getProducts(): Product[] {
    return this.products;
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      ...product,
      id: this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1
    };
    this.products.push(newProduct);
    this.saveToStorage();
    return newProduct;
  }

  updateProduct(id: number, updates: Partial<Product>): Product {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    this.products[index] = { ...this.products[index], ...updates };
    this.saveToStorage();
    return this.products[index];
  }

  registerUser(profile: Omit<EcommerceProfile, 'id' | 'joinedDate' | 'isBlocked' | 'complaints'>): EcommerceProfile {
    // Check if email already exists
    if (this.users.some(u => u.email === profile.email)) {
      throw new Error("Email already registered");
    }

    const newUser: EcommerceProfile = {
      ...profile,
      id: `USR-${1000 + this.users.length}`,
      joinedDate: new Date().toISOString(),
      isBlocked: false,
      complaints: []
    };
    this.users.push(newUser);
    this.saveToStorage();
    return newUser;
  }

  login(email: string, password: string): EcommerceProfile {
    const user = this.users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid email or password");
    if (user.isBlocked) throw new Error("Account is blocked");
    return user;
  }

  getAllUsers(): EcommerceProfile[] {
    return this.users;
  }

  updateUserStatus(userId: string, isBlocked: boolean): EcommerceProfile {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    user.isBlocked = isBlocked;
    this.saveToStorage();
    return user;
  }

  addComplaint(userId: string, message: string): Complaint {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    const complaint: Complaint = {
      id: `CMP-${Date.now()}`,
      date: new Date().toISOString(),
      message,
      status: 'open'
    };
    user.complaints.push(complaint);
    this.saveToStorage();
    return complaint;
  }

  resolveComplaint(userId: string, complaintId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    const complaint = user.complaints.find(c => c.id === complaintId);
    if (complaint) {
      complaint.status = 'resolved';
      this.saveToStorage();
    }
  }

  placeOrder(userId: string, items: { product: Product, qty: number }[]): Order {
    const total = items.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
    const orderItems: OrderItem[] = items.map(i => ({
        productId: i.product.id,
        quantity: i.qty,
        priceAtPurchase: i.product.price
    }));

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      customerId: userId,
      date: new Date().toISOString(),
      totalAmount: total,
      items: orderItems,
      status: 'pending'
    };
    
    this.orders.push(newOrder);
    
    // Update stock
    items.forEach(item => {
      const p = this.products.find(prod => prod.id === item.product.id);
      if (p) p.stock = Math.max(0, p.stock - item.qty);
    });

    this.saveToStorage();
    return newOrder;
  }

  getAllOrders(): Order[] {
    return this.orders;
  }

  updateOrderStatus(orderId: string, status: Order['status']): Order {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    order.status = status;
    this.saveToStorage();
    return order;
  }

  // --- DATA AGGREGATION FOR CLV (The ETL Pipeline) ---
  // This mimics the logic in the Django 'CLVExportSerializer'

  generateCLVDataCSV(): string {
    const headers = [
      'id', 'age', 'gender', 'location', 'income_level',
      'purchase_frequency', 'avg_order_value', 'recency_days', 
      'tenure_days', 'churned'
    ];

    const rows = this.users.map(user => {
      // 1. Fetch User Orders
      const userOrders = this.orders.filter(o => o.customerId === user.id);
      
      // 2. Aggregate Metrics
      const totalOrders = userOrders.length;
      const totalSpent = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      
      // Purchase Frequency (Avg per month) - Simplified logic
      // Real tenure in months
      const joinDate = new Date(user.joinedDate);
      const now = new Date();
      const tenureMs = now.getTime() - joinDate.getTime();
      const tenureDays = Math.floor(tenureMs / (1000 * 60 * 60 * 24));
      const tenureMonths = Math.max(1, tenureDays / 30);
      
      // Metric: Purchase Frequency (Orders per month approx, or raw count depending on model)
      // The CLV model expects a value around 1-10 usually. Let's use raw count per month average.
      const purchaseFrequency = totalOrders > 0 ? (totalOrders / tenureMonths) * 30 : 0; // annualized or normalized
      // Actually, looking at the ML Service inputs, it takes raw numbers like 4.6.
      // Let's stick to Average Orders Per Month approx.
      
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Recency
      let recencyDays = 999;
      if (totalOrders > 0) {
        // Find latest order
        const sorted = [...userOrders].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastOrderDate = new Date(sorted[0].date);
        recencyDays = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Churned (Academic def: No purchase in 90 days)
      const churned = recencyDays > 90 ? 1 : 0;

      // Map to CSV Row
      return [
        user.id,
        user.age,
        user.gender,
        user.location,
        user.incomeLevel,
        purchaseFrequency.toFixed(2), // Freq
        avgOrderValue.toFixed(2),     // AOV
        recencyDays,
        tenureDays,
        churned
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  // Helper for UI
  getStats() {
    return {
      users: this.users.length,
      orders: this.orders.length,
      revenue: this.orders.reduce((acc, o) => acc + o.totalAmount, 0)
    };
  }
}

// Singleton export
export const ecommerceService = new EcommerceBackendService();
