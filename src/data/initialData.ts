import { DeliveryZone, Product, Employee, BusinessPage, Customer, Order, ShopInfo } from '../types';

export const DEFAULT_SHOP_INFO: ShopInfo = {
  name: 'Qatar Online Shop',
  phone: '+974 55551234',
  address: 'Doha, Qatar',
  footer: 'Thanks For Shopping With Us!'
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Product Transport (Market → Shop)',
  'Packaging Materials',
  'Food / Snacks (নাস্তা)',
  'Office Supplies (Invoice pad, Paper, Pen, Elastic, Files)',
  'Shop Rent',
  'Electricity Bill',
  'Warehouse Rent',
  'Employee Salary',
  'TA/DA (Transport Allowance)',
  'Employee Home Allowance',
  'Employee Food Allowance',
  'Marketing / Ads',
  'Internet / Phone Bill',
  'Maintenance / Repair',
  'Other'
];

export const DEFAULT_PAGES: BusinessPage[] = [
  {
    code: 'NS',
    name: 'Nasmath Qatar Online Shopping',
    mobile: '+974 50012345',
    address: 'Souq Waqif, Doha, Qatar',
    facebook: 'nasmath.qatar',
    instagram: '@nasmath_qa',
    tiktok: '@nasmathqatar',
    other: 'www.nasmathqatar.com',
    status: 'Active'
  },
  {
    code: 'CZ',
    name: 'Color Zone - Qatar Online Shopping',
    mobile: '+974 55123456',
    address: 'Old Al Ghanim, Doha, Qatar',
    facebook: 'colorzone.qatar',
    instagram: '@colorzone_doha',
    tiktok: '@colorzoneqa',
    other: 'FB Group: Color Zone Qatar',
    status: 'Active'
  },
  {
    code: 'DPW',
    name: 'Doha Pinoy Wear',
    mobile: '+974 66789012',
    address: 'Mansoura, Doha, Qatar',
    facebook: 'dohapinoywear',
    instagram: '@dohapinoy',
    tiktok: '@dohapinoywear',
    other: 'WhatsApp Catalog: 66789012',
    status: 'Active'
  }
];

export const DEFAULT_ZONES: DeliveryZone[] = [
  {
    code: 'DOH',
    name: 'Doha Central & Old Airport',
    charge: 15,
    status: 'Active',
    areas: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '13', '14', '15', '16', '17', '18', '22', '23', '24', '25', '26', '27', '28', '40', '41', '42', '45', '46', '47', '48']
  },
  {
    code: 'RAY',
    name: 'Al Rayyan & Gharrafa',
    charge: 20,
    status: 'Active',
    areas: ['51', '52', '53', '54', '55', '56', '57']
  },
  {
    code: 'WAK',
    name: 'Al Wakra & Wukair',
    charge: 20,
    status: 'Active',
    areas: ['90', '91', '92', '93']
  },
  {
    code: 'KHOR',
    name: 'Al Khor & Lusail / Simaisma',
    charge: 30,
    status: 'Active',
    areas: ['69', '70', '71', '74', '75']
  },
  {
    code: 'SHAMAL',
    name: 'Al Shamal & Ruwais',
    charge: 40,
    status: 'Active',
    areas: ['76', '77', '78', '79']
  },
  {
    code: 'DUK',
    name: 'Dukhan & Sheehaniya',
    charge: 35,
    status: 'Active',
    areas: ['80', '81', '82', '83', '84', '85', '86']
  }
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    sku: 'TS-BLK-L',
    name: 'Premium Cotton T-Shirt',
    category: 'Men Apparel',
    variation: 'Black - L',
    buyPrice: 18,
    sellPrice: 35,
    extraCost: 2,
    stock: 42,
    openingStock: 50,
    status: 'Active',
    bundleQty: 3,
    bundlePrice: 90
  },
  {
    sku: 'TS-WHT-M',
    name: 'Premium Cotton T-Shirt',
    category: 'Men Apparel',
    variation: 'White - M',
    buyPrice: 18,
    sellPrice: 35,
    extraCost: 2,
    stock: 28,
    openingStock: 35,
    status: 'Active',
    bundleQty: 3,
    bundlePrice: 90
  },
  {
    sku: 'POLO-NVY-XL',
    name: 'Breathable Pique Polo',
    category: 'Men Apparel',
    variation: 'Navy - XL',
    buyPrice: 28,
    sellPrice: 55,
    extraCost: 3,
    stock: 19,
    openingStock: 25,
    status: 'Active',
    bundleQty: 2,
    bundlePrice: 100
  },
  {
    sku: 'BAG-TRV-01',
    name: 'Waterproof Duffel Travel Bag',
    category: 'Bags & Luggage',
    variation: 'Dark Gray',
    buyPrice: 45,
    sellPrice: 95,
    extraCost: 5,
    stock: 14,
    openingStock: 20,
    status: 'Active',
    bundleQty: 0,
    bundlePrice: 0
  },
  {
    sku: 'WATCH-DIG-S',
    name: 'Tactical Sports Watch Water-Resistant',
    category: 'Accessories',
    variation: 'Military Green',
    buyPrice: 22,
    sellPrice: 65,
    extraCost: 3,
    stock: 3, // Low stock demo
    openingStock: 15,
    status: 'Active',
    bundleQty: 2,
    bundlePrice: 110
  },
  {
    sku: 'PERF-OUD-100',
    name: 'Royal Arabian Oud Perfume 100ml',
    category: 'Fragrances',
    variation: 'Gold Edition',
    buyPrice: 50,
    sellPrice: 120,
    extraCost: 5,
    stock: 16,
    openingStock: 20,
    status: 'Active',
    bundleQty: 2,
    bundlePrice: 210
  }
];

