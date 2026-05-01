
export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

export enum LocationType {
  Urban = 'Urban',
  Suburban = 'Suburban',
  Rural = 'Rural'
}

export enum IncomeLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export type Industry = 'Generic' | 'Fashion' | 'Electronics' | 'SaaS';

export type CustomerSegment = 'High' | 'Medium' | 'Low';

export interface CustomerData {
  id: string;
  age: number;
  gender: Gender;
  location: LocationType;
  incomeLevel: IncomeLevel;
  purchaseFrequency: number;
  avgOrderValue: number;
  recencyDays: number;
  tenureDays: number;
  churned: number;
}

export interface SegmentationThresholds {
  medium: number;
  high: number;
}

export interface PredictionResult {
  clv: number;
  segment: CustomerSegment;
  confidence: number;
  inputData: CustomerData;
}

export interface BulkPredictionResult {
  summary: {
    totalCustomers: number;
    avgCLV: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  details: (CustomerData & { predictedCLV: number; segment: CustomerSegment })[];
}

export interface TrainingMetrics {
  r2Score: number;
  mae: number;
  rmse: number;
  samplesProcessed: number;
}

// --- E-COMMERCE MODELS (Operational Layer) ---

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  stock: number;
  enabled: boolean;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  priceAtPurchase: number;
}

export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface Order {
  id: string;
  customerId: string;
  date: string; // ISO Date String
  totalAmount: number;
  items: OrderItem[];
  status: OrderStatus;
}

export interface Complaint {
  id: string;
  date: string;
  message: string;
  status: 'open' | 'resolved';
}

export interface EcommerceProfile {
  id: string;
  name: string;
  email: string;
  password?: string; // Stored as a simple string for this mock/demo
  // Demographics for CLV
  age: number;
  gender: Gender;
  location: LocationType;
  incomeLevel: IncomeLevel;
  joinedDate: string; // ISO Date String
  isBlocked: boolean;
  complaints: Complaint[];
}

export interface AuthState {
  user: EcommerceProfile | null;
  isAuthenticated: boolean;
}
