import React, { useState, useEffect } from 'react';
import {
  UserSession, Order, Product, DeliveryZone, BusinessPage,
  Employee, Customer, ExpenseEntry, AppNotification, ShopInfo, OrderStatus
} from './types';
import * as storage from './services/storage';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { DailyDeliveredProfit } from './components/DailyDeliveredProfit';
import { CreateOrder } from './components/CreateOrder';
import { OrderHistory } from './components/OrderHistory';
import { ApprovalsView } from './components/ApprovalsView';
import { DriverPortal } from './components/DriverPortal';
import { ExpensesView } from './components/ExpensesView';
import { InventoryView } from './components/InventoryView';
import { CustomersView } from './components/CustomersView';
import { DriversAndZonesView } from './components/DriversAndZonesView';
import { PagesView } from './components/PagesView';
import { EmployeesView } from './components/EmployeesView';
import { InvoiceModal } from './components/InvoiceModal';
import { GasDeploymentGuide } from './components/GasDeploymentGuide';
import {
  LayoutDashboard, PlusCircle, ListOrdered, CheckSquare,
  DollarSign, Calculator, Package, Users, Bike, Share2,
  ShieldCheck, FileCode, Lock, Phone, KeyRound
} from 'lucide-react';

export default function App() {
  // Session
  const [session, setSession] = useState<UserSession | null>(() => storage.getSession());
  const [loginTab, setLoginTab] = useState<'emp' | 'admin'>('emp');
  const [loginPhone, setLoginPhone] = useState<string>('55443322');
  const [loginPin, setLoginPin] = useState<string>('1122');
  const [adminPass, setAdminPass] = useState<string>('admin123');
  const [loginError, setLoginError] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application Data
  const [orders, setOrders] = useState<Order[]>(() => storage.getOrders());
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [zones, setZones] = useState<DeliveryZone[]>(() => storage.getZones());
  const [pages, setPages] = useState<BusinessPage[]>(() => storage.getPages());
  const [employees, setEmployees] = useState<Employee[]>(() => storage.getEmployees());
  const [customers, setCustomers] = useState<Customer[]>(() => storage.getCustomers());
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() => storage.getExpenses());
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => storage.getExpenseCategories());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => storage.getNotifications());
  const [shopInfo, setShopInfo] = useState<ShopInfo>(() => storage.getShopInfo());

  // Modals & Navigation
  const [invoiceOrders, setInvoiceOrders] = useState<Order[]>([]);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isGasGuideOpen, setIsGasGuideOpen] = useState<boolean>(false);

  // Sync state helpers
  const refreshAll = () => {
    setOrders(storage.getOrders());
    setProducts(storage.getProducts());
    setZones(storage.getZones());
    setPages(storage.getPages());
    setEmployees(storage.getEmployees());
    setCustomers(storage.getCustomers());
    setExpenses(storage.getExpenses());
    setExpenseCategories(storage.getExpenseCategories());
    setNotifications(storage.getNotifications());
    setShopInfo(storage.getShopInfo());
  };

  const handleLoginEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const emp = employees.find(x => x.phone.replace(/\D/g, '') === loginPhone.replace(/\D/g, ''));
    if (!emp) {
      setLoginError('মোবাইল নম্বর খুঁজে পাওয়া যায়নি');
      return;
    }
    if (emp.pin !== loginPin) {
      setLoginError('ভুল পিন (PIN)');
      return;
    }
    if (emp.status === 'Inactive') {
      setLoginError('একাউন্ট Inactive! Admin এর সাথে যোগাযোগ করুন।');
      return;
    }

    const newSession: UserSession = {
      name: emp.name,
      phone: emp.phone,
      role: emp.role,
      zone: emp.zone
    };
    storage.setSession(newSession);
    setSession(newSession);
    setActiveTab(emp.role === 'Driver' ? 'driver_portal' : emp.role === 'Order Entry' ? 'create_order' : 'dashboard');
  };

  const handleLoginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (adminPass !== 'admin123') {
      setLoginError('ভুল এডমিন পাসওয়ার্ড (Default: admin123)');
      return;
    }

    const newSession: UserSession = {
      name: 'Admin Manager',
      phone: '55000000',
      role: 'Admin'
    };
    storage.setSession(newSession);
    setSession(newSession);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    storage.setSession(null);
    setSession(null);
  };

  const handleSwitchRole = (role: UserSession['role']) => {
    if (role === 'Admin') {
      const s: UserSession = { name: 'Admin Manager', phone: '55000000', role: 'Admin' };
      storage.setSession(s);
      setSession(s);
      setActiveTab('dashboard');
    } else if (role === 'Order Entry') {
      const s: UserSession = { name: 'Fatima Order Desk', phone: '55112233', role: 'Order Entry' };
      storage.setSession(s);
      setSession(s);
      setActiveTab('create_order');
    } else {
      const s: UserSession = { name: 'Rahim Khan', phone: '55443322', role: 'Driver', zone: 'DOH - Doha Central' };
      storage.setSession(s);
      setSession(s);
      setActiveTab('driver_portal');
    }
  };

  // Order Handlers
  const handleSaveOrder = (orderPayload: Partial<Order> & { items: Order['items'] }, isEdit?: boolean) => {
    const res = storage.saveOrder(orderPayload, isEdit);
    refreshAll();
    if (isEdit && res.success) {
      setEditingOrder(null);
      setActiveTab('order_history');
    }
    return res;
  };

  const handleStatusChangeAdmin = (orderId: string, status: OrderStatus, reason?: string) => {
    storage.updateOrderStatusAdmin(orderId, status, reason);
    refreshAll();
  };

  const handleDriverStatusSubmit = (orderId: string, status: OrderStatus, reason: string) => {
    if (!session) return;
    storage.submitDriverStatus(orderId, status, reason, session.name);
    refreshAll();
  };

  const handleApproveOrder = (orderId: string) => {
    storage.approveOrder(orderId);
    refreshAll();
  };

  const handleRejectOrder = (orderId: string, note?: string) => {
    storage.rejectOrder(orderId, note);
    refreshAll();
  };

  const handleApproveAll = (orderIds: string[]) => {
    orderIds.forEach(id => storage.approveOrder(id));
    refreshAll();
  };

  const handleDeleteOrder = (orderId: string, restock: boolean) => {
    storage.deleteOrder(orderId, restock);
    refreshAll();
  };

  const handleAssignDriver = (orderIds: string[], driverName: string) => {
    storage.assignOrdersDriver(orderIds, driverName);
    refreshAll();
  };

  // Inventory handlers
  const handleSaveProduct = (prod: Product, isNew: boolean) => {
    const res = storage.saveProduct(prod, isNew);
    refreshAll();
    return res;
  };

  const handleUpdateStock = (sku: string, newStock: number) => {
    storage.setProductStock(sku, newStock);
    refreshAll();
  };

  const handleToggleProductStatus = (sku: string, status: 'Active' | 'Inactive') => {
    storage.setProductStatus(sku, status);
    refreshAll();
  };

  // Zone handlers
  const handleSaveZone = (z: DeliveryZone, isNew: boolean) => {
    const res = storage.saveZone(z, isNew);
    refreshAll();
    return res;
  };

  const handleToggleZoneStatus = (code: string, status: 'Active' | 'Inactive') => {
    const z = zones.find(x => x.code === code);
    if (z) {
      storage.saveZone({ ...z, status }, false);
      refreshAll();
    }
  };

  // Driver handlers
  const handleSaveDriver = (d: Employee, isNew: boolean) => {
    const res = storage.saveEmployee(d, isNew);
    refreshAll();
    return res;
  };

  const handleToggleDriverStatus = (phone: string, status: 'Active' | 'Inactive') => {
    const e = employees.find(x => x.phone === phone);
    if (e) {
      storage.saveEmployee({ ...e, status }, false);
      refreshAll();
    }
  };

  // Page handlers
  const handleSavePage = (p: BusinessPage, isNew: boolean) => {
    const res = storage.savePage(p, isNew);
    refreshAll();
    return res;
  };

  const handleTogglePageStatus = (code: string, status: 'Active' | 'Inactive') => {
    const p = pages.find(x => x.code === code);
    if (p) {
      storage.savePage({ ...p, status }, false);
      refreshAll();
    }
  };

  // Customer handlers
  const handleSaveCustomer = (c: Customer, isEdit: boolean) => {
    const list = [...customers];
    if (isEdit) {
      const idx = list.findIndex(x => x.mobile === c.mobile);
      if (idx >= 0) list[idx] = c;
    } else {
      list.push(c);
    }
    localStorage.setItem('qsm_customers', JSON.stringify(list));
    refreshAll();
  };

  const handleDeleteCustomer = (mobile: string) => {
    const list = customers.filter(x => x.mobile !== mobile);
    localStorage.setItem('qsm_customers', JSON.stringify(list));
    refreshAll();
  };

  const handleBulkImportCustomers = (imported: Customer[]) => {
    const existingMobiles = new Set(customers.map(c => c.mobile.replace(/\D/g, '')));
    const merged = [...customers];
    imported.forEach(imp => {
      if (!existingMobiles.has(imp.mobile.replace(/\D/g, ''))) {
        merged.push(imp);
        existingMobiles.add(imp.mobile.replace(/\D/g, ''));
      }
    });
    localStorage.setItem('qsm_customers', JSON.stringify(merged));
    refreshAll();
  };

  // Expense handlers
  const handleSaveExpense = (exp: ExpenseEntry) => {
    storage.saveExpense(exp);
    refreshAll();
  };

  const handleDeleteExpense = (id: string) => {
    storage.deleteExpense(id);
    refreshAll();
  };

  const handleAddExpenseCategory = (cat: string) => {
    storage.addExpenseCategory(cat);
    refreshAll();
  };

  // Invoice Open handlers
  const handleOpenSingleInvoice = (order: Order) => {
    setInvoiceOrders([order]);
    setIsInvoiceOpen(true);
  };

  const handleOpenMultipleInvoices = (ordList: Order[]) => {
    setInvoiceOrders(ordList);
    setIsInvoiceOpen(true);
  };

  const awaitingApprovalsCount = orders.filter(o => o.approval).length;

  // Unauthenticated screen
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-lg shadow-indigo-600/30 mb-3">
              QS
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Qatar Shop Manager</h1>
            <p className="text-xs text-slate-500 mt-1">ব্যবসা ব্যবস্থাপনা পোর্টাল &middot; Zero-Cost Google Architecture</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
            <button
              onClick={() => { setLoginTab('emp'); setLoginError(''); }}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                loginTab === 'emp' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Employee Login
            </button>
            <button
              onClick={() => { setLoginTab('admin'); setLoginError(''); }}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                loginTab === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin Login
            </button>
          </div>

          {loginError && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {loginError}
            </div>
          )}

          {loginTab === 'emp' ? (
            <form onSubmit={handleLoginEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">মোবাইল নম্বর (Qatar 8 Digits)</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    placeholder="55443322"
                    className="w-full text-xs pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">পিন (PIN - 4 to 6 Digits)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPin}
                    onChange={e => setLoginPin(e.target.value)}
                    placeholder="••••"
                    maxLength={6}
                    className="w-full text-xs pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl font-mono text-center tracking-widest text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors shadow-lg shadow-indigo-600/30"
              >
                লগইন করুন (Employee)
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Admin Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    placeholder="পাসওয়ার্ড দিন"
                    className="w-full text-xs pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide transition-colors shadow-lg"
              >
                Admin লগইন
              </button>
            </form>
          )}

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <div className="text-[11px] text-slate-400 font-medium mb-2">দ্রুত টেস্ট করার জন্য ক্লিক করুন:</div>
            <div className="flex flex-wrap gap-1.5 justify-center text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setLoginTab('admin');
                  setAdminPass('admin123');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Admin (admin123)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginTab('emp');
                  setLoginPhone('55112233');
                  setLoginPin('2233');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold"
              >
                Fatima (Order Entry / 2233)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginTab('emp');
                  setLoginPhone('55443322');
                  setLoginPin('1122');
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold"
              >
                Rahim (Driver / 1122)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Navigation tabs configuration
  const navTabs = [
    ...(session.role === 'Admin' ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-600' }] : []),
    { id: 'create_order', label: editingOrder ? 'Edit Order' : 'Create Order', icon: PlusCircle, color: 'text-emerald-600' },
    { id: 'order_history', label: 'Order History', icon: ListOrdered, color: 'text-purple-600' },
    ...(session.role === 'Admin' ? [
      { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: awaitingApprovalsCount, color: 'text-amber-600' },
      { id: 'expenses', label: 'Expenses', icon: DollarSign, color: 'text-red-600' },
      { id: 'daily_profit', label: 'Daily Profit', icon: Calculator, color: 'text-emerald-600' },
      { id: 'inventory', label: 'Inventory', icon: Package, color: 'text-teal-600' },
      { id: 'customers', label: 'Customers', icon: Users, color: 'text-cyan-600' },
      { id: 'drivers_zones', label: 'Driver & Zones', icon: Bike, color: 'text-indigo-600' },
      { id: 'pages', label: 'Pages', icon: Share2, color: 'text-pink-600' },
      { id: 'employees', label: 'Employees', icon: ShieldCheck, color: 'text-slate-700' }
    ] : []),
    ...(session.role === 'Driver' ? [
      { id: 'driver_portal', label: 'Driver Dashboard', icon: Bike, color: 'text-amber-600' }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        session={session}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        notifications={notifications}
        onClearNotifications={() => {
          storage.clearUserNotifications(session);
          setNotifications(storage.getNotifications());
        }}
        onOpenGasGuide={() => setIsGasGuideOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* Navigation Tabs (if not on driver exclusive portal) */}
        {session.role !== 'Driver' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none no-print">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-white text-indigo-700 border-indigo-200/80 shadow-sm'
                      : 'bg-white/60 text-slate-600 border-transparent hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold font-mono">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {/* Tab Content Panes */}
        {activeTab === 'dashboard' && session.role === 'Admin' && (
          <AdminDashboard orders={orders} expenses={expenses} />
        )}

        {activeTab === 'daily_profit' && session.role === 'Admin' && (
          <DailyDeliveredProfit orders={orders} />
        )}

        {activeTab === 'create_order' && (
          <CreateOrder
            products={products}
            zones={zones}
            pages={pages}
            drivers={employees}
            customers={customers}
            onSaveOrder={handleSaveOrder}
            editingOrder={editingOrder}
            onCancelEdit={() => {
              setEditingOrder(null);
              setActiveTab('order_history');
            }}
          />
        )}

        {activeTab === 'order_history' && (
          <OrderHistory
            orders={orders}
            drivers={employees}
            session={session}
            onOpenInvoice={handleOpenSingleInvoice}
            onPrintMultiple={handleOpenMultipleInvoices}
            onEditOrder={order => {
              setEditingOrder(order);
              setActiveTab('create_order');
            }}
            onDeleteOrder={handleDeleteOrder}
            onChangeStatus={handleStatusChangeAdmin}
            onAssignDriver={handleAssignDriver}
          />
        )}

        {activeTab === 'approvals' && session.role === 'Admin' && (
          <ApprovalsView
            orders={orders}
            onApproveOrder={handleApproveOrder}
            onRejectOrder={handleRejectOrder}
            onApproveAll={handleApproveAll}
            onOpenInvoice={handleOpenSingleInvoice}
          />
        )}

        {activeTab === 'driver_portal' && (
          <DriverPortal
            session={session}
            orders={orders}
            onSubmitStatus={handleDriverStatusSubmit}
            onOpenInvoice={handleOpenSingleInvoice}
          />
        )}

        {activeTab === 'expenses' && session.role === 'Admin' && (
          <ExpensesView
            expenses={expenses}
            categories={expenseCategories}
            session={session}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            onAddCategory={handleAddExpenseCategory}
          />
        )}

        {activeTab === 'inventory' && session.role === 'Admin' && (
          <InventoryView
            products={products}
            onSaveProduct={handleSaveProduct}
            onUpdateStock={handleUpdateStock}
            onToggleStatus={handleToggleProductStatus}
          />
        )}

        {activeTab === 'customers' && session.role === 'Admin' && (
          <CustomersView
            customers={customers}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onBulkImport={handleBulkImportCustomers}
          />
        )}

        {activeTab === 'drivers_zones' && session.role === 'Admin' && (
          <DriversAndZonesView
            zones={zones}
            drivers={employees}
            orders={orders}
            onSaveZone={handleSaveZone}
            onSaveDriver={handleSaveDriver}
            onToggleZoneStatus={handleToggleZoneStatus}
            onToggleDriverStatus={handleToggleDriverStatus}
          />
        )}

        {activeTab === 'pages' && session.role === 'Admin' && (
          <PagesView
            pages={pages}
            onSavePage={handleSavePage}
            onTogglePageStatus={handleTogglePageStatus}
          />
        )}

        {activeTab === 'employees' && session.role === 'Admin' && (
          <EmployeesView
            employees={employees}
            onSaveEmployee={handleSaveDriver}
            onToggleStatus={handleToggleDriverStatus}
          />
        )}
      </main>

      {/* Invoice Modal (Single / Multi-order A4 Print) */}
      {isInvoiceOpen && (
        <InvoiceModal
          orders={invoiceOrders}
          pages={pages}
          shopInfo={shopInfo}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}

      {/* Google Apps Script Deployment Hub Modal */}
      {isGasGuideOpen && (
        <GasDeploymentGuide
          onClose={() => setIsGasGuideOpen(false)}
        />
      )}
    </div>
  );
}