export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    name: 'Admin Manager',
    phone: '55000000',
    pin: '1234',
    role: 'Admin',
    status: 'Active'
  },
  {
    name: 'Fatima Order Desk',
    phone: '55112233',
    pin: '2233',
    role: 'Order Entry',
    status: 'Active'
  },
  {
    name: 'Rahim Khan',
    phone: '55443322',
    pin: '1122',
    role: 'Driver',
    zone: 'DOH - Doha Central & Old Airport',
    status: 'Active'
  },
  {
    name: 'Tariq Hassan',
    phone: '55778899',
    pin: '3344',
    role: 'Driver',
    zone: 'RAY - Al Rayyan & Gharrafa',
    status: 'Active'
  }
];

export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    mobile: '+974 55123456',
    name: 'Mohammed Al-Kuwari',
    whatsapp: '+974 55123456',
    buildingNo: '14',
    zoneNo: '51',
    streetNo: '320',
    zoneName: 'Al Gharrafa',
    addressExtra: 'Villa 4, Near Family Food Centre',
    mapLink: 'https://maps.google.com/?q=25.328,51.442',
    note: 'Call before arriving',
    createdAt: '10/10/2026 11:30 AM',
    updatedAt: '12/10/2026 09:15 AM'
  },
  {
    mobile: '+974 66234567',
    name: 'Sara Abdullah',
    whatsapp: '+974 66234567',
    buildingNo: '28',
    zoneNo: '45',
    streetNo: '840',
    zoneName: 'Old Airport',
    addressExtra: 'Flat 302, Green Building',
    mapLink: '',
    note: 'Deliver after 5 PM',
    createdAt: '11/10/2026 02:40 PM',
    updatedAt: '11/10/2026 02:40 PM'
  }
];

export const DEFAULT_ORDERS: Order[] = [
  {
    id: '20261012MC901',
    date: '12/10/2026 09:30 AM',
    dateKey: '2026-10-12',
    name: 'Mohammed Al-Kuwari',
    phone: '+974 55123456',
    whatsapp: '+974 55123456',
    zone: 'RAY - Al Rayyan & Gharrafa',
    zoneCode: 'RAY',
    delCharge: 20,
    freeDelivery: false,
    delCharged: 20,
    deliveryCost: 0,
    deliveryMode: 'auto',
    productPricingMode: 'auto',
    subTotal: 90,
    grandTotal: 110,
    status: 'Delivered',
    driver: 'Tariq Hassan',
    payment: 'COD',
    stockAdjusted: 'YES',
    source: 'Messenger',
    pageCode: 'CZ',
    buildingNo: '14',
    zoneNo: '51',
    streetNo: '320',
    zoneName: 'Al Gharrafa',
    addressExtra: 'Villa 4, Near Family Food Centre',
    mapLink: 'https://maps.google.com/?q=25.328,51.442',
    mapUrl: 'https://maps.google.com/?q=25.328,51.442',
    discountType: 'none',
    discountValue: 0,
    discountAmount: 0,
    createdBy: 'Fatima Order Desk',
    deliveredAt: '12/10/2026 11:45 AM',
    items: [
      {
        sku: 'TS-BLK-L',
        name: 'Premium Cotton T-Shirt',
        variation: 'Black - L',
        qty: 3,
        unitPrice: 35,
        lineTotal: 90, // Bundle applied! 3 for 90 instead of 105
        buyPrice: 18,
        extraCost: 2,
        _hasCostSnapshot: true
      }
    ]
  },
  {
    id: '20261012WN902',
    date: '12/10/2026 10:15 AM',
    dateKey: '2026-10-12',
    name: 'Sara Abdullah',
    phone: '+974 66234567',
    whatsapp: '+974 66234567',
    zone: 'DOH - Doha Central & Old Airport',
    zoneCode: 'DOH',
    delCharge: 15,
    freeDelivery: true, // Free Delivery promotion!
    delCharged: 0,
    deliveryCost: 5, // 15 - 10 = 5 QR shop expense
    deliveryMode: 'auto',
    productPricingMode: 'auto',
    subTotal: 120,
    grandTotal: 120,
    status: 'Pending',
    driver: 'Rahim Khan',
    payment: 'COD',
    source: 'WhatsApp',
    pageCode: 'NS',
    buildingNo: '28',
    zoneNo: '45',
    streetNo: '840',
    zoneName: 'Old Airport',
    addressExtra: 'Flat 302, Green Building',
    discountType: 'none',
    discountValue: 0,
    discountAmount: 0,
    createdBy: 'Admin Manager',
    note: 'Gift wrap requested by customer',
    driverStatus: 'Delivered',
    driverReason: '',
    approval: true, // Awaiting admin approval!
    driverAt: '12/10/2026 01:10 PM',
    items: [
      {
        sku: 'PERF-OUD-100',
        name: 'Royal Arabian Oud Perfume 100ml',
        variation: 'Gold Edition',
        qty: 1,
        unitPrice: 120,
        lineTotal: 120,
        buyPrice: 50,
        extraCost: 5,
        _hasCostSnapshot: true
      }
    ]
  }
];

