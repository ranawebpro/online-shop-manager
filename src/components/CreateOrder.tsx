import React, { useState, useEffect, useMemo } from 'react';
import {
  Order, Product, DeliveryZone, BusinessPage, Employee, Customer,
  PricingMode, DeliveryMode, DiscountType, OrderItem
} from '../types';
import { QATAR_ZONE_AREAS, COUNTRY_DATA } from '../data/initialData';
import { Plus, Trash2, CheckCircle, AlertTriangle, Search, Truck, MapPin, Tag } from 'lucide-react';

interface CreateOrderProps {
  products: Product[];
  zones: DeliveryZone[];
  pages: BusinessPage[];
  drivers: Employee[];
  customers: Customer[];
  onSaveOrder: (order: Partial<Order> & { items: Order['items'] }, isEdit?: boolean) => { success: boolean; message: string; orderId?: string };
  editingOrder?: Order | null;
  onCancelEdit?: () => void;
}

export const CreateOrder: React.FC<CreateOrderProps> = ({
  products,
  zones,
  pages,
  drivers,
  customers,
  onSaveOrder,
  editingOrder,
  onCancelEdit
}) => {
  // Source & Page
  const [source, setSource] = useState<string>('Messenger');
  const [pageCode, setPageCode] = useState<string>('CZ');
  const [orderDate, setOrderDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [invoiceManual, setInvoiceManual] = useState<boolean>(false);

  // Customer
  const [customerName, setCustomerName] = useState<string>('');
  const [phCountryCode, setPhCountryCode] = useState<string>('974');
  const [phNumber, setPhNumber] = useState<string>('');
  const [waSame, setWaSame] = useState<boolean>(true);
  const [waCountryCode, setWaCountryCode] = useState<string>('974');
  const [waNumber, setWaNumber] = useState<string>('');
  const [customerLookupNote, setCustomerLookupNote] = useState<string>('');

  // Address
  const [buildingNo, setBuildingNo] = useState<string>('');
  const [zoneNo, setZoneNo] = useState<string>('');
  const [streetNo, setStreetNo] = useState<string>('');
  const [zoneName, setZoneName] = useState<string>('');
  const [addressExtra, setAddressExtra] = useState<string>('');
  const [mapLink, setMapLink] = useState<string>('');

  // Zone & Delivery
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>('RAY');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('auto');
  const [deliveryCharge, setDeliveryCharge] = useState<number>(20);
  const [zoneHint, setZoneHint] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Pricing & Items
  const [productPricingMode, setProductPricingMode] = useState<PricingMode>('auto');
  const [items, setItems] = useState<Array<{
    id: string;
    sku: string;
    qty: number;
    manualLinePrice: string;
    note: string;
  }>>([
    { id: '1', sku: products[0]?.sku || '', qty: 1, manualLinePrice: '', note: '' }
  ]);
  const [orderNote, setOrderNote] = useState<string>('');

  // Discount & Free Delivery
  const [discountType, setDiscountType] = useState<DiscountType>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>('');
  const [freeDelivery, setFreeDelivery] = useState<boolean>(false);

  // Driver
  const [assignedDriver, setAssignedDriver] = useState<string>(drivers.filter(d => d.role === 'Driver')[0]?.name || '');

  // Status message
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Page order code mapping (e.g. NS -> N, CZ -> C, DPW -> D)
  const getPageLetter = (pCode: string) => {
    const p = pages.find(x => x.code === pCode);
    const name = (p ? p.name : pCode).toUpperCase();
    if (name.includes('COLOR ZONE') || pCode === 'CZ') return 'C';
    if (name.includes('NASMATH') || pCode === 'NS') return 'N';
    if (name.includes('PINOY') || pCode === 'DPW') return 'D';
    return pCode.replace(/[^A-Z0-9]/g, '').slice(0, 1) || 'P';
  };

  const getSourceLetter = (src: string) => {
    if (src === 'Messenger') return 'M';
    if (src === 'WhatsApp') return 'W';
    if (src === 'Instagram') return 'I';
    return src.slice(0, 1).toUpperCase() || 'S';
  };

  // Expected prefix
  const expectedPrefix = useMemo(() => {
    const dStr = orderDate.replace(/-/g, '');
    const sLetter = getSourceLetter(source);
    const pLetter = getPageLetter(pageCode);
    return `${dStr}${sLetter}${pLetter}`;
  }, [orderDate, source, pageCode, pages]);

  // Sync auto prefix
  useEffect(() => {
    if (editingOrder) return;
    if (!invoiceManual || !invoiceNo.startsWith(expectedPrefix)) {
      setInvoiceNo(`${expectedPrefix}901`);
    }
  }, [expectedPrefix, editingOrder]);

  // Load editing order
  useEffect(() => {
    if (editingOrder) {
      setSource(editingOrder.source || 'Messenger');
      setPageCode(editingOrder.pageCode || 'CZ');
      setOrderDate(editingOrder.dateKey || new Date().toISOString().slice(0, 10));
      setInvoiceNo(editingOrder.id);
      setInvoiceManual(true);
      setCustomerName(editingOrder.name || '');

      // Parse phone
      const pClean = (editingOrder.phone || '').replace(/^\+/, '');
      const matchedCc = COUNTRY_DATA.find(c => pClean.startsWith(c.code)) || { code: '974' };
      setPhCountryCode(matchedCc.code);
      setPhNumber(pClean.slice(matchedCc.code.length).trim());

      if (editingOrder.whatsapp) {
        const waClean = editingOrder.whatsapp.replace(/^\+/, '');
        const matchedWaCc = COUNTRY_DATA.find(c => waClean.startsWith(c.code)) || { code: '974' };
        setWaCountryCode(matchedWaCc.code);
        setWaNumber(waClean.slice(matchedWaCc.code.length).trim());
        setWaSame(editingOrder.whatsapp === editingOrder.phone);
      } else {
        setWaSame(true);
      }

      setBuildingNo(editingOrder.buildingNo || '');
      setZoneNo(editingOrder.zoneNo || '');
      setStreetNo(editingOrder.streetNo || '');
      setZoneName(editingOrder.zoneName || '');
      setAddressExtra(editingOrder.addressExtra || '');
      setMapLink(editingOrder.mapLink || '');

      const zCode = editingOrder.zoneCode || editingOrder.zone.split(' - ')[0] || 'RAY';
      setSelectedZoneCode(zCode);
      setDeliveryMode(editingOrder.deliveryMode || 'auto');
      setDeliveryCharge(editingOrder.delCharge || 20);

      setProductPricingMode(editingOrder.productPricingMode || 'auto');
      setDiscountType(editingOrder.discountType || 'none');
      setDiscountValue(editingOrder.discountValue || 0);
      setCouponCode(editingOrder.couponCode || '');
      setFreeDelivery(editingOrder.freeDelivery || false);
      setAssignedDriver(editingOrder.driver || '');
      setOrderNote(editingOrder.note || '');

      if (editingOrder.items && editingOrder.items.length > 0) {
        setItems(editingOrder.items.map((it, idx) => ({
          id: String(idx + 1),
          sku: it.sku,
          qty: it.qty,
          manualLinePrice: String(it.lineTotal),
          note: it.note || ''
        })));
      }
    }
  }, [editingOrder]);

  // Customer Phone lookup
  useEffect(() => {
    if (editingOrder) return;
    const fullNum = `+${phCountryCode} ${phNumber}`.replace(/\D/g, '');
    if (phNumber.length >= 8) {
      const match = customers.find(c => c.mobile.replace(/\D/g, '') === fullNum);
      if (match) {
        setCustomerName(match.name);
        setBuildingNo(match.buildingNo || '');
        setZoneNo(match.zoneNo || '');
        setStreetNo(match.streetNo || '');
        setZoneName(match.zoneName || '');
        setAddressExtra(match.addressExtra || '');
        setMapLink(match.mapLink || '');
        setCustomerLookupNote(`✓ Existing Customer পাওয়া গেছে (${match.name})`);
        if (match.whatsapp) {
          const waClean = match.whatsapp.replace(/^\+/, '');
          const matchedWaCc = COUNTRY_DATA.find(c => waClean.startsWith(c.code)) || { code: '974' };
          setWaCountryCode(matchedWaCc.code);
          setWaNumber(waClean.slice(matchedWaCc.code.length).trim());
          setWaSame(match.whatsapp === match.mobile);
        }
      } else {
        setCustomerLookupNote('নতুন কাস্টমার — সেভ করলে স্বয়ংক্রিয়ভাবে কাস্টমার লিস্টে যোগ হবে');
      }
    } else {
      setCustomerLookupNote('');
    }
  }, [phNumber, phCountryCode, customers, editingOrder]);

  // Zone No Auto detection
  useEffect(() => {
    const zNum = zoneNo.trim();
    if (!zNum) {
      setZoneHint(null);
      return;
    }
    // Match against zones areas
    const matches = zones.filter(z => z.areas && z.areas.includes(zNum));
    if (matches.length === 1) {
      setSelectedZoneCode(matches[0].code);
      if (deliveryMode === 'auto') {
        setDeliveryCharge(matches[0].charge);
      }
      setZoneHint({
        type: 'success',
        text: `✅ Zone No ${zNum} &rarr; ${matches[0].code} - ${matches[0].name} (${matches[0].charge} QR)`
      });
    } else if (matches.length > 1) {
      setZoneHint({
        type: 'info',
        text: `📍 Zone No ${zNum}-এর জন্য ${matches.length}টি ডেলিভারি জোন প্রযোজ্য। সঠিক জোন নির্বাচন করুন।`
      });
    } else {
      setZoneHint({
        type: 'warning',
        text: `⚠️ Zone No ${zNum} কোনো Delivery Zone-এ সেট করা নেই — Delivery Zones থেকে সেট করুন।`
      });
    }

    // Auto set Qatar Area name suggestions
    if (QATAR_ZONE_AREAS[zNum] && QATAR_ZONE_AREAS[zNum].length > 0 && !zoneName) {
      setZoneName(QATAR_ZONE_AREAS[zNum][0]);
    }
  }, [zoneNo, zones, deliveryMode]);

  // Auto update delivery charge when zone changes in auto mode
  const handleZoneChange = (zCode: string) => {
    setSelectedZoneCode(zCode);
    if (deliveryMode === 'auto') {
      const z = zones.find(x => x.code === zCode);
      if (z) setDeliveryCharge(z.charge);
    }
  };

  // Line item calculation with bundle pricing
  const calculatedItems = useMemo(() => {
    return items.map(item => {
      const p = products.find(prod => prod.sku === item.sku);
      const unitPrice = p ? p.sellPrice : 0;
      const bq = p ? p.bundleQty : 0;
      const bp = p ? p.bundlePrice : 0;
      const qty = item.qty || 1;

      let autoLineTotal = unitPrice * qty;
      if (bq > 0 && bp > 0 && qty >= bq) {
        const bundles = Math.floor(qty / bq);
        const rem = qty % bq;
        autoLineTotal = bundles * bp + rem * unitPrice;
      }

      const finalLineTotal = productPricingMode === 'manual' && item.manualLinePrice !== ''
        ? parseFloat(item.manualLinePrice) || 0
        : autoLineTotal;

      return {
        ...item,
        product: p,
        unitPrice,
        autoLineTotal,
        finalLineTotal
      };
    });
  }, [items, products, productPricingMode]);

  // Subtotal & Discount & Grand Total
  const subTotal = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + it.finalLineTotal, 0);
  }, [calculatedItems]);

  const calculatedDiscount = useMemo(() => {
    let d = 0;
    if (discountType === 'flat') d = discountValue;
    else if (discountType === 'percent') d = (subTotal * discountValue) / 100;
    return Math.min(Math.max(d, 0), subTotal);
  }, [discountType, discountValue, subTotal]);

  const customerDeliveryCharge = freeDelivery ? 0 : deliveryCharge;
  const freeDeliveryCost = freeDelivery
    ? (deliveryMode === 'manual' ? deliveryCharge : Math.max(deliveryCharge - 10, 0))
    : 0;

  const grandTotal = Math.max(0, subTotal - calculatedDiscount + customerDeliveryCharge);

  // Checkpoints validation
  const checks = useMemo(() => {
    const isPhoneValid = phCountryCode === '974' ? phNumber.length === 8 : phNumber.length >= 6;
    const isAddressValid = (buildingNo && zoneNo && streetNo) || mapLink.trim().length > 0;
    const hasItems = calculatedItems.length > 0 && calculatedItems.every(it => it.sku && it.qty > 0);

    return [
      { key: 'Source', ok: !!source },
      { key: 'Page', ok: !!pageCode },
      { key: 'Customer', ok: customerName.trim().length > 0 },
      { key: 'Mobile', ok: isPhoneValid },
      { key: 'Address/Map', ok: !!isAddressValid },
      { key: 'Delivery Zone', ok: !!selectedZoneCode },
      { key: 'Items', ok: hasItems },
      { key: 'Driver', ok: !!assignedDriver }
    ];
  }, [source, pageCode, customerName, phCountryCode, phNumber, buildingNo, zoneNo, streetNo, mapLink, selectedZoneCode, calculatedItems, assignedDriver]);

  const completedCheckCount = checks.filter(c => c.ok).length;

  const handleAddItem = () => {
    setItems([...items, { id: String(Date.now()), sku: products[0]?.sku || '', qty: 1, manualLinePrice: '', note: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    const missing = checks.filter(c => !c.ok);
    if (missing.length > 0) {
      setSubmitMessage({
        type: 'error',
        text: `ফর্ম অসম্পূর্ণ! অনুগ্রহ করে পূরণ করুন: ${missing.map(m => m.key).join(', ')}`
      });
      return;
    }

    const currentZone = zones.find(z => z.code === selectedZoneCode);
    const orderItemsPayload: OrderItem[] = calculatedItems.map(it => ({
      sku: it.sku,
      name: it.product?.name || it.sku,
      variation: it.product?.variation || '',
      qty: it.qty,
      unitPrice: it.unitPrice,
      lineTotal: it.finalLineTotal,
      buyPrice: it.product?.buyPrice || 0,
      extraCost: it.product?.extraCost || 0,
      note: it.note
    }));

    const fullMobile = `+${phCountryCode} ${phNumber}`;
    const fullWa = waSame ? fullMobile : (waNumber ? `+${waCountryCode} ${waNumber}` : '');

    const orderPayload: Partial<Order> & { items: Order['items'] } = {
      id: invoiceNo.trim().toUpperCase(),
      date: new Date().toLocaleString(),
      dateKey: orderDate,
      name: customerName.trim(),
      phone: fullMobile,
      whatsapp: fullWa,
      zone: currentZone ? `${currentZone.code} - ${currentZone.name}` : selectedZoneCode,
      zoneCode: selectedZoneCode,
      delCharge: deliveryCharge,
      freeDelivery,
      delCharged: customerDeliveryCharge,
      deliveryCost: freeDeliveryCost,
      deliveryMode,
      productPricingMode,
      subTotal,
      grandTotal,
      source,
      pageCode,
      buildingNo,
      zoneNo,
      streetNo,
      zoneName,
      addressExtra,
      mapLink,
      mapUrl: mapLink,
      discountType,
      discountValue,
      discountAmount: calculatedDiscount,
      couponCode,
      driver: assignedDriver,
      note: orderNote,
      items: orderItemsPayload
    };

    const res = onSaveOrder(orderPayload, !!editingOrder);
    if (res.success) {
      setSubmitMessage({ type: 'success', text: res.message });
      if (!editingOrder) {
        // Reset form
        setCustomerName('');
        setPhNumber('');
        setWaNumber('');
        setBuildingNo('');
        setZoneNo('');
        setStreetNo('');
        setZoneName('');
        setAddressExtra('');
        setMapLink('');
        setOrderNote('');
        setDiscountType('none');
        setDiscountValue(0);
        setFreeDelivery(false);
        setItems([{ id: '1', sku: products[0]?.sku || '', qty: 1, manualLinePrice: '', note: '' }]);
      }
    } else {
      setSubmitMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress & Checklist Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm sticky top-18 z-20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {editingOrder ? `✏️ এডিট হচ্ছে: ${editingOrder.id}` : 'অর্ডার এন্ট্রি অগ্রগতি'}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {completedCheckCount} / {checks.length} Complete
            </span>
          </div>

          {editingOrder && onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-300 ${
              completedCheckCount === checks.length ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${(completedCheckCount / checks.length) * 100}%` }}
          />
        </div>

        {/* Checkpoints pills */}
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {checks.map(c => (
            <span
              key={c.key}
              className={`px-2 py-0.5 rounded-lg font-medium flex items-center gap-1 ${
                c.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {c.ok ? '✔' : '✖'} {c.key}
            </span>
          ))}
        </div>
      </div>

      {submitMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          submitMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {submitMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{submitMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Source & Page */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">1</span>
            অর্ডারের উৎস ও পেজ (Order Source &amp; Page)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Order Source *</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white font-medium"
              >
                <option value="Messenger">Facebook Messenger (M)</option>
                <option value="WhatsApp">WhatsApp (W)</option>
                <option value="Instagram">Instagram (I)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Business Page *</label>
              <select
                value={pageCode}
                onChange={e => setPageCode(e.target.value)}
                disabled={!!editingOrder}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white font-medium"
              >
                {pages.map(p => (
                  <option key={p.code} value={p.code}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Order Date *</label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                disabled={!!editingOrder}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Invoice / Order No *</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={e => { setInvoiceNo(e.target.value); setInvoiceManual(true); }}
                disabled={!!editingOrder}
                placeholder="20261012MC901"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono font-bold"
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            Auto prefix: <span className="font-mono font-semibold text-slate-600">{expectedPrefix}</span> + আপনার পছন্দের নম্বর। ইউনিক অর্ডার আইডি ব্যবহৃত হবে।
          </div>
        </div>

        {/* SECTION 2: Customer */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">2</span>
            কাস্টমারের তথ্য (Customer Details)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Mohammed Al-Kuwari"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number (Login ID) *</label>
              <div className="flex gap-1.5">
                <select
                  value={phCountryCode}
                  onChange={e => setPhCountryCode(e.target.value)}
                  className="w-24 text-xs px-2 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
                >
                  {COUNTRY_DATA.map(c => (
                    <option key={c.code} value={c.code}>+{c.code} ({c.name.slice(0, 3)})</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phNumber}
                  onChange={e => setPhNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="55551234 (8 digits)"
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                />
              </div>
              {customerLookupNote && (
                <div className="text-[11px] text-emerald-600 font-medium mt-1">{customerLookupNote}</div>
              )}
            </div>

            {/* WhatsApp Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600">WhatsApp Number</label>
                <label className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waSame}
                    onChange={e => setWaSame(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Mobile এর মতোই</span>
                </label>
              </div>
              <div className="flex gap-1.5">
                <select
                  value={waCountryCode}
                  onChange={e => setWaCountryCode(e.target.value)}
                  disabled={waSame}
                  className="w-24 text-xs px-2 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono disabled:opacity-60"
                >
                  {COUNTRY_DATA.map(c => (
                    <option key={c.code} value={c.code}>+{c.code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={waSame ? phNumber : waNumber}
                  onChange={e => setWaNumber(e.target.value.replace(/\D/g, ''))}
                  disabled={waSame}
                  placeholder="WhatsApp number"
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Address & Delivery Zone */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs">3</span>
            ঠিকানা ও ডেলিভারি জোন (Address &amp; Delivery Zone)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Building No</label>
              <input
                type="text"
                value={buildingNo}
                onChange={e => setBuildingNo(e.target.value)}
                placeholder="ex: 14"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Zone No <span className="text-[10px] text-indigo-600">(Auto Zone detect)</span>
              </label>
              <input
                type="text"
                value={zoneNo}
                onChange={e => setZoneNo(e.target.value)}
                placeholder="ex: 51"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono font-bold"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Street No</label>
              <input
                type="text"
                value={streetNo}
                onChange={e => setStreetNo(e.target.value)}
                placeholder="ex: 320"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono"
              />
            </div>

            <div className="col-span-2 sm:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Additional Address Info <span className="text-slate-400 font-normal">(Optional: Flat, Floor, Gate, Landmark)</span>
              </label>
              <input
                type="text"
                value={addressExtra}
                onChange={e => setAddressExtra(e.target.value)}
                placeholder="Floor 2, Flat 204, Opposite Family Food Centre"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Area / Zone Name</label>
              <input
                type="text"
                value={zoneName}
                onChange={e => setZoneName(e.target.value)}
                placeholder="Al Gharrafa"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Google Maps Link</label>
              <input
                type="url"
                value={mapLink}
                onChange={e => setMapLink(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {zoneHint && (
            <div className={`p-2.5 rounded-xl text-xs font-medium ${
              zoneHint.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
              zoneHint.type === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-indigo-50 text-indigo-800'
            }`}>
              {zoneHint.text}
            </div>
          )}

          {/* Delivery Zone selection & Charge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Zone *</label>
              <select
                value={selectedZoneCode}
                onChange={e => handleZoneChange(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white font-medium"
              >
                {zones.map(z => (
                  <option key={z.code} value={z.code}>
                    {z.code} - {z.name} ({z.charge} QR)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pricing Mode</label>
              <select
                value={deliveryMode}
                onChange={e => {
                  const m = e.target.value as DeliveryMode;
                  setDeliveryMode(m);
                  if (m === 'auto') {
                    const z = zones.find(x => x.code === selectedZoneCode);
                    if (z) setDeliveryCharge(z.charge);
                  }
                }}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white"
              >
                <option value="auto">Automatic (Zone Rule)</option>
                <option value="manual">Manual Delivery Charge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Charge (QR)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={deliveryCharge}
                onChange={e => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                readOnly={deliveryMode === 'auto'}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono font-bold bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Products & Line Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">4</span>
              প্রোডাক্ট সমূহ (Products &amp; Bundle Pricing)
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={productPricingMode === 'manual'}
                onChange={e => setProductPricingMode(e.target.checked ? 'manual' : 'auto')}
                className="rounded text-purple-600"
              />
              <span>Manual Pricing Mode</span>
            </label>
          </div>

          {/* Items rows */}
          <div className="space-y-3">
            {calculatedItems.map((it, idx) => (
              <div key={it.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Item #{idx + 1}</span>
                  {calculatedItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <select
                      value={it.sku}
                      onChange={e => {
                        const newSku = e.target.value;
                        setItems(items.map(item => item.id === it.id ? { ...item, sku: newSku } : item));
                      }}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium outline-none"
                    >
                      {products.map(p => (
                        <option key={p.sku} value={p.sku}>
                          {p.sku} &middot; {p.name} {p.variation ? `(${p.variation})` : ''} - {p.sellPrice} QR {p.bundleQty ? `[Bundle: ${p.bundleQty} for ${p.bundlePrice} QR]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={it.qty}
                      onChange={e => {
                        const q = parseInt(e.target.value) || 1;
                        setItems(items.map(item => item.id === it.id ? { ...item, qty: Math.max(1, q) } : item));
                      }}
                      placeholder="Qty"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white text-center font-mono font-bold outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productPricingMode === 'manual' ? it.manualLinePrice : it.finalLineTotal.toFixed(2)}
                      onChange={e => {
                        const val = e.target.value;
                        setItems(items.map(item => item.id === it.id ? { ...item, manualLinePrice: val } : item));
                      }}
                      readOnly={productPricingMode === 'auto'}
                      placeholder="Line Price"
                      className={`w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold outline-none text-right ${
                        productPricingMode === 'auto' ? 'bg-slate-100 text-slate-800' : 'bg-white text-purple-700'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-12">
                    <input
                      type="text"
                      value={it.note}
                      onChange={e => {
                        const val = e.target.value;
                        setItems(items.map(item => item.id === it.id ? { ...item, note: val } : item));
                      }}
                      placeholder="Item Note (Size, Color, Special request)"
                      className="w-full text-[11px] px-3 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                  <span>Unit: {it.unitPrice} QR</span>
                  <span className="font-semibold text-slate-700">Line Total: {it.finalLineTotal.toFixed(2)} QR</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Item
            </button>
            <div className="text-xs font-bold text-slate-800">
              Items Total: {subTotal.toFixed(2)} QR
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Order Note (Optional)</label>
            <textarea
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              rows={2}
              placeholder="যেকোনো বিশেষ নির্দেশনা বা নোট লিখুন..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        {/* SECTION 5: Discount & Free Delivery */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-teal-600 font-bold text-sm border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs">5</span>
            ডিসকাউন্ট ও ফ্রি ডেলিভারি (Discount &amp; Promotion)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={e => setDiscountType(e.target.value as DiscountType)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white font-medium"
              >
                <option value="none">No Discount</option>
                <option value="flat">Flat Amount (QR)</option>
                <option value="percent">Percentage (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Discount Value</label>
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                disabled={discountType === 'none'}
                placeholder="0"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none font-mono font-bold disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Coupon Code</label>
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="ex: SAVE10"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none uppercase font-mono font-semibold"
              />
            </div>
          </div>

          {/* Free delivery switch */}
          <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/60 flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-teal-900 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeDelivery}
                  onChange={e => setFreeDelivery(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span>Free Delivery Promotion (Customer Pays 0 QR Delivery)</span>
              </label>
              <p className="text-[11px] text-teal-700 mt-0.5">
                কাস্টমার কোনো ডেলিভারি চার্জ দেবে না। দোকান খরচ বহন করবে ({freeDeliveryCost.toFixed(2)} QR) যা নিট লাভ থেকে কাটা হবে।
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 6: Driver Assignment */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">6</span>
            ডেলিভারি ম্যান নির্ধারণ (Assign Driver)
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Select Driver *</label>
            <select
              value={assignedDriver}
              onChange={e => setAssignedDriver(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none bg-white font-medium"
            >
              {drivers.filter(d => d.role === 'Driver' && d.status === 'Active').map(d => (
                <option key={d.phone} value={d.name}>
                  {d.name} {d.zone ? `(${d.zone})` : ''} - {d.phone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SUMMARY & SUBMISSION */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Order Financial Summary
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-800">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Product Items Total:</span>
              <span className="font-mono font-bold">{subTotal.toFixed(2)} QR</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Discount:</span>
              <span className="font-mono font-bold text-emerald-400">&minus; {calculatedDiscount.toFixed(2)} QR</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Delivery Fee (Customer):</span>
              <span className="font-mono font-bold text-amber-400">
                {freeDelivery ? 'FREE (0.00 QR)' : `${customerDeliveryCharge.toFixed(2)} QR`}
              </span>
            </div>
            <div className="flex justify-between pt-3 text-base sm:text-lg font-bold">
              <span className="text-slate-100">Grand Total to Collect (COD):</span>
              <span className="font-mono text-emerald-400">{grandTotal.toFixed(2)} QR</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide transition-colors shadow-lg shadow-indigo-600/30"
          >
            {editingOrder ? 'Update Order' : 'Save Order (অর্ডার সম্পন্ন করুন)'}
          </button>
        </div>
      </form>
    </div>
  );
};
