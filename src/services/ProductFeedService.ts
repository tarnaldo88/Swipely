import { 
  ProductCard, 
  ProductFeedResponse, 
  CategoryPreferences, 
  SwipeAction,
  SwipeActionResponse 
} from '../types';
import { CategoryPreferenceService } from './CategoryPreferenceService';
import { ErrorFactory } from '../utils/ErrorFactory';
import { ErrorType } from '../types/errors';

interface FeedFilters {
  categories?: string[];
  priceRange?: { min: number; max: number };
  excludeProductIds?: string[];
}

interface PaginationParams {
  page: number;
  limit: number;
}

// Mock product data for development - in production this would come from API
const MOCK_PRODUCTS: ProductCard[] = [
  {
    id: 'prod-1',
    title: 'Premium Wireless Headphones',
    price: 299.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Experience premium sound quality with active noise cancellation, 30-hour battery life, and premium comfort design.',
    specifications: { 
      'Battery Life': '30 hours', 
      'Connectivity': 'Bluetooth 5.0',
      'Weight': '250g',
      'Noise Cancellation': 'Active',
      'Warranty': '2 years'
    },
    availability: true,
    reviewRating: 4.8,
  },
  {
    id: 'prod-2',
    title: 'Elegant Summer Dress',
    price: 89.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Comfortable cotton dress perfect for summer days. Made from 100% organic cotton with a flattering fit.',
    specifications: { 
      'Material': '100% Organic Cotton', 
      'Sizes Available': 'XS, S, M, L, XL',
      'Care Instructions': 'Machine wash cold',
      'Origin': 'Made in USA'
    },
    availability: true,
  },
  {
    id: 'prod-3',
    title: 'Smart Security Camera',
    price: 179.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: '4K HD security camera with night vision, motion detection, and cloud storage.',
    specifications: { 
      'Resolution': '4K Ultra HD', 
      'Connectivity': 'WiFi + Ethernet', 
      'Storage': 'Cloud & Local',
      'Night Vision': 'Yes',
      'Weather Resistant': 'IP65'
    },
    availability: true,
  },
  {
    id: 'prod-4',
    title: 'Premium Yoga Mat',
    price: 59.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
    ],
    category: { id: 'sports', name: 'Sports & Outdoors' },
    description: 'Non-slip premium yoga mat with superior grip and cushioning for all yoga practices.',
    specifications: { 
      'Thickness': '6mm', 
      'Material': 'TPE Eco-Friendly', 
      'Size': '72" x 24"',
      'Weight': '2.5 lbs',
      'Non-Slip': 'Yes'
    },
    availability: true,
  },
  {
    id: 'prod-5',
    title: 'Artisan Coffee Beans',
    price: 24.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=400&fit=crop',
    ],
    category: { id: 'food', name: 'Food & Beverages' },
    description: 'Single-origin artisan coffee beans, medium roast with notes of chocolate and caramel.',
    specifications: { 
      'Weight': '12 oz', 
      'Roast': 'Medium', 
      'Origin': 'Colombian',
      'Grind': 'Whole Bean',
      'Organic': 'Yes'
    },
    availability: true,
  },
  {
    id: 'prod-6',
    title: 'Luxury Skincare Set',
    price: 149.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
    ],
    category: { id: 'beauty', name: 'Beauty & Personal Care' },
    description: 'Complete skincare routine with cleanser, serum, and moisturizer made from natural ingredients.',
    specifications: { 
      'Items Included': '3 products', 
      'Ingredients': 'Natural & Organic', 
      'Skin Type': 'All Types',
      'Cruelty Free': 'Yes',
      'Volume': '50ml each'
    },
    availability: true,
  },
  {
    id: 'prod-7',
    title: 'Minimalist Watch',
    price: 199.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
    ],
    category: { id: 'accessories', name: 'Accessories' },
    description: 'Elegant minimalist watch with leather strap and Swiss movement.',
    specifications: { 
      'Movement': 'Swiss Quartz', 
      'Case Material': 'Stainless Steel', 
      'Strap': 'Genuine Leather',
      'Water Resistance': '50m',
      'Warranty': '2 years'
    },
    availability: true,
  },
  {
    id: 'prod-8',
    title: 'Wireless Charging Pad',
    price: 39.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
    specifications: { 
      'Charging Speed': '15W Fast Charge', 
      'Compatibility': 'Qi-enabled devices', 
      'LED Indicator': 'Yes',
      'Safety Features': 'Overcharge Protection',
      'Cable Included': 'USB-C'
    },
    availability: true,
  },
  {
    id: 'prod-9',
    title: 'Gaming Mechanical Keyboard',
    price: 159.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'RGB backlit mechanical gaming keyboard with tactile switches and programmable keys.',
    specifications: { 
      'Switch Type': 'Cherry MX Blue', 
      'Backlight': 'RGB', 
      'Connectivity': 'USB-C',
      'Key Layout': 'Full Size',
      'Programmable': 'Yes'
    },
    availability: true,
  },
  {
    id: 'prod-10',
    title: 'Leather Crossbody Bag',
    price: 129.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Handcrafted genuine leather crossbody bag with adjustable strap and multiple compartments.',
    specifications: { 
      'Material': 'Genuine Leather', 
      'Dimensions': '10" x 8" x 3"', 
      'Strap': 'Adjustable',
      'Compartments': '3',
      'Hardware': 'Antique Brass'
    },
    availability: true,
  },
  {
    id: 'prod-11',
    title: 'Smart Fitness Tracker',
    price: 199.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, and 7-day battery life.',
    specifications: { 
      'Battery Life': '7 days', 
      'Water Resistance': '50m', 
      'GPS': 'Built-in',
      'Heart Rate': 'Continuous',
      'Display': 'AMOLED'
    },
    availability: true,
  },
  {
    id: 'prod-12',
    title: 'Organic Green Tea Set',
    price: 34.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop',
    ],
    category: { id: 'food', name: 'Food & Beverages' },
    description: 'Premium organic green tea collection with 6 different varieties from around the world.',
    specifications: { 
      'Varieties': '6 types', 
      'Weight': '2 oz each', 
      'Organic': 'Certified',
      'Origin': 'Multiple Countries',
      'Packaging': 'Resealable Tins'
    },
    availability: true,
  },
  {
    id: 'prod-13',
    title: 'Bluetooth Speaker',
    price: 79.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Portable Bluetooth speaker with 360-degree sound and waterproof design.',
    specifications: { 
      'Battery Life': '12 hours', 
      'Water Rating': 'IPX7', 
      'Connectivity': 'Bluetooth 5.0',
      'Range': '30 feet',
      'Weight': '1.2 lbs'
    },
    availability: true,
  },
  {
    id: 'prod-14',
    title: 'Silk Scarf',
    price: 69.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Luxurious 100% silk scarf with hand-painted floral design.',
    specifications: { 
      'Material': '100% Mulberry Silk', 
      'Size': '35" x 35"', 
      'Design': 'Hand-painted',
      'Care': 'Dry Clean Only',
      'Origin': 'Italy'
    },
    availability: true,
  },
  {
    id: 'prod-15',
    title: 'Essential Oil Diffuser',
    price: 49.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
    ],
    category: { id: 'beauty', name: 'Beauty & Personal Care' },
    description: 'Ultrasonic essential oil diffuser with LED lights and timer settings.',
    specifications: { 
      'Capacity': '300ml', 
      'Runtime': '10 hours', 
      'LED Lights': '7 colors',
      'Timer': '1/3/6 hours',
      'Coverage': '300 sq ft'
    },
    availability: true,
  },
  // Additional Electronics
  {
    id: 'prod-16',
    title: '4K Webcam',
    price: 129.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Professional 4K webcam with auto-focus and built-in microphone for streaming and video calls.',
    specifications: { 
      'Resolution': '4K 30fps', 
      'Field of View': '90 degrees', 
      'Microphone': 'Dual Built-in',
      'Mount': 'Universal Clip',
      'Compatibility': 'Windows, Mac, Linux'
    },
    availability: true,
  },
  {
    id: 'prod-17',
    title: 'USB-C Hub',
    price: 69.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and power delivery.',
    specifications: { 
      'Ports': '7 ports', 
      'HDMI': '4K@60Hz', 
      'USB': '3x USB 3.0',
      'Power Delivery': '100W',
      'Material': 'Aluminum'
    },
    availability: true,
  },
  {
    id: 'prod-18',
    title: 'Noise Cancelling Earbuds',
    price: 149.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'True wireless earbuds with active noise cancellation and 24-hour battery life.',
    specifications: { 
      'Battery Life': '8h + 16h case', 
      'Noise Cancellation': 'Active ANC', 
      'Water Resistance': 'IPX4',
      'Bluetooth': '5.2',
      'Charging': 'USB-C + Wireless'
    },
    availability: true,
  },
  {
    id: 'prod-19',
    title: 'Portable SSD 1TB',
    price: 119.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Ultra-fast portable SSD with 1TB storage and USB-C connectivity.',
    specifications: { 
      'Capacity': '1TB', 
      'Speed': 'Up to 1050MB/s', 
      'Interface': 'USB 3.2 Gen 2',
      'Durability': 'Shock resistant',
      'Warranty': '5 years'
    },
    availability: true,
  },
  {
    id: 'prod-20',
    title: 'Smart LED Light Bulbs (4-Pack)',
    price: 44.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'WiFi-enabled smart LED bulbs with 16 million colors and voice control.',
    specifications: { 
      'Brightness': '800 lumens', 
      'Colors': '16 million', 
      'Connectivity': 'WiFi 2.4GHz',
      'Voice Control': 'Alexa, Google',
      'Lifespan': '25,000 hours'
    },
    availability: true,
  },
  // Additional Fashion
  {
    id: 'prod-21',
    title: 'Classic Denim Jacket',
    price: 79.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Timeless denim jacket with a modern fit, perfect for layering.',
    specifications: { 
      'Material': '100% Cotton Denim', 
      'Fit': 'Regular', 
      'Sizes': 'XS-XXL',
      'Wash': 'Medium Blue',
      'Pockets': '4'
    },
    availability: true,
  },
  {
    id: 'prod-22',
    title: 'Cashmere Sweater',
    price: 159.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Luxurious 100% cashmere sweater with ribbed trim and relaxed fit.',
    specifications: { 
      'Material': '100% Cashmere', 
      'Weight': 'Lightweight', 
      'Sizes': 'XS-XL',
      'Care': 'Hand wash or dry clean',
      'Origin': 'Scotland'
    },
    availability: true,
  },
  {
    id: 'prod-23',
    title: 'Athletic Running Shoes',
    price: 119.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Lightweight running shoes with responsive cushioning and breathable mesh.',
    specifications: { 
      'Upper': 'Breathable Mesh', 
      'Sole': 'Rubber', 
      'Cushioning': 'EVA Foam',
      'Weight': '8.5 oz',
      'Sizes': '6-13'
    },
    availability: true,
  },
  {
    id: 'prod-24',
    title: 'Wool Blend Coat',
    price: 249.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Elegant wool blend coat with classic silhouette and button closure.',
    specifications: { 
      'Material': '80% Wool, 20% Polyester', 
      'Lining': 'Satin', 
      'Length': 'Knee-length',
      'Closure': 'Button',
      'Sizes': 'XS-XL'
    },
    availability: true,
  },
  {
    id: 'prod-25',
    title: 'Linen Shirt',
    price: 64.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Breathable linen shirt perfect for warm weather, relaxed fit.',
    specifications: { 
      'Material': '100% Linen', 
      'Fit': 'Relaxed', 
      'Collar': 'Button-down',
      'Sizes': 'S-XXL',
      'Colors': 'Multiple'
    },
    availability: true,
  },
  // Additional Sports & Outdoors
  {
    id: 'prod-26',
    title: 'Camping Tent (4-Person)',
    price: 189.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&h=400&fit=crop',
    ],
    category: { id: 'sports', name: 'Sports & Outdoors' },
    description: 'Spacious 4-person tent with waterproof design and easy setup.',
    specifications: { 
      'Capacity': '4 persons', 
      'Waterproof': 'Yes', 
      'Setup Time': '10 minutes',
      'Weight': '12 lbs',
      'Season': '3-season'
    },
    availability: true,
  },
  {
    id: 'prod-27',
    title: 'Adjustable Dumbbells Set',
    price: 299.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop',
    ],
    category: { id: 'sports', name: 'Sports & Outdoors' },
    description: 'Space-saving adjustable dumbbells from 5 to 52.5 lbs per hand.',
    specifications: { 
      'Weight Range': '5-52.5 lbs', 
      'Increments': '2.5 lbs', 
      'Material': 'Steel',
      'Compact': 'Yes',
      'Warranty': '2 years'
    },
    availability: true,
  },
  {
    id: 'prod-28',
    title: 'Hiking Backpack 40L',
    price: 129.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1622260614927-9d2e60c3f8e4?w=400&h=400&fit=crop',
    ],
    category: { id: 'sports', name: 'Sports & Outdoors' },
    description: 'Durable 40L hiking backpack with hydration system and rain cover.',
    specifications: { 
      'Capacity': '40 liters', 
      'Hydration': 'Compatible', 
      'Rain Cover': 'Included',
      'Frame': 'Internal',
      'Pockets': 'Multiple'
    },
    availability: true,
  },
  {
    id: 'prod-29',
    title: 'Resistance Bands Set',
    price: 29.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&h=400&fit=crop',
    ],
    category: { id: 'sports', name: 'Sports & Outdoors' },
    description: 'Complete resistance bands set with 5 levels and door anchor.',
    specifications: { 
      'Bands': '5 resistance levels', 
      'Material': 'Natural Latex', 
      'Accessories': 'Handles, Anchor, Bag',
      'Max Resistance': '150 lbs',
      'Portable': 'Yes'
    },
    availability: true,
  },
  {
    id: 'prod-30',
    title: 'Mountain Bike',
    price: 599.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400&h=400&fit=crop',
    ],
    category: { id: 'sports', name: 'Sports & Outdoors' },
    description: 'All-terrain mountain bike with 21-speed gears and front suspension.',
    specifications: { 
      'Gears': '21-speed', 
      'Frame': 'Aluminum Alloy', 
      'Suspension': 'Front',
      'Wheel Size': '27.5"',
      'Brakes': 'Disc'
    },
    availability: true,
  },
  // Additional Food & Beverages
  {
    id: 'prod-31',
    title: 'Gourmet Chocolate Box',
    price: 39.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop',
    ],
    category: { id: 'food', name: 'Food & Beverages' },
    description: 'Assorted gourmet chocolates handcrafted with premium ingredients.',
    specifications: { 
      'Pieces': '24 chocolates', 
      'Flavors': 'Assorted', 
      'Cocoa': '70% Dark',
      'Packaging': 'Gift Box',
      'Shelf Life': '6 months'
    },
    availability: true,
  },
  {
    id: 'prod-32',
    title: 'Organic Honey (16oz)',
    price: 18.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=400&h=400&fit=crop',
    ],
    category: { id: 'food', name: 'Food & Beverages' },
    description: 'Raw organic honey from local beekeepers, unfiltered and unpasteurized.',
    specifications: { 
      'Weight': '16 oz', 
      'Type': 'Wildflower', 
      'Organic': 'Certified',
      'Processing': 'Raw',
      'Origin': 'USA'
    },
    availability: true,
  },
  {
    id: 'prod-33',
    title: 'Protein Powder (2lbs)',
    price: 44.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=400&h=400&fit=crop',
    ],
    category: { id: 'food', name: 'Food & Beverages' },
    description: 'Whey protein isolate with 25g protein per serving, chocolate flavor.',
    specifications: { 
      'Weight': '2 lbs', 
      'Protein': '25g per serving', 
      'Flavor': 'Chocolate',
      'Servings': '30',
      'Gluten Free': 'Yes'
    },
    availability: true,
  },
  {
    id: 'prod-34',
    title: 'Olive Oil Extra Virgin',
    price: 29.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
    ],
    category: { id: 'food', name: 'Food & Beverages' },
    description: 'Premium extra virgin olive oil cold-pressed from Italian olives.',
    specifications: { 
      'Volume': '500ml', 
      'Type': 'Extra Virgin', 
      'Origin': 'Italy',
      'Processing': 'Cold-pressed',
      'Acidity': '<0.5%'
    },
    availability: true,
  },
  {
    id: 'prod-35',
    title: 'Herbal Tea Collection',
    price: 27.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1597318181274-c68c6e05d26e?w=400&h=400&fit=crop',
    ],
    category: { id: 'food', name: 'Food & Beverages' },
    description: 'Assorted herbal tea collection with 8 different caffeine-free blends.',
    specifications: { 
      'Varieties': '8 types', 
      'Bags': '80 total', 
      'Caffeine': 'Free',
      'Organic': 'Yes',
      'Packaging': 'Individual Sachets'
    },
    availability: true,
  },
  // Additional Beauty & Personal Care
  {
    id: 'prod-36',
    title: 'Anti-Aging Serum',
    price: 89.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop',
    ],
    category: { id: 'beauty', name: 'Beauty & Personal Care' },
    description: 'Advanced anti-aging serum with retinol and hyaluronic acid.',
    specifications: { 
      'Volume': '30ml', 
      'Key Ingredients': 'Retinol, Hyaluronic Acid', 
      'Skin Type': 'All',
      'Cruelty Free': 'Yes',
      'Vegan': 'Yes'
    },
    availability: true,
  },
  {
    id: 'prod-37',
    title: 'Electric Toothbrush',
    price: 79.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop',
    ],
    category: { id: 'beauty', name: 'Beauty & Personal Care' },
    description: 'Sonic electric toothbrush with 5 modes and 2-week battery life.',
    specifications: { 
      'Modes': '5 cleaning modes', 
      'Battery': '2 weeks', 
      'Timer': '2-minute',
      'Heads': '2 included',
      'Waterproof': 'IPX7'
    },
    availability: true,
  },
  {
    id: 'prod-38',
    title: 'Hair Dryer Professional',
    price: 129.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=400&fit=crop',
    ],
    category: { id: 'beauty', name: 'Beauty & Personal Care' },
    description: 'Professional ionic hair dryer with multiple heat settings and cool shot.',
    specifications: { 
      'Power': '1875W', 
      'Technology': 'Ionic', 
      'Heat Settings': '3',
      'Speed Settings': '2',
      'Attachments': 'Concentrator, Diffuser'
    },
    availability: true,
  },
  {
    id: 'prod-39',
    title: 'Face Mask Set (10-Pack)',
    price: 34.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop',
    ],
    category: { id: 'beauty', name: 'Beauty & Personal Care' },
    description: 'Variety pack of sheet masks for different skin concerns.',
    specifications: { 
      'Quantity': '10 masks', 
      'Types': '5 varieties', 
      'Ingredients': 'Natural',
      'Cruelty Free': 'Yes',
      'Suitable For': 'All skin types'
    },
    availability: true,
  },
  {
    id: 'prod-40',
    title: 'Perfume Eau de Parfum',
    price: 119.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
    ],
    category: { id: 'beauty', name: 'Beauty & Personal Care' },
    description: 'Elegant floral perfume with notes of jasmine, rose, and vanilla.',
    specifications: { 
      'Volume': '50ml', 
      'Type': 'Eau de Parfum', 
      'Notes': 'Floral, Vanilla',
      'Longevity': '6-8 hours',
      'Bottle': 'Designer Glass'
    },
    availability: true,
  },
  // Additional Accessories
  {
    id: 'prod-41',
    title: 'Sunglasses Polarized',
    price: 89.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop',
    ],
    category: { id: 'accessories', name: 'Accessories' },
    description: 'Polarized sunglasses with UV400 protection and stylish frame.',
    specifications: { 
      'Lens': 'Polarized', 
      'UV Protection': 'UV400', 
      'Frame': 'Acetate',
      'Case': 'Included',
      'Warranty': '1 year'
    },
    availability: true,
  },
  {
    id: 'prod-42',
    title: 'Leather Wallet',
    price: 59.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
    ],
    category: { id: 'accessories', name: 'Accessories' },
    description: 'Slim leather wallet with RFID blocking and multiple card slots.',
    specifications: { 
      'Material': 'Genuine Leather', 
      'RFID Blocking': 'Yes', 
      'Card Slots': '8',
      'Bill Compartment': '2',
      'Dimensions': '4.5" x 3.5"'
    },
    availability: true,
  },
  {
    id: 'prod-43',
    title: 'Baseball Cap',
    price: 29.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop',
    ],
    category: { id: 'accessories', name: 'Accessories' },
    description: 'Classic baseball cap with adjustable strap and breathable fabric.',
    specifications: { 
      'Material': 'Cotton Twill', 
      'Closure': 'Adjustable Strap', 
      'Brim': 'Curved',
      'Breathable': 'Yes',
      'One Size': 'Fits Most'
    },
    availability: true,
  },
  {
    id: 'prod-44',
    title: 'Phone Case Premium',
    price: 39.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop',
    ],
    category: { id: 'accessories', name: 'Accessories' },
    description: 'Premium leather phone case with card slots and magnetic closure.',
    specifications: { 
      'Material': 'Genuine Leather', 
      'Card Slots': '3', 
      'Protection': 'Drop-proof',
      'Wireless Charging': 'Compatible',
      'Models': 'Multiple'
    },
    availability: true,
  },
  {
    id: 'prod-45',
    title: 'Belt Leather',
    price: 49.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1624222247344-550fb60583bb?w=400&h=400&fit=crop',
    ],
    category: { id: 'accessories', name: 'Accessories' },
    description: 'Classic leather belt with reversible design and silver buckle.',
    specifications: { 
      'Material': 'Full Grain Leather', 
      'Width': '1.5"', 
      'Reversible': 'Yes',
      'Buckle': 'Silver Tone',
      'Sizes': '32-44'
    },
    availability: true,
  },
];

