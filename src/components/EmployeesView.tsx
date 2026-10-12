import React, { useState, useMemo } from 'react';
import { Employee, UserRole } from '../types';
import { ShieldAlert, Plus, Edit, User, Bike, Shield } from 'lucide-react';

interface EmployeesViewProps {
  employees: Employee[];
  onSaveEmployee: (emp: Employee, isNew: boolean) => { success: boolean; message: string };
  onToggleStatus: (phone: string, status: 'Active' | 'Inactive') => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  onSaveEmployee,
  onToggleStatus
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);

  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [role, setRole] = useState<UserRole>('Order Entry');
  const [zone, setZone] = useState<string>('');

  const filteredEmployees = useMemo(() => {
    if (roleFilter === 'all') return employees;
    return employees.filter(e => e.role === roleFilter);
  }, [employees, roleFilter]);

  const handleOpenAdd = () => {
    setEditingPhone(null);
    setName('');
    setPhone('');
    setPin('');
    setRole('Order Entry');
    setZone('');
    setModalOpen(true);
  };

  const handleOpenEdit = (e: Employee) => {
    setEditingPhone(e.phone);
    setName(e.name);
    setPhone(e.phone);
    setPin(''); // do not reveal
    setRole(e.role);
    setZone(e.zone || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('নাম এবং ৮ ডিজিট মোবাইল নম্বর দিন!');
      return;
    }

    const payload: Employee = {
      name: name.trim(),
      phone: phone.trim(),
      pin: pin.trim() || '1234',
      role,
      zone: zone.trim(),
      status: 'Active'
    };

    const res = onSaveEmployee(payload, !editingPhone);
    alert(res.message);
    if (res.success) setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Employees &amp; Staff Permissions</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin = সব অ্যাক্সেস &middot; Order Entry = অর্ডার তৈরি ও হিস্ট্রি &middot; Driver = শুধুমাত্র নিজের অর্ডার ও হিসাব।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Order Entry">Order Entry</option>
            <option value="Driver">Driver</option>
          </select>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Mobile (Login ID)</th>
                <th className="py-3 px-4">Designation / Role</th>
                <th className="py-3 px-4">Assigned Delivery Zone</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(e => (
                <tr key={e.phone} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{e.name}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{e.phone}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      e.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      e.role === 'Order Entry' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {e.role === 'Admin' && <Shield className="w-3 h-3" />}
                      {e.role === 'Order Entry' && <User className="w-3 h-3" />}
                      {e.role === 'Driver' && <Bike className="w-3 h-3" />}
                      <span>{e.role}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{e.zone || '—'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      e.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(e)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                        title="Edit Employee"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {e.status === 'Active' ? (
                        <button
                          onClick={() => onToggleStatus(e.phone, 'Inactive')}
                          className="text-[11px] font-semibold text-red-600 hover:underline"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleStatus(e.phone, 'Active')}
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">
              {editingPhone ? `Edit Employee: ${name}` : 'নতুন Employee যোগ করুন'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Employee Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Fatima Order Desk"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mobile (8 digit Login ID) *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  disabled={!!editingPhone}
                  placeholder="55112233"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  PIN (4-6 digits) {editingPhone && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="1234"
                  maxLength={6}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono text-center outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Designation / Role *</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                >
                  <option value="Order Entry">Order Entry</option>
                  <option value="Driver">Driver</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {role === 'Driver' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Delivery Zone</label>
                  <input
                    type="text"
                    value={zone}
                    onChange={e => setZone(e.target.value)}
                    placeholder="DOH - Doha Central"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
