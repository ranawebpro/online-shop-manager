import {
  Order, Product, DeliveryZone, BusinessPage, Employee, Customer,
  ExpenseEntry, AppNotification, ShopInfo, UserSession, OrderStatus
} from '../types';
import {
  DEFAULT_CUSTOMERS, DEFAULT_EMPLOYEES, DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_ORDERS, DEFAULT_PAGES, DEFAULT_PRODUCTS, DEFAULT_SHOP_INFO,
  DEFAULT_ZONES
} from '../data/initialData';

const STORAGE_KEYS = {
  ORDERS: 'qsm_orders',
  PRODUCTS: 'qsm_products',
  ZONES: 'qsm_zones',
  PAGES: 'qsm_pages',
  EMPLOYEES: 'qsm_employees',
  CUSTOMERS: 'qsm_customers',
  EXPENSES: 'qsm_expenses',
  EXP_CATS: 'qsm_expense_categories',
  NOTIFICATIONS: 'qsm_notifications',
  SHOP_INFO: 'qsm_shop_info',
  SESSION: 'qsm_session',
  GAS_URL: 'qsm_gas_webapp_url'
};

// Helpers
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) return defaultValue;
    return JSON.parse(val);
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

export function getGasUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
}

export function setGasUrl(url: string): void {
  localStorage.setItem(STORAGE_KEYS.GAS_URL, url.trim());
}

export function getShopInfo(): ShopInfo {
  return getStored<ShopInfo>(STORAGE_KEYS.SHOP_INFO, DEFAULT_SHOP_INFO);
}

export function setShopInfo(info: ShopInfo): void {
  setStored(STORAGE_KEYS.SHOP_INFO, info);
}

export function getSession(): UserSession | null {
  return getStored<UserSession | null>(STORAGE_KEYS.SESSION, {
    name: 'Admin Manager',
    phone: '55000000',
    role: 'Admin'
  });
}

