export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  password?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinedDate: string;
  phone?: string;
  address?: string;
  profilePic?: string;
  // OAuth fields
  provider?: 'google' | 'microsoft' | 'github' | 'facebook';
  oauthProvider?: 'google' | 'microsoft' | 'github' | 'facebook';
  isOAuthUser?: boolean;
  verified?: boolean;
  username?: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  province?: string;
  district?: string;
  tehsil?: string;
  isDefault: boolean;
}

export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  link: string;
  active: boolean;
}

export interface Review {
  id: string;
  userId?: string;
  userName: string;
  avatar?: string;
  rating: number;
  comment: string;
  date: string;
  images?: string[];
}

export interface VariantOption {
  value: string;
  price?: number; // optional — if not set, product base price applies
}

export interface ProductVariant {
  type: string;
  options: (string | VariantOption)[]; // backward compatible
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  videos?: {
    videoUrl: string;
    thumbnailUrl?: string;
    title?: string;
    sortOrder?: number;
  }[];
  stock: number;
  featured?: boolean;
  ratings?: number[];
  averageRating?: number;
  totalReviews?: number;
  reviews?: Review[];
  variants?: ProductVariant[];
  country?: 'pakistan' | 'china';
  videoUrl?: string; // For backward compatibility if needed
}

export interface CartItem extends Product {
  quantity: number;
  baseProductId?: string;
  selectedVariants?: Record<string, string>;
  selectedVariantPrice?: number; // price for the selected variant combo (if any)
}

export interface ReturnRequest {
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export interface Order {
  id: string;
  userId?: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'return_pending';
  date: string;
  deliveredAt?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  paymentMethod: 'cod' | 'easypaisa' | 'jazzcash' | 'mock';
  paymentStatus?: 'paid' | 'pending' | 'awaiting_approval' | 'approved' | 'rejected';
  paymentReceiptUrl?: string;
  returnRequest?: ReturnRequest;
  hasReviewed?: boolean;
}

export interface ContactMessage {
  id: string;
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
  reply?: string;
  repliedAt?: string;
  replyReadByUser?: boolean;
}

export interface DashboardStats {
  totalSales: number;
  orderCount: number;
  productCount: number;
  recentOrders: Order[];
}