export const QATAR_ZONE_AREAS: Record<string, string[]> = {
  '1': ['Al Jasra'], '2': ['Al Bidda'], '3': ['Mushaireb'], '4': ['Mushaireb'],
  '5': ['Al Najada', 'Barahat Al Jufairy'], '6': ['Old Al Ghanim'], '7': ['Al Souq'],
  '8': ['Old Al Salata'], '9': ['Al Hitmi'], '10': ['Wadi Al Sail'],
  '13': ['Mushaireb'], '14': ['Fereej Abdul Aziz'], '15': ['Al Doha Al Jadeeda'], '16': ['Old Al Ghanim'],
  '22': ['Bin Mahmoud (North)'], '23': ['Bin Mahmoud (South)'], '24': ['Rawdat Al Khail'],
  '25': ['Al Mansoura', 'Bin Dirhem'], '26': ['Najma'], '27': ['Umm Ghuwailina'], '28': ['Al Muntazah'],
  '40': ['New Salatah'], '41': ['Nuaija'], '42': ['Al Hilal'], '45': ['Old Airport'], '46': ['Al Thumama'],
  '48': ['Doha International Airport'],
  '51': ['Al Gharrafa', 'Gharrafat Al Rayyan', 'Izghawa', 'Bani Hajer'],
  '52': ['Al Luqta', 'Lebday', 'Old Al Rayyan'],
  '53': ['New Al Rayyan', 'Al Wajbah', 'Muaither'],
  '54': ['Fereej Al Amir', 'Luaib', 'Muraikh'],
  '55': ['Al Waab', 'Al Aziziya', 'Bu Sidra', 'Al Sailiya'],
  '56': ['Abu Hamour', 'Mesaimeer', 'Ain Khaled', 'Umm Al Seneem'],
  '57': ['Industrial Area'],
  '69': ['Lusail'], '70': ['Al Kheesa'], '71': ['Umm Slal', 'Al Kharaitiyat'],
  '74': ['Simaisma', 'Al Khor'], '75': ['Ras Laffan', 'Al Thakhira'],
  '79': ['Al Ruwais', 'Madinat Al Shamal'],
  '80': ['Al Sheehaniya'], '86': ['Dukhan'],
  '90': ['Al Wakra'], '91': ['Al Wukair', 'Al Mashaf'], '92': ['Mesaieed']
};

export const COUNTRY_DATA: Array<{ name: string; code: string }> = [
  { name: 'Qatar', code: '974' },
  { name: 'Bangladesh', code: '880' },
  { name: 'India', code: '91' },
  { name: 'Nepal', code: '977' },
  { name: 'Pakistan', code: '92' },
  { name: 'Philippines', code: '63' },
  { name: 'Sri Lanka', code: '94' },
  { name: 'Egypt', code: '20' },
  { name: 'Saudi Arabia', code: '966' },
  { name: 'United Arab Emirates', code: '971' },
  { name: 'Kuwait', code: '965' },
  { name: 'Bahrain', code: '973' },
  { name: 'Oman', code: '968' },
  { name: 'United Kingdom', code: '44' },
  { name: 'United States', code: '1' }
];