export function setSession(session: UserSession | null): void {
  if (session) {
    setStored(STORAGE_KEYS.SESSION, session);
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

// Data Getters
export function getOrders(): Order[] {
  return getStored<Order[]>(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
}

export function getProducts(): Product[] {
  return getStored<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
}

export function getZones(): DeliveryZone[] {
  return getStored<DeliveryZone[]>(STORAGE_KEYS.ZONES, DEFAULT_ZONES);
}

export function getPages(): BusinessPage[] {
  return getStored<BusinessPage[]>(STORAGE_KEYS.PAGES, DEFAULT_PAGES);
}

export function getEmployees(): Employee[] {
  return getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
}

export function getCustomers(): Customer[] {
  return getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
}

export function getExpenses(): ExpenseEntry[] {
  return getStored<ExpenseEntry[]>(STORAGE_KEYS.EXPENSES, [
    {
      id: 'EX001',
      date: new Date().toISOString().slice(0, 10),
      category: 'Packaging Materials',
      amount: 45,
      note: '50x Delivery cartons and bubble wrap',
      createdBy: 'Admin Manager',
      createdAt: '12/10/2026 10:00 AM'
    }
  ]);
}

export function getExpenseCategories(): string[] {
  return getStored<string[]>(STORAGE_KEYS.EXP_CATS, DEFAULT_EXPENSE_CATEGORIES);
}

export function getNotifications(): AppNotification[] {
  return getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, [
    {
      id: 1,
      time: '12/10/2026 10:15 AM',
      target: 'USER:Rahim Khan',
      type: 'assign',
      title: '📦 নতুন অর্ডার',
      message: 'অর্ডার 20261012WN902 আপনাকে assign করা হয়েছে (Sara Abdullah)',
      orderId: '20261012WN902'
    },
    {
      id: 2,
      time: '12/10/2026 01:10 PM',
      target: 'ADMIN',
      type: 'approval',
      title: '🔔 Rahim Khan status দিয়েছেন',
      message: 'অর্ডার 20261012WN902 (Sara Abdullah) → Delivered — Approval দরকার',
      orderId: '20261012WN902'
    }
  ]);
}

// Mutations
export function saveOrder(orderData: Partial<Order> & { items: Order['items'] }, isEdit = false): { success: boolean; message: string; orderId?: string } {
  const orders = getOrders();
  const products = getProducts();
  const customers = getCustomers();

  // Upsert customer
  const cleanPhone = orderData.phone || '';
  if (cleanPhone) {
    const custIdx = customers.findIndex(c => c.mobile.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''));
    const now = new Date().toLocaleString();
    const custObj: Customer = {
      mobile: cleanPhone,
      name: orderData.name || '',
      whatsapp: orderData.whatsapp || cleanPhone,
      buildingNo: orderData.buildingNo || '',
      zoneNo: orderData.zoneNo || '',
      streetNo: orderData.streetNo || '',
      zoneName: orderData.zoneName || '',
      addressExtra: orderData.addressExtra || '',
      mapLink: orderData.mapLink || '',
      note: orderData.note || '',
      createdAt: custIdx >= 0 ? customers[custIdx].createdAt : now,
      updatedAt: now
    };
    if (custIdx >= 0) {
      customers[custIdx] = custObj;
    } else {
      customers.push(custObj);
    }
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
  }

  if (isEdit) {
    const idx = orders.findIndex(o => o.id === orderData.id);
    if (idx === -1) return { success: false, message: 'অর্ডার পাওয়া যায়নি' };

    const old = orders[idx];

    // If already delivered and stock was adjusted, reconcile stock changes
    if (old.status === 'Delivered' && old.stockAdjusted === 'YES') {
      const delta: Record<string, number> = {};
      old.items.forEach(it => { delta[it.sku] = (delta[it.sku] || 0) - it.qty; });
      orderData.items.forEach(it => { delta[it.sku] = (delta[it.sku] || 0) + it.qty; });

      Object.entries(delta).forEach(([sku, diff]) => {
        if (diff !== 0) {
          const p = products.find(x => x.sku === sku);
          if (p) {
            p.stock = Math.max(0, p.stock - diff);
          }
        }
      });
      setStored(STORAGE_KEYS.PRODUCTS, products);
    }

    orders[idx] = {
      ...old,
      ...orderData as Order,
      items: orderData.items
    };
    setStored(STORAGE_KEYS.ORDERS, orders);
    return { success: true, message: 'অর্ডার সফলভাবে আপডেট হয়েছে!', orderId: old.id };
  } else {
    // Check duplicate ID
    if (orders.some(o => o.id === orderData.id)) {
      return { success: false, message: `এই Invoice / Order No (${orderData.id}) আগে থেকেই আছে। অন্য একটি সংখ্যা দিন!` };
    }

    const newOrder: Order = {
      id: orderData.id || `ORD-${Date.now()}`,
      date: orderData.date || new Date().toLocaleString(),
      dateKey: orderData.dateKey || new Date().toISOString().slice(0, 10),
      name: orderData.name || '',
      phone: orderData.phone || '',
      whatsapp: orderData.whatsapp || '',
      zone: orderData.zone || '',
      zoneCode: orderData.zoneCode || '',
      delCharge: orderData.delCharge || 0,
      freeDelivery: !!orderData.freeDelivery,
      delCharged: orderData.delCharged || 0,
      deliveryCost: orderData.deliveryCost || 0,
      deliveryMode: orderData.deliveryMode || 'auto',
      productPricingMode: orderData.productPricingMode || 'auto',
      subTotal: orderData.subTotal || 0,
      grandTotal: orderData.grandTotal || 0,
      status: 'Pending',
      driver: orderData.driver || '',
      payment: 'COD',
      source: orderData.source || 'Messenger',
      pageCode: orderData.pageCode || 'CZ',
      buildingNo: orderData.buildingNo || '',
      zoneNo: orderData.zoneNo || '',
      streetNo: orderData.streetNo || '',
      zoneName: orderData.zoneName || '',
      addressExtra: orderData.addressExtra || '',
      mapLink: orderData.mapLink || '',
      mapUrl: orderData.mapLink || '',
      discountType: orderData.discountType || 'none',
      discountValue: orderData.discountValue || 0,
      discountAmount: orderData.discountAmount || 0,
      couponCode: orderData.couponCode || '',
      createdBy: orderData.createdBy || 'Admin',
      note: orderData.note || '',
      items: orderData.items
    };

    orders.unshift(newOrder); // Newest first!
    setStored(STORAGE_KEYS.ORDERS, orders);

    // Push notification to driver
    if (newOrder.driver) {
      addNotification(`USER:${newOrder.driver}`, 'assign', '📦 নতুন অর্ডার', `অর্ডার ${newOrder.id} আপনাকে assign করা হয়েছে (${newOrder.name})`, newOrder.id);
    }

    return { success: true, message: `অর্ডার সফলভাবে সেভ হয়েছে! ID: ${newOrder.id}`, orderId: newOrder.id };
  }
}

export function updateOrderStatusAdmin(orderId: string, status: OrderStatus, reason?: string): { success: boolean; message: string } {
  const orders = getOrders();
  const products = getProducts();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return { success: false, message: 'অর্ডার পাওয়া যায়নি' };

  const o = orders[idx];
  const oldStatus = o.status;
  o.status = status;
  o.reason = reason || '';
  o.approval = false;
  o.driverStatus = '';
  o.driverReason = '';

  if (status === 'Delivered') {
    o.deliveredAt = new Date().toLocaleString();
    // Deduct stock if not yet adjusted
    if (o.stockAdjusted !== 'YES') {
      o.items.forEach(it => {
        const p = products.find(prod => prod.sku === it.sku);
        if (p) {
          p.stock = Math.max(0, p.stock - it.qty);
        }
      });
      o.stockAdjusted = 'YES';
      setStored(STORAGE_KEYS.PRODUCTS, products);
    }
  } else {
    o.deliveredAt = '';
  }

  setStored(STORAGE_KEYS.ORDERS, orders);
  if (o.driver) {
    addNotification(`USER:${o.driver}`, 'info', 'Status পরিবর্তন', `অর্ডার ${o.id} এর status Admin "${status}" করেছেন`, o.id);
  }
  return { success: true, message: `Status আপডেট হয়েছে: ${status}` };
}

export function submitDriverStatus(orderId: string, status: OrderStatus, reason: string, driverName: string): { success: boolean; message: string } {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return { success: false, message: 'অর্ডার পাওয়া যায়নি' };

  const o = orders[idx];
  if (o.driver !== driverName) return { success: false, message: 'এই অর্ডারটি আপনার নয়!' };
  if (o.status !== 'Pending') return { success: false, message: 'এই অর্ডার Admin ইতিমধ্যে final করেছেন।' };

  o.driverStatus = status;
  o.driverReason = reason;
  o.approval = true;
  o.driverAt = new Date().toLocaleString();

  setStored(STORAGE_KEYS.ORDERS, orders);
  addNotification('ADMIN', 'approval', `🔔 ${driverName} status দিয়েছেন`, `অর্ডার ${o.id} (${o.name}) → ${status}${reason ? ` (${reason})` : ''} — Approval দরকার`, o.id);
  return { success: true, message: 'Admin এর কাছে পাঠানো হয়েছে। Admin approve করলে final হবে।' };
}

export function approveOrder(orderId: string): { success: boolean; message: string } {
  const orders = getOrders();
  const products = getProducts();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return { success: false, message: 'অর্ডার পাওয়া যায়নি' };

  const o = orders[idx];
  const newStatus = (o.driverStatus as OrderStatus) || 'Delivered';
  o.status = newStatus;
  o.reason = o.driverReason || '';
  o.approval = false;
  o.driverStatus = '';
  o.driverReason = '';

  if (newStatus === 'Delivered') {
    o.deliveredAt = o.driverAt || new Date().toLocaleString();
    if (o.stockAdjusted !== 'YES') {
      o.items.forEach(it => {
        const p = products.find(prod => prod.sku === it.sku);
        if (p) {
          p.stock = Math.max(0, p.stock - it.qty);
        }
      });
      o.stockAdjusted = 'YES';
      setStored(STORAGE_KEYS.PRODUCTS, products);
    }
  }

  setStored(STORAGE_KEYS.ORDERS, orders);
  if (o.driver) {
    addNotification(`USER:${o.driver}`, 'info', '✅ Approved', `অর্ডার ${o.id} এর status "${newStatus}" final হয়েছে`, o.id);
  }
  return { success: true, message: `অর্ডার ${o.id} সফলভাবে approve হয়েছে!` };
}

export function rejectOrder(orderId: string, note?: string): { success: boolean; message: string } {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return { success: false, message: 'অর্ডার পাওয়া যায়নি' };

  const o = orders[idx];
  o.approval = false;
  o.driverStatus = '';
  o.driverReason = '';

  setStored(STORAGE_KEYS.ORDERS, orders);
  if (o.driver) {
    addNotification(`USER:${o.driver}`, 'info', '❌ Status গ্রহণ হয়নি', `অর্ডার ${o.id} এর status Admin approve করেননি${note ? `: ${note}` : ''}। আবার চেক করে জমা দিন।`, o.id);
  }
  return { success: true, message: 'Reject করা হয়েছে, driver কে জানানো হয়েছে।' };
}

export function deleteOrder(orderId: string, restock: boolean): { success: boolean; message: string } {
  let orders = getOrders();
  const products = getProducts();
  const o = orders.find(x => x.id === orderId);
  if (!o) return { success: false, message: 'অর্ডার পাওয়া যায়নি' };

  if (restock && o.status === 'Delivered' && o.stockAdjusted === 'YES') {
    o.items.forEach(it => {
      const p = products.find(prod => prod.sku === it.sku);
      if (p) {
        p.stock += it.qty;
      }
    });
    setStored(STORAGE_KEYS.PRODUCTS, products);
  }

  orders = orders.filter(x => x.id !== orderId);
  setStored(STORAGE_KEYS.ORDERS, orders);
  return { success: true, message: `অর্ডার ${orderId} মুছে ফেলা হয়েছে` };
}

export function assignOrdersDriver(ids: string[], driverName: string): { success: boolean; message: string } {
  const orders = getOrders();
  let count = 0;
  ids.forEach(id => {
    const o = orders.find(x => x.id === id);
    if (o && o.driver !== driverName) {
      o.driver = driverName;
      o.approval = false;
      o.driverStatus = '';
      o.driverReason = '';
      count++;
    }
  });
  setStored(STORAGE_KEYS.ORDERS, orders);
  if (count > 0) {
    addNotification(`USER:${driverName}`, 'assign', '📦 নতুন অর্ডার assign', `${count} টি অর্ডার আপনাকে assign করা হয়েছে`, ids[0]);
  }
  return { success: true, message: `${count} টি অর্ডার ${driverName} কে assign হয়েছে!` };
}

// Product Management
export function saveProduct(product: Product, isNew: boolean): { success: boolean; message: string } {
  const products = getProducts();
  if (isNew) {
    if (products.some(p => p.sku === product.sku)) {
      return { success: false, message: `এই SKU (${product.sku}) আগে থেকেই আছে` };
    }
    products.push(product);
  } else {
    const idx = products.findIndex(p => p.sku === product.sku);
    if (idx === -1) return { success: false, message: 'Product পাওয়া যায়নি' };
    products[idx] = product;
  }
  setStored(STORAGE_KEYS.PRODUCTS, products);
  return { success: true, message: isNew ? 'Product add হয়েছে' : 'Product update হয়েছে' };
}

export function setProductStock(sku: string, newStock: number): { success: boolean; message: string } {
  const products = getProducts();
  const p = products.find(x => x.sku === sku);
  if (!p) return { success: false, message: 'Product পাওয়া যায়নি' };
  p.stock = Math.max(0, newStock);
  setStored(STORAGE_KEYS.PRODUCTS, products);
  return { success: true, message: `SKU ${sku} stock updated to ${p.stock}` };
}

export function setProductStatus(sku: string, status: 'Active' | 'Inactive'): { success: boolean; message: string } {
  const products = getProducts();
  const p = products.find(x => x.sku === sku);
  if (!p) return { success: false, message: 'Product পাওয়া যায়নি' };
  p.status = status;
  if (status === 'Inactive') p.stock = 0;
  setStored(STORAGE_KEYS.PRODUCTS, products);
  return { success: true, message: `Product ${status === 'Active' ? 'restored' : 'deactivated'}` };
}

// Zones
export function saveZone(zone: DeliveryZone, isNew: boolean): { success: boolean; message: string } {
  const zones = getZones();
  if (isNew) {
    if (zones.some(z => z.code === zone.code)) {
      return { success: false, message: `Zone code ${zone.code} already exists` };
    }
    zones.push(zone);
  } else {
    const idx = zones.findIndex(z => z.code === zone.code);
    if (idx === -1) return { success: false, message: 'Zone পাওয়া যায়নি' };
    zones[idx] = zone;
  }
  setStored(STORAGE_KEYS.ZONES, zones);
  return { success: true, message: isNew ? 'Zone যোগ হয়েছে' : 'Zone আপডেট হয়েছে' };
}

// Pages
export function savePage(page: BusinessPage, isNew: boolean): { success: boolean; message: string } {
  const pages = getPages();
  if (isNew) {
    if (pages.some(p => p.code === page.code)) {
      return { success: false, message: `Page code ${page.code} already exists` };
    }
    pages.push(page);
  } else {
    const idx = pages.findIndex(p => p.code === page.code);
    if (idx === -1) return { success: false, message: 'Page পাওয়া যায়নি' };
    pages[idx] = page;
  }
  setStored(STORAGE_KEYS.PAGES, pages);
  return { success: true, message: isNew ? 'Page যোগ হয়েছে' : 'Page আপডেট হয়েছে' };
}

// Employees
export function saveEmployee(emp: Employee, isNew: boolean): { success: boolean; message: string } {
  const employees = getEmployees();
  if (isNew) {
    if (employees.some(e => e.phone === emp.phone)) {
      return { success: false, message: `Mobile ${emp.phone} already exists` };
    }
    employees.push(emp);
  } else {
    const idx = employees.findIndex(e => e.phone === emp.phone);
    if (idx === -1) return { success: false, message: 'Employee পাওয়া যায়নি' };
    employees[idx] = emp;
  }
  setStored(STORAGE_KEYS.EMPLOYEES, employees);
  return { success: true, message: isNew ? 'Employee add হয়েছে' : 'Employee update হয়েছে' };
}

// Expenses
export function saveExpense(expense: ExpenseEntry): { success: boolean; message: string } {
  const expenses = getExpenses();
  const idx = expenses.findIndex(e => e.id === expense.id);
  if (idx >= 0) {
    expenses[idx] = expense;
  } else {
    expenses.unshift(expense);
  }
  setStored(STORAGE_KEYS.EXPENSES, expenses);
  return { success: true, message: 'খরচ সেভ হয়েছে' };
}

export function deleteExpense(id: string): { success: boolean; message: string } {
  let expenses = getExpenses();
  expenses = expenses.filter(e => e.id !== id);
  setStored(STORAGE_KEYS.EXPENSES, expenses);
  return { success: true, message: 'খরচ মুছে ফেলা হয়েছে' };
}

export function addExpenseCategory(cat: string): { success: boolean; message: string } {
  const cats = getExpenseCategories();
  if (cats.includes(cat)) return { success: false, message: 'Category already exists' };
  cats.push(cat);
  setStored(STORAGE_KEYS.EXP_CATS, cats);
  return { success: true, message: 'Category যোগ হয়েছে' };
}

// Notifications
export function addNotification(target: string, type: string, title: string, message: string, orderId?: string): void {
  const notifs = getNotifications();
  notifs.unshift({
    id: Date.now(),
    time: new Date().toLocaleString(),
    target,
    type,
    title,
    message,
    orderId
  });
  if (notifs.length > 200) notifs.splice(200);
  setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
}

export function clearUserNotifications(user: UserSession): void {
  let notifs = getNotifications();
  if (user.role === 'Admin') {
    notifs = notifs.filter(n => n.target !== 'ADMIN');
  } else {
    notifs = notifs.filter(n => n.target !== `USER:${user.name}`);
  }
  setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
}

// Reset Database to Demo Defaults
export function resetDatabase(): void {
  setStored(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  setStored(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  setStored(STORAGE_KEYS.ZONES, DEFAULT_ZONES);
  setStored(STORAGE_KEYS.PAGES, DEFAULT_PAGES);
  setStored(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
  setStored(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  setStored(STORAGE_KEYS.EXP_CATS, DEFAULT_EXPENSE_CATEGORIES);
  setStored(STORAGE_KEYS.SHOP_INFO, DEFAULT_SHOP_INFO);
}
