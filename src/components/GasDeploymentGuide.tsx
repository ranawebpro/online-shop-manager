import React, { useState } from 'react';
import { Copy, Check, FileCode, ExternalLink, ShieldCheck, Database, HelpCircle, Terminal } from 'lucide-react';
import { getGasUrl, setGasUrl } from '../services/storage';

interface GasDeploymentGuideProps {
  onClose: () => void;
}

export const GasDeploymentGuide: React.FC<GasDeploymentGuideProps> = ({ onClose }) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'code_gs' | 'index_html'>('guide');
  const [gasUrlInput, setGasUrlInput] = useState<string>(getGasUrl());
  const [savedUrlMsg, setSavedUrlMsg] = useState<string>('');

  const handleCopyCodeGs = async () => {
    try {
      const res = await fetch('/gas/Code.gs');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      alert('Code.gs কপি করা যায়নি। ফাইলটি /gas/Code.gs থেকে কপি করুন।');
    }
  };

  const handleCopyIndexHtml = async () => {
    try {
      const res = await fetch('/gas/Index.html');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch {
      alert('Index.html কপি করা যায়নি। ফাইলটি /gas/Index.html থেকে কপি করুন।');
    }
  };

  const handleSaveGasUrl = () => {
    setGasUrl(gasUrlInput);
    setSavedUrlMsg('✓ Google Apps Script Web App URL সেভ করা হয়েছে!');
    setTimeout(() => setSavedUrlMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold">Google Apps Script Source &amp; 0-Cost Deployment</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              বিনা খরচে Google Sheets ডাটাবেজ এবং Apps Script দিয়ে হোস্ট করার সম্পূর্ণ নির্দেশিকা।
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
          >
            Close
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 text-xs font-semibold gap-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === 'guide' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Deployment Guide (পদক্ষেপসমূহ)
          </button>
          <button
            onClick={() => setActiveTab('code_gs')}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === 'code_gs' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Code.gs (Backend Script)
          </button>
          <button
            onClick={() => setActiveTab('index_html')}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === 'index_html' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Index.html (Frontend Template)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Optional GAS URL Bridge */}
              <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                  <ExternalLink className="w-4 h-4 text-indigo-600" />
                  Live Google Apps Script Web App কানেক্টর (Optional)
                </div>
                <p className="text-indigo-800 text-xs">
                  আপনার ডিপ্লয় করা Apps Script Web App URL এখানে পেস্ট করলে এই ওয়েব অ্যাপটি সরাসরি আপনার Google Sheet-এর সাথে সিঙ্ক হতে পারবে।
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={gasUrlInput}
                    onChange={e => setGasUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3 py-2 text-xs border border-indigo-200 rounded-xl bg-white font-mono outline-none"
                  />
                  <button
                    onClick={handleSaveGasUrl}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                  >
                    Save URL
                  </button>
                </div>
                {savedUrlMsg && <div className="text-emerald-700 font-semibold">{savedUrlMsg}</div>}
              </div>

              {/* Step by Step Manual */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  Google Apps Script-এ বিনামূল্যে সেটআপের ১০টি সহজ ধাপ:
                </h3>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900">ধাপ ১: নতুন Google Spreadsheet তৈরি করুন</div>
                    <p className="text-slate-600 mt-0.5">
                      আপনার ব্রাউজারে <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">sheets.new</a> ওপেন করুন এবং ফাইলের নাম দিন <b>"Qatar Shop Manager DB"</b>।
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900">ধাপ ২: Apps Script Editor খুলুন</div>
                    <p className="text-slate-600 mt-0.5">
                      স্প্রেডশীটের উপরের মেন্যু থেকে <b>Extensions &rarr; Apps Script</b>-এ ক্লিক করুন।
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900">ধাপ ৩: Code.gs পেস্ট করুন</div>
                    <p className="text-slate-600 mt-0.5">
                      ডিফল্ট <code>Code.gs</code> ফাইলে যা আছে তা মুছে দিন এবং নিচের <b>"Copy Code.gs"</b> বাটনে চাপ দিয়ে সম্পূর্ণ কোড পেস্ট করুন।
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={handleCopyCodeGs}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? 'Copied Code.gs!' : 'Copy Code.gs (সম্পূর্ণ ব্যাকএন্ড)'}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900">ধাপ ৪: Index.html ফাইল তৈরি করুন</div>
                    <p className="text-slate-600 mt-0.5">
                      Apps Script এ বাম পাশের <b>Files (+)</b> আইকনে ক্লিক করে <b>HTML</b> সিলেক্ট করুন এবং ফাইলের নাম দিন <b>Index</b> (এটি <code>Index.html</code> হিসেবে সেভ হবে)।
                      নিচের বাটনে চাপ দিয়ে সম্পূর্ণ এইচটিএমএল কোড পেস্ট করুন।
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={handleCopyIndexHtml}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                      >
                        {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedHtml ? 'Copied Index.html!' : 'Copy Index.html (সম্পূর্ণ ফ্রন্টএন্ড)'}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900">ধাপ ৫: Admin Password সেট করুন (Script Properties)</div>
                    <p className="text-slate-600 mt-0.5">
                      বাম পাশের সেটিংস আইকন <b>(Project Settings &rarr; Gear icon)</b>-এ যান। নিচে স্ক্রোল করে <b>Script Properties &rarr; Add script property</b> তে ক্লিক করুন:
                      <br />&bull; Property: <code>ADMIN_PASSWORD</code>
                      <br />&bull; Value: আপনার পছন্দের শক্তিশালী পাসওয়ার্ড (ডিফল্ট: <code>admin123</code>)
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900">ধাপ ৬: প্রথমবার Permission অনুমোদন করুন</div>
                    <p className="text-slate-600 mt-0.5">
                      এডিটরে <code>Code.gs</code> সিলেক্ট করে উপরের ড্রপডাউন থেকে <code>doGet</code> সিলেক্ট করুন এবং <b>Run</b> বাটনে ক্লিক করুন। গুগল একাউন্ট সিলেক্ট করে "Advanced &rarr; Go to Qatar Shop Manager &rarr; Allow" দিন।
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900">ধাপ ৭: Web App হিসেবে Deploy করুন</div>
                    <p className="text-slate-600 mt-0.5">
                      উপরের ডান কোণে <b>Deploy &rarr; New deployment</b>-এ ক্লিক করুন:
                      <br />&bull; Select type: <b>Web app</b>
                      <br />&bull; Execute as: <b>Me (your email)</b>
                      <br />&bull; Who has access: <b>Anyone</b> (সবার জন্য ওপেন হলেও সিস্টেমে মোবাইল পিন ও এডমিন পাসওয়ার্ড অথেনটিকেশন কঠোরভাবে নিয়ন্ত্রিত)
                      <br />&bull; <b>Deploy</b> বাটনে চাপুন।
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900">ধাপ ৮: লাইভ ওয়েব লিঙ্ক ব্যবহার শুরু করুন</div>
                    <p className="text-slate-600 mt-0.5">
                      ডিপ্লয়মেন্ট সম্পন্ন হলে আপনি একটি <b>Web app URL</b> পাবেন (যেমন: <code>https://script.google.com/macros/s/.../exec</code>)। এটি মোবাইল বা কম্পিউটারে বুকমার্ক করে সরাসরি শপ পরিচালনা করতে পারবেন!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code_gs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Code.gs Source File</span>
                <button
                  onClick={handleCopyCodeGs}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied!' : 'Copy Code.gs'}
                </button>
              </div>
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] max-h-96 overflow-y-auto whitespace-pre">
                {`// Code.gs is safely saved in /gas/Code.gs\n// Includes durable session caching, 40-column safety, batch locking, and stock deduplication.`}
              </div>
            </div>
          )}

          {activeTab === 'index_html' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Index.html Standalone Template</span>
                <button
                  onClick={handleCopyIndexHtml}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold flex items-center gap-1.5"
                >
                  {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedHtml ? 'Copied!' : 'Copy Index.html'}
                </button>
              </div>
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] max-h-96 overflow-y-auto whitespace-pre">
                {`// Index.html is safely saved in /gas/Index.html\n// Complete mobile-responsive Bootstrap 5 interface with Bengali labels, SweetAlert2, and A4 invoice layouts.`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
