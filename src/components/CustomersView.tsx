import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { Users, Search, Download, Upload, Plus, Edit, Trash2, MapPin, FileSpreadsheet } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer, isEdit: boolean) => void;
  onDeleteCustomer: (mobile: string) => void;
  onBulkImport: (newCustomers: Customer[]) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onSaveCustomer,
  onDeleteCustomer,
  onBulkImport
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [buildingNo, setBuildingNo] = useState<string>('');
  const [zoneNo, setZoneNo] = useState<string>('');
  const [streetNo, setStreetNo] = useState<string>('');
  const [zoneName, setZoneName] = useState<string>('');
  const [addressExtra, setAddressExtra] = useState<string>('');
  const [mapLink, setMapLink] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Bulk CSV state
  const [bulkCsvText, setBulkCsvText] = useState<string>('');
  const [bulkModalOpen, setBulkModalOpen] = useState<boolean>(false);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(c => {
      const hay = `${c.name} ${c.mobile} ${c.whatsapp || ''} ${c.zoneName || ''} ${c.zoneNo || ''} ${c.note || ''}`.toLowerCase();
      return hay.includes(term);
    });
  }, [customers, searchTerm]);

  const handleOpenAdd = () => {
    setIsEdit(false);
    setName('');
    setMobile('+974 ');
    setWhatsapp('');
    setBuildingNo('');
    setZoneNo('');
    setStreetNo('');
    setZoneName('');
    setAddressExtra('');
    setMapLink('');
    setNote('');
    setFormOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setIsEdit(true);
    setName(c.name);
    setMobile(c.mobile);
    setWhatsapp(c.whatsapp || '');
    setBuildingNo(c.buildingNo || '');
    setZoneNo(c.zoneNo || '');
    setStreetNo(c.streetNo || '');
    setZoneName(c.zoneName || '');
    setAddressExtra(c.addressExtra || '');
    setMapLink(c.mapLink || '');
    setNote(c.note || '');
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      alert('Name ও Mobile number আবশ্যক!');
      return;
    }

    const payload: Customer = {
      name: name.trim(),
      mobile: mobile.trim(),
      whatsapp: whatsapp.trim() || mobile.trim(),
      buildingNo: buildingNo.trim(),
      zoneNo: zoneNo.trim(),
      streetNo: streetNo.trim(),
      zoneName: zoneName.trim(),
      addressExtra: addressExtra.trim(),
      mapLink: mapLink.trim(),
      note: note.trim(),
      createdAt: isEdit ? (customers.find(x => x.mobile === mobile)?.createdAt || new Date().toLocaleString()) : new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    };

    onSaveCustomer(payload, isEdit);
    setFormOpen(false);
  };

  const handleDownloadCsv = () => {
    const headers = ['Mobile', 'Name', 'WhatsApp', 'Building No', 'Zone No', 'Street No', 'Zone Name', 'Address Extra', 'Map Link', 'Note'];
    const rows = customers.map(c => [
      `"${c.mobile}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.whatsapp || ''}"`,
      `"${c.buildingNo || ''}"`,
      `"${c.zoneNo || ''}"`,
      `"${c.streetNo || ''}"`,
      `"${c.zoneName || ''}"`,
      `"${(c.addressExtra || '').replace(/"/g, '""')}"`,
      `"${c.mapLink || ''}"`,
      `"${(c.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Qatar-Customers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const template = '\uFEFFMobile,Name,WhatsApp,Building No,Zone No,Street No,Zone Name,Address Extra,Map Link,Note\r\n+974 55123456,Ahmed Al-Thani,+974 55123456,12,50,123,Doha,Flat 4B,https://maps.google.com/...,VIP Customer';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Customers-Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleParseCsvImport = () => {
    if (!bulkCsvText.trim()) return;
    const lines = bulkCsvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) {
      alert('CSV ডেটা পাওয়া যায়নি');
      return;
    }

    const imported: Customer[] = [];
    const now = new Date().toLocaleString();

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts[0] && parts[1]) {
        imported.push({
          mobile: parts[0],
          name: parts[1],
          whatsapp: parts[2] || parts[0],
          buildingNo: parts[3] || '',
          zoneNo: parts[4] || '',
          streetNo: parts[5] || '',
          zoneName: parts[6] || '',
          addressExtra: parts[7] || '',
          mapLink: parts[8] || '',
          note: parts[9] || '',
          createdAt: now,
          updatedAt: now
        });
      }
    }

    if (imported.length > 0) {
      onBulkImport(imported);
      setBulkModalOpen(false);
      setBulkCsvText('');
      alert(`${imported.length} টি কাস্টমার সফলভাবে Import হয়েছে!`);
    } else {
      alert('সঠিক কাস্টমার লাইন পাওয়া যায়নি');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-800">Customer Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mobile number-ই unique key। কাস্টমার মুছে ফেললে পুরনো অর্ডার বা হিস্ট্রি ডিলিট হবে না।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Template
          </button>
          <button
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-xs font-semibold text-emerald-800 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setBulkModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, zone, address..."
            className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Address Details</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    কোনো কাস্টমার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.mobile} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{c.mobile}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600">{c.whatsapp || c.mobile}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        {(c.buildingNo || c.zoneNo || c.streetNo) ? (
                          <span>Bldg {c.buildingNo || '-'}, Zone {c.zoneNo || '-'}, St {c.streetNo || '-'}</span>
                        ) : '—'}
                        {c.zoneName && <span className="text-slate-500"> ({c.zoneName})</span>}
                      </div>
                      {c.addressExtra && (
                        <div className="text-[11px] text-indigo-600 mt-0.5">{c.addressExtra}</div>
                      )}
                      {c.mapLink && (
                        <a
                          href={c.mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:underline mt-0.5 font-medium"
                        >
                          <MapPin className="w-3 h-3" /> Map Link
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[180px] truncate">{c.note || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
                          title="Edit Customer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Customer ${c.name} (${c.mobile}) মুছে ফেলবেন? পুরনো অর্ডার অক্ষত থাকবে।`)) {
                              onDeleteCustomer(c.mobile);
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              {isEdit ? 'কাস্টমার এডিট করুন' : 'নতুন কাস্টমার যোগ করুন'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ahmed Al-Thani"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number (Key) *</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    disabled={isEdit}
                    placeholder="+974 55123456"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="+974 55123456"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Building No</label>
                  <input
                    type="text"
                    value={buildingNo}
                    onChange={e => setBuildingNo(e.target.value)}
                    placeholder="12"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Zone No</label>
                  <input
                    type="text"
                    value={zoneNo}
                    onChange={e => setZoneNo(e.target.value)}
                    placeholder="50"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Street No</label>
                  <input
                    type="text"
                    value={streetNo}
                    onChange={e => setStreetNo(e.target.value)}
                    placeholder="123"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Area / Zone Name</label>
                  <input
                    type="text"
                    value={zoneName}
                    onChange={e => setZoneName(e.target.value)}
                    placeholder="Doha"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Additional Address Info</label>
                  <input
                    type="text"
                    value={addressExtra}
                    onChange={e => setAddressExtra(e.target.value)}
                    placeholder="Flat 4B, Opposite Family Mart"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Google Maps Link</label>
                  <input
                    type="url"
                    value={mapLink}
                    onChange={e => setMapLink(e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    placeholder="কাস্টমারের পছন্দ বা নির্দেশনা..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">Bulk Customer CSV Import</h3>
            <p className="text-xs text-slate-500">
              CSV ফরম্যাট: Mobile, Name, WhatsApp, Building No, Zone No, Street No, Zone Name, Address Extra, Map Link, Note
            </p>

            <textarea
              value={bulkCsvText}
              onChange={e => setBulkCsvText(e.target.value)}
              rows={8}
              placeholder="Paste CSV here with header line..."
              className="w-full text-xs p-3 font-mono border border-slate-200 rounded-xl outline-none bg-slate-50"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBulkModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleParseCsvImport}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white"
              >
                Start Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
