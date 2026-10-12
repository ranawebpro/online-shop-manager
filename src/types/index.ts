export type UserRole = 'Admin' | 'Order Entry' | 'Driver';
export type OrderStatus = 'Pending' | 'Delivered' | 'Return' | 'Exchange';
export type DiscountType = 'none' | 'flat' | 'percent';
export type PricingMode = 'auto' | 'manual';
export type DeliveryMode = 'auto' | 'manual';

export interface UserSession {
  name: string;
  phone: string;
  role: UserRole;
  zone?: string;
  token?: string;
}

export interface OrderItem {
  sku: string;
  name: string;
  variation?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  buyPrice?: number;
  extraCost?: number;
  note?: string;
  _hasCostSnapshot?: boolean;
}

export interface Order {
  id: string; // e.g., 20261012MC901
  date: string; // display formatted dd/MM/yyyy hh:mm a
  dateKey: string; // yyyy-MM-dd
  name: string;
  phone: string;
  whatsapp?: string;
  zone: string; // e.g. "DOH - Doha Central"
  zoneCode?: string;
  delCharge: number;
  freeDelivery: boolean;
  delCharged: number;
  deliveryCost: number; // free delivery shop expense
  deliveryMode: DeliveryMode;
  productPricingMode: PricingMode;
  subTotal: number;
  grandTotal: number;
  status: OrderStatus;
  driver: string;
  reason?: string;
  payment: string; // "COD"
  stockAdjusted?: string; // "YES"
  source: string; // "Messenger", "WhatsApp", "Instagram"
  pageCode: string; // "NS", "CZ", "DPW"
  buildingNo?: string;
  zoneNo?: string;
  streetNo?: string;
  zoneName?: string;
  addressExtra?: string;
  mapLink?: string;
  mapUrl?: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  couponCode?: string;
  createdBy: string;
  driverStatus?: string;
  driverReason?: string;
  approval?: boolean; // AWAITING approval
  driverAt?: string;
  note?: string;
  deliveredAt?: string;
  items: OrderItem[];
}

export interface Product {
  sku: string;
  name: string;
  category: string;
  variation?: string;
  buyPrice: number;
  sellPrice: number;
  extraCost: number;
  stock: number;
  openingStock?: number;
  status: 'Active' | 'Inactive';
  bundleQty: number;
  bundlePrice: number;
}

export interface DeliveryZone {
  code: string;
  name: string;
  charge: number;
  status: 'Active' | 'Inactive';
  areas: string[]; // e.g. ["40", "41", "45", "46", "47", "48"]
}

export interface BusinessPage {
  code: string;
  name: string;
  mobile?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  other?: string;
  status: 'Active' | 'Inactive';
}

export interface Employee {
  name: string;
  phone: string;
  pin: string;
  role: UserRole;
  zone?: string;
  status: 'Active' | 'Inactive';
}

export interface Customer {
  mobile: string;
  name: string;
  whatsapp?: string;
  buildingNo?: string;
  zoneNo?: string;
  streetNo?: string;
  zoneName?: string;
  addressExtra?: string;
  mapLink?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseEntry {
  id: string;
  date: string; // yyyy-MM-dd
  category: string;
  amount: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface AppNotification {
  id: number;
  time: string;
  target: string; // "ADMIN" or "USER:<name>"
  type: string;
  title: string;
  message: string;
  orderId?: string;
}

export interface ShopInfo {
  name: string;
  phone: string;
  address: string;
  footer: string;
}
