// Supabase Database Types
// This file contains TypeScript types that match your Supabase database schema

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          name: string;
          role: 'admin' | 'user';
          avatar?: string;
          bio?: string;
          location?: string;
          number?: string;
          address?: string;
          profile_pic?: string;
          provider?: 'google' | 'microsoft' | 'github' | 'facebook';
          oauth_provider?: 'google' | 'microsoft' | 'github' | 'facebook';
          is_oauth_user?: boolean;
          verified?: boolean;
          username?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          category: string;
          image: string;
          images?: string[];
          stock: number;
          featured?: boolean;
          average_rating?: number;
          total_reviews?: number;
          variants?: any; // JSON field for product variants
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      cart: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          name: string;
          price: number;
          image: string;
          category: string;
          quantity: number;
          selected_variants: Record<string, string>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cart']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['cart']['Insert']>;
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['favorites']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['favorites']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          items: any; // JSON
          total: number;
          status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
          customer_name: string;
          customer_phone: string;
          customer_email: string;
          shipping_address: string;
          payment_method: 'cod' | 'mock';
          return_request?: any; // JSON
          delivered_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          user_id?: string;
          product_id: string;
          order_id?: string;
          user_name: string;
          avatar?: string;
          rating: number;
          comment?: string;
          images?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          full_name: string;
          phone: string;
          street_address: string;
          city: string;
          province?: string;
          district?: string;
          tehsil?: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['addresses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
      };
      contact_messages: {
        Row: {
          id: string;
          user_id?: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          read: boolean;
          reply?: string;
          replied_at?: string;
          reply_read_by_user?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contact_messages']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>;
      };
      ads: {
        Row: {
          id: string;
          title: string;
          image_url: string;
          video_url?: string;
          link: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ads']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ads']['Insert']>;
      };
    };
  };
}

// Type helpers for commonly used joins
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Cart = Database['public']['Tables']['cart']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];
export type ContactMessage = Database['public']['Tables']['contact_messages']['Row'];
export type Ad = Database['public']['Tables']['ads']['Row'];
