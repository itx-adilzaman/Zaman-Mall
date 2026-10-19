
import { Product, Ad } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Aetheria Smart Watch',
    description: 'A revolutionary wearable that monitors your health with biological precision. Features advanced sensors for heart rate, sleep tracking, and blood oxygen levels.',
    price: 15000,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800',
    stock: 15,
    featured: true,
    ratings: [5, 4, 5, 5, 4],
    variants: [
      { type: 'Color', options: ['Midnight Black', 'Starlight Silver', 'Deep Sea Blue'] },
      { type: 'Size', options: ['40mm', '44mm'] }
    ]
  },
  {
    id: '2',
    name: 'Lumina Noise-Canceling Headphones',
    description: 'Immerse yourself in pure silence or high-fidelity soundscapes. With 40 hours of battery life and studio-grade acoustics.',
    price: 25000,
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    stock: 10,
    featured: true,
    ratings: [5, 5, 5, 5],
    variants: [
      { type: 'Color', options: ['Carbon Dark', 'Ivory White', 'Desert Sand'] }
    ]
  },
  {
    id: '3',
    name: 'Nebula Pro Drone',
    description: 'Capture the world from impossible angles with 8K resolution. Includes obstacle avoidance and 45-minute flight time.',
    price: 125000,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&q=80&w=800',
    stock: 5,
    featured: true,
    ratings: [5, 4, 5],
    variants: [
      { type: 'Material', options: ['Carbon Fiber', 'Lightweight Alloy'] }
    ]
  },
  {
    id: '4',
    name: 'Vertex Mechanical Keyboard',
    description: 'Tactile perfection for the modern typist and gamer. Custom switches and RGB lighting per key.',
    price: 12000,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=800',
    stock: 25,
    ratings: [4, 4, 4, 5],
    variants: [
      { type: 'Color', options: ['Arctic White', 'Obsidian Black'] },
      { type: 'Material', options: ['Aluminum Case', 'Polycarbonate Case'] }
    ]
  },
  {
    id: '5',
    name: 'Prism OLED Monitor',
    description: 'Experience billion-color depth and 240Hz refresh rates. The ultimate display for creative pros and competitive gamers.',
    price: 185000,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800',
    stock: 8,
    ratings: [5, 5],
    variants: [
      { type: 'Size', options: ['27-inch', '32-inch'] }
    ]
  },
  {
    id: '6',
    name: 'Echo Scent Diffuser',
    description: 'Smart aromatherapy for your modern living space. Control intensity and schedules via your smartphone.',
    price: 8500,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800',
    stock: 50,
    ratings: [4, 5, 4, 3, 5],
    variants: [
      { type: 'Color', options: ['Ceramic White', 'Slate Grey'] }
    ]
  }
];

export const INITIAL_ADS: Ad[] = [
  {
    id: 'ad1',
    title: 'THE FUTURE OF AUDIO',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=2000',
    link: '#/shop?category=Audio',
    active: true
  },
  {
    id: 'ad2',
    title: 'IMPERIAL SMART WEAR',
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aac29bb44b3?auto=format&fit=crop&q=80&w=2000',
    link: '#/shop?category=Electronics',
    active: true
  }
];

export const CATEGORIES = ['All', 'Electronics', 'Audio', 'Accessories', 'Home'];