export class ProductFeedService {
  private static swipeHistory: SwipeAction[] = [];
  private static sessionId: string = Date.now().toString();

  /**
   * Get all available products (for accessing from other services)
   */
  static getAllProducts(): ProductCard[] {
    return [...MOCK_PRODUCTS];
  }

  /**
   * Get a specific product by ID
   */
  static getProductById(productId: string): ProductCard | null {
    return MOCK_PRODUCTS.find(product => product.id === productId) || null;
  }

  /**
   * Fetch products based on user preferences and filters
   */
  static async getProducts(
    pagination: PaginationParams = { page: 1, limit: 10 },
    filters?: FeedFilters
  ): Promise<ProductFeedResponse> {
    try {
      // In production, this would be an API call
      await this.simulateNetworkDelay();

      let filteredProducts = [...MOCK_PRODUCTS];

      // Apply category filters
      if (filters?.categories && filters.categories.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          filters.categories!.includes(product.category.id)
        );
      }

      // Apply price range filters
      if (filters?.priceRange) {
        filteredProducts = filteredProducts.filter(product =>
          product.price >= filters.priceRange!.min &&
          product.price <= filters.priceRange!.max
        );
      }

      // Exclude already swiped products
      if (filters?.excludeProductIds && filters.excludeProductIds.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          !filters.excludeProductIds!.includes(product.id)
        );
      }

      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      return {
        products: paginatedProducts,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: filteredProducts.length,
          hasMore: endIndex < filteredProducts.length,
        },
        filters: {
          categories: filters?.categories || [],
          priceRange: filters?.priceRange,
        },
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw ErrorFactory.createNetworkError(
        'Failed to fetch products',
        {
          endpoint: '/products',
          method: 'GET',
          retryable: true,
          originalError: error instanceof Error ? error : undefined,
        }
      );
    }
  }

  /**
   * Get personalized product feed based on user preferences
   */
  static async getPersonalizedFeed(
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ProductFeedResponse> {
    try {
      const userPreferences = await CategoryPreferenceService.getUserPreferences();
      
      // Get products that user has already swiped to exclude them
      const swipedProductIds = this.swipeHistory
        .filter(action => action.sessionId === this.sessionId)
        .map(action => action.productId);

      const filters: FeedFilters = {
        categories: userPreferences.selectedCategories.length > 0 
          ? userPreferences.selectedCategories 
          : undefined,
        excludeProductIds: swipedProductIds,
      };

      return await this.getProducts(pagination, filters);
    } catch (error) {
      console.error('Error getting personalized feed:', error);
      throw ErrorFactory.createNetworkError(
        'Failed to get personalized feed',
        {
          endpoint: '/feed/personalized',
          method: 'GET',
          retryable: true,
          originalError: error instanceof Error ? error : undefined,
        }
      );
    }
  }

  /**
   * Record a swipe action
   */
  static async recordSwipeAction(
    productId: string,
    action: 'like' | 'skip',
    userId: string
  ): Promise<SwipeActionResponse> {
    try {
      // In production, this would be an API call
      await this.simulateNetworkDelay();

      const swipeAction: SwipeAction = {
        userId,
        productId,
        action,
        timestamp: new Date(),
        sessionId: this.sessionId,
      };

      // Store locally for session management
      this.swipeHistory.push(swipeAction);

      // If user liked a product, we might want to update their preferences
      let updatedPreferences: CategoryPreferences | undefined;
      
      if (action === 'like') {
        const product = MOCK_PRODUCTS.find(p => p.id === productId);
        if (product) {
          try {
            await CategoryPreferenceService.addCategoryPreference(product.category.id);
            updatedPreferences = await CategoryPreferenceService.getUserPreferences();
          } catch (error) {
            console.warn('Failed to update preferences after like:', error);
          }
        }
      }

      return {
        success: true,
        message: `${action} action recorded successfully`,
        updatedPreferences,
      };
    } catch (error) {
      console.error('Error recording swipe action:', error);
      throw ErrorFactory.createNetworkError(
        'Failed to record swipe action',
        {
          endpoint: '/swipe-actions',
          method: 'POST',
          retryable: true,
          originalError: error instanceof Error ? error : undefined,
        }
      );
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(
    categoryId: string,
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ProductFeedResponse> {
    try {
      const filters: FeedFilters = {
        categories: [categoryId],
      };

      return await this.getProducts(pagination, filters);
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw new Error('Failed to get products by category');
    }
  }

  /**
   * Search products by query
   */
  static async searchProducts(
    query: string,
    pagination: PaginationParams = { page: 1, limit: 10 },
    filters?: FeedFilters
  ): Promise<ProductFeedResponse> {
    try {
      // In production, this would be an API call with search functionality
      await this.simulateNetworkDelay();

      let filteredProducts = MOCK_PRODUCTS.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
      );

      // Apply additional filters
      if (filters?.categories && filters.categories.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          filters.categories!.includes(product.category.id)
        );
      }

      if (filters?.priceRange) {
        filteredProducts = filteredProducts.filter(product =>
          product.price >= filters.priceRange!.min &&
          product.price <= filters.priceRange!.max
        );
      }

      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      return {
        products: paginatedProducts,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: filteredProducts.length,
          hasMore: endIndex < filteredProducts.length,
        },
        filters: {
          categories: filters?.categories || [],
          priceRange: filters?.priceRange,
        },
      };
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Failed to search products');
    }
  }

  /**
   * Get user's swipe history for current session
   */
  static getSessionSwipeHistory(): SwipeAction[] {
    return this.swipeHistory.filter(action => action.sessionId === this.sessionId);
  }

  /**
   * Clear current session data
   */
  static clearSession(): void {
    this.swipeHistory = [];
    this.sessionId = Date.now().toString();
  }

  /**
   * Get liked products from current session
   */
  static getLikedProductsFromSession(): string[] {
    return this.swipeHistory
      .filter(action => action.sessionId === this.sessionId && action.action === 'like')
      .map(action => action.productId);
  }

  /**
   * Get skipped products from current session
   */
  static getSkippedProductsFromSession(): string[] {
    return this.swipeHistory
      .filter(action => action.sessionId === this.sessionId && action.action === 'skip')
      .map(action => action.productId);
  }

  /**
   * Simulate network delay for development
   */
  private static async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 500 + 200; // 200-700ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Refresh product feed (useful for pull-to-refresh)
   */
  static async refreshFeed(): Promise<ProductFeedResponse> {
    try {
      // Clear any cached data and get fresh feed
      return await this.getPersonalizedFeed({ page: 1, limit: 10 });
    } catch (error) {
      console.error('Error refreshing feed:', error);
      throw new Error('Failed to refresh feed');
    }
  }
}