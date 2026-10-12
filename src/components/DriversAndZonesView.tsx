import React, { useState, useMemo } from 'react';
import { DeliveryZone, Employee, Order } from '../types';
import { Bike, MapPin, Plus, Edit, Wallet, Calendar } from 'lucide-react';

interface DriversAndZonesViewProps {
  zones: DeliveryZone[];
  drivers: Employee[];
  orders: Order[];
  onSaveZone: (zone: DeliveryZone, isNew: boolean) => { success: boolean; message: string };
  onSaveDriver: (driver: Employee, isNew: boolean) => { success: boolean; message: string };
  onToggleZoneStatus: (code: string, status: 'Active' | 'Inactive') => void;
  onToggleDriverStatus: (phone: string, status: 'Active' | 'Inactive') => void;
}

export const DriversAndZonesView: React.FC<DriversAndZonesViewProps> = ({
  zones,
  drivers,
  orders,
  onSaveZone,
  onSaveDriver,
  onToggleZoneStatus,
  onToggleDriverStatus
}) => {
  // Zone modal
  const [zoneModalOpen, setZoneModalOpen] = useState<boolean>(false);
  const [zoneEditCode, setZoneEditCode] = useState<string | null>(null);
  const [zCode, setZCode] = useState<string>('');
  const [zName, setZName] = useState<string>('');
  const [zCharge, setZCharge] = useState<number>(20);
  const [zAreas, setZAreas] = useState<string>('');

  // Driver modal
  const [driverModalOpen, setDriverModalOpen] = useState<boolean>(false);
  const [driverEditPhone, setDriverEditPhone] = useState<string | null>(null);
  const [dName, setDName] = useState<string>('');
  const [dPhone, setDPhone] = useState<string>('');
  const [dPin, setDPin] = useState<string>('');
  const [dZone, setDZone] = useState<string>('');

  // Driver statement calculator
  const [stmtDriver, setStmtDriver] = useState<string>(drivers[0]?.name || '');
  const [stmtFrom, setStmtFrom] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [stmtTo, setStmtTo] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const driverList = useMemo(() => {
    return drivers.filter(e => e.role === 'Driver');
  }, [drivers]);

  // Statement calculation
  const statement = useMemo(() => {
    if (!stmtDriver) return null;

    let deliveredCount = 0;
    let pendingCount = 0;
    let returnCount = 0;
    let exchangeCount = 0;
    let awaitingCount = 0;
    let earnings = 0;
    let cash = 0;

    orders.forEach(o => {
      if (o.driver !== stmtDriver) return;
      if (o.dateKey && (o.dateKey < stmtFrom || o.dateKey > stmtTo)) return;

      if (o.approval) awaitingCount++;

      if (o.status === 'Delivered') {
        deliveredCount++;
        earnings += o.delCharge || 0;
        cash += o.grandTotal || 0;
      } else if (o.status === 'Pending') {
        pendingCount++;
      } else if (o.status === 'Return') {
        returnCount++;
      } else if (o.status === 'Exchange') {
        exchangeCount++;
      }
    });

    return {
      driver: stmtDriver,
      from: stmtFrom,
      to: stmtTo,
      deliveredCount,
      pendingCount,
      returnCount,
      exchangeCount,
      awaitingCount,
      earnings,
      cash
    };
  }, [orders, stmtDriver, stmtFrom, stmtTo]);

  const handleOpenAddZone = () => {
    setZoneEditCode(null);
    setZCode('');
    setZName('');
    setZCharge(20);
    setZAreas('');
    setZoneModalOpen(true);
  };

  const handleOpenEditZone = (z: DeliveryZone) => {
    setZoneEditCode(z.code);
    setZCode(z.code);
    setZName(z.name);
    setZCharge(z.charge);
    setZAreas((z.areas || []).join(', '));
    setZoneModalOpen(true);
  };

  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zCode.trim() || !zName.trim()) {
      alert('Zone code ও Zone name আবশ্যক!');
      return;
    }

    // Parse areas
    const areaTokens: string[] = [];
    zAreas.split(/[\s,;]+/).forEach(token => {
      const t = token.trim();
      if (!t) return;
      const m = t.match(/^(\d+)(?:-(\d+))?$/);
      if (m) {
        const start = parseInt(m[1], 10);
        const end = m[2] ? parseInt(m[2], 10) : start;
        for (let i = start; i <= end; i++) {
          areaTokens.push(String(i));
        }
      }
    });

    const payload: DeliveryZone = {
      code: zCode.trim().toUpperCase(),
      name: zName.trim(),
      charge: Number(zCharge) || 0,
      areas: Array.from(new Set(areaTokens)),
      status: 'Active'
    };

    const res = onSaveZone(payload, !zoneEditCode);
    alert(res.message);
    if (res.success) setZoneModalOpen(false);
  };

  const handleOpenAddDriver = () => {
    setDriverEditPhone(null);
    setDName('');
    setDPhone('');
    setDPin('');
    setDZone(zones[0]?.name || '');
    setDriverModalOpen(true);
  };

  const handleOpenEditDriver = (d: Employee) => {
    setDriverEditPhone(d.phone);
    setDName(d.name);
    setDPhone(d.phone);
    setDPin(''); // don't expose pin
    setDZone(d.zone || '');
    setDriverModalOpen(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dName.trim() || !dPhone.trim()) {
      alert('নাম এবং ৮ ডিজিট মোবাইল নম্বর দিন!');
      return;
    }

    const payload: Employee = {
      name: dName.trim(),
      phone: dPhone.trim(),
      pin: dPin.trim() || '1234',
      role: 'Driver',
      zone: dZone.trim(),
      status: 'Active'
    };

    const res = onSaveDriver(payload, !driverEditPhone);
    alert(res.message);
    if (res.success) setDriverModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: DRIVERS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Drivers Management</h2>
          </div>

          <button
            onClick={handleOpenAddDriver}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Driver
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Mobile (Login ID)</th>
                <th className="py-3 px-4">Assigned Delivery Zone</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverList.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">কোনো Driver নেই</td></tr>
              ) : (
                driverList.map(d => (
                  <tr key={d.phone} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.name}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{d.phone}</td>
                    <td className="py-3.5 px-4 text-slate-600">{d.zone || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setStmtDriver(d.name);
                            document.getElementById('driverStmtSection')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                        >
                          হিসাব
                        </button>
                        <button
                          onClick={() => handleOpenEditDriver(d)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {d.status === 'Active' ? (
                          <button
                            onClick={() => onToggleDriverStatus(d.phone, 'Inactive')}
                            className="text-[11px] font-semibold text-red-600 hover:underline px-1"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleDriverStatus(d.phone, 'Active')}
                            className="text-[11px] font-semibold text-emerald-600 hover:underline px-1"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: DRIVER FINANCIAL STATEMENT */}
      <div id="driverStmtSection" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Wallet className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-800">Driver এর আর্থিক হিসাব (Driver Statement)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Select Driver</label>
            <select
              value={stmtDriver}
              onChange={e => setStmtDriver(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
            >
              {driverList.map(d => (
                <option key={d.phone} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              value={stmtFrom}
              onChange={e => setStmtFrom(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              value={stmtTo}
              onChange={e => setStmtTo(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
            />
          </div>
        </div>

        {statement && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
              <div className="text-xs text-slate-500 font-medium">Delivered Orders</div>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">{statement.deliveredCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
              <div className="text-xs text-slate-500 font-medium">কমিশন (Earnings)</div>
              <div className="text-xl font-bold font-mono text-indigo-600 mt-0.5">{statement.earnings.toFixed(2)} QR</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
              <div className="text-xs text-slate-500 font-medium">কালেক্ট করেছে (Cash)</div>
              <div className="text-xl font-bold font-mono text-amber-600 mt-0.5">{statement.cash.toFixed(2)} QR</div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: DELIVERY ZONES */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-800">Delivery Zones &amp; Charges</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Address Zone Numbers (ex: 40, 41, 45-48) দিলে Order Form এ ঠিকানার Zone No লিখলেই এই Delivery Zone স্বয়ংক্রিয়ভাবে সিলেক্ট হবে।
            </p>
          </div>

          <button
            onClick={handleOpenAddZone}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Delivery Zone
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Zone Name</th>
                <th className="py-3 px-4 text-right">Delivery Charge</th>
                <th className="py-3 px-4">Auto-Detected Address Zone Numbers</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map(z => (
                <tr key={z.code} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{z.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{z.name}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">{z.charge} QR</td>
                  <td className="py-3.5 px-4">
                    <div className="text-[11px] text-slate-600 max-w-[280px]">
                      {(z.areas || []).length > 0 ? (
                        <span>{(z.areas || []).join(', ')}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      z.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {z.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditZone(z)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {z.status === 'Active' ? (
                        <button
                          onClick={() => onToggleZoneStatus(z.code, 'Inactive')}
                          className="text-[11px] font-semibold text-red-600 hover:underline"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleZoneStatus(z.code, 'Active')}
                          className="text-[11px] font-semibold text-emerald-600 hover:underline"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zone Modal */}
      {zoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">
              {zoneEditCode ? `Edit Zone: ${zoneEditCode}` : 'নতুন Delivery Zone যোগ করুন'}
            </h3>

            <form onSubmit={handleSaveZone} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Zone Code (ex: DOH) *</label>
                <input
                  type="text"
                  value={zCode}
                  onChange={e => setZCode(e.target.value.toUpperCase())}
                  disabled={!!zoneEditCode}
                  placeholder="DOH"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase font-bold outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Zone Name *</label>
                <input
                  type="text"
                  value={zName}
                  onChange={e => setZName(e.target.value)}
                  placeholder="Doha Central"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Charge (QR) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={zCharge}
                  onChange={e => setZCharge(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Address Zone Numbers <span className="text-slate-400 font-normal">(ex: 40, 41, 45-48)</span>
                </label>
                <input
                  type="text"
                  value={zAreas}
                  onChange={e => setZAreas(e.target.value)}
                  placeholder="40, 41, 45-48"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  কমা দিয়ে আলাদা করুন অথবা রেঞ্জ লিখুন। এই নম্বরের ঠিকানায় অর্ডার আসলে এই জোনটি অটো সিলেক্ট হবে।
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setZoneModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Modal */}
      {driverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">
              {driverEditPhone ? `Edit Driver: ${dName}` : 'নতুন Driver যোগ করুন'}
            </h3>

            <form onSubmit={handleSaveDriver} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Driver Name *</label>
                <input
                  type="text"
                  value={dName}
                  onChange={e => setDName(e.target.value)}
                  placeholder="Rahim Khan"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mobile (8 digit Login ID) *</label>
                <input
                  type="tel"
                  value={dPhone}
                  onChange={e => setDPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="55443322"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  PIN (4-6 digits) {driverEditPhone && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={dPin}
                  onChange={e => setDPin(e.target.value)}
                  placeholder="1234"
                  maxLength={6}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono text-center outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Zone</label>
                <input
                  type="text"
                  value={dZone}
                  onChange={e => setDZone(e.target.value)}
                  placeholder="DOH - Doha Central"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDriverModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
