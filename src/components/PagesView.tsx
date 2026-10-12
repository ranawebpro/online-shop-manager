import React, { useState } from 'react';
import { BusinessPage } from '../types';
import { Share2, Plus, Edit, Globe, Phone, MapPin } from 'lucide-react';

interface PagesViewProps {
  pages: BusinessPage[];
  onSavePage: (page: BusinessPage, isNew: boolean) => { success: boolean; message: string };
  onTogglePageStatus: (code: string, status: 'Active' | 'Inactive') => void;
}

export const PagesView: React.FC<PagesViewProps> = ({
  pages,
  onSavePage,
  onTogglePageStatus
}) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [facebook, setFacebook] = useState<string>('');
  const [instagram, setInstagram] = useState<string>('');
  const [tiktok, setTiktok] = useState<string>('');
  const [other, setOther] = useState<string>('');

  const handleOpenAdd = () => {
    setEditingCode(null);
    setCode('');
    setName('');
    setMobile('');
    setAddress('');
    setFacebook('');
    setInstagram('');
    setTiktok('');
    setOther('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: BusinessPage) => {
    setEditingCode(p.code);
    setCode(p.code);
    setName(p.name);
    setMobile(p.mobile || '');
    setAddress(p.address || '');
    setFacebook(p.facebook || '');
    setInstagram(p.instagram || '');
    setTiktok(p.tiktok || '');
    setOther(p.other || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      alert('Page Code এবং Page Name আবশ্যক!');
      return;
    }

    const payload: BusinessPage = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      facebook: facebook.trim(),
      instagram: instagram.trim(),
      tiktok: tiktok.trim(),
      other: other.trim(),
      status: 'Active'
    };

    const res = onSavePage(payload, !editingCode);
    alert(res.message);
    if (res.success) setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-pink-600" />
            <h2 className="text-base font-bold text-slate-800">Business Pages Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            এখানকার তথ্য প্রিন্ট করা Invoice-এর উপরে বামপাশে দেখায় এবং Order Form-এর Page তালিকা এখান থেকেই নিয়ন্ত্রিত হয়।
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Page
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map(p => (
          <div
            key={p.code}
            className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden ${
              p.status === 'Inactive' ? 'opacity-60 bg-slate-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                {p.code}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {p.status}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
              {p.mobile && (
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-mono">
                  <Phone className="w-3 h-3 text-indigo-500" /> {p.mobile}
                </div>
              )}
              {p.address && (
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-red-400" /> {p.address}
                </div>
              )}
            </div>

            {/* Social handles */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 text-slate-600">
              {p.facebook && <div><b>FB:</b> {p.facebook}</div>}
              {p.instagram && <div><b>IG:</b> {p.instagram}</div>}
              {p.tiktok && <div><b>TikTok:</b> {p.tiktok}</div>}
              {p.other && <div><b>Other:</b> {p.other}</div>}
              {!p.facebook && !p.instagram && !p.tiktok && !p.other && (
                <div className="text-slate-400 text-[11px]">কোনো সোশ্যাল হ্যান্ডেল নেই</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleOpenEdit(p)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                title="Edit Page"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              {p.status === 'Active' ? (
                <button
                  onClick={() => onTogglePageStatus(p.code, 'Inactive')}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => onTogglePageStatus(p.code, 'Active')}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Page Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">
              {editingCode ? `Edit Page: ${editingCode}` : 'নতুন Business Page যোগ করুন'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Code *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    disabled={!!editingCode}
                    placeholder="NS"
                    maxLength={6}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase font-bold outline-none disabled:bg-slate-100"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Page Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nasmath Qatar Online"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="+974 50012345"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Souq Waqif, Doha"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Facebook Handle</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={e => setFacebook(e.target.value)}
                    placeholder="nasmath.qatar"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Instagram Handle</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    placeholder="@nasmath_qa"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">TikTok Handle</label>
                  <input
                    type="text"
                    value={tiktok}
                    onChange={e => setTiktok(e.target.value)}
                    placeholder="@nasmathqatar"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Other / Website</label>
                  <input
                    type="text"
                    value={other}
                    onChange={e => setOther(e.target.value)}
                    placeholder="www.nasmath.com"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

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
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-pink-600 hover:bg-pink-500 text-white"
                >
                  Save Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
