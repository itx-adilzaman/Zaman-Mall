export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  bio?: string;
  location?: string;
  joinedDate: string;
  phone?: string;
  address?: string;
  verified?: boolean;
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
  options: (string | VariantOption)[]; // backward compatible: string = old, VariantOption = new
}

export interface ProductVideo {
  id?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
  sortOrder?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  videos?: ProductVideo[];
  stock: number;
  featured?: boolean;
  ratings?: number[];
  reviews?: Review[];
  variants?: ProductVariant[];
  country?: 'pakistan' | 'china';
}

export interface CartItem extends Product {
  quantity: number;
  baseProductId?: string;
  selectedVariants?: Record<string, string>;
  selectedVariantPrice?: number;
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
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  date: string;
  deliveredAt?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  paymentMethod: 'cod' | 'safepay';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  returnRequest?: ReturnRequest;
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

export interface Category {
  id: string;
  name: string;
  name_urdu?: string;
  description?: string;
  image_url: string;
  icon_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface AppVersion {
  id: string;
  version_code: string;
  download_url: string;
  is_critical: boolean;
  release_notes: string;
  created_at?: string;
}

export type OrderStatus = Order['status'];
