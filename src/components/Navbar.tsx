import React, { useState } from 'react';
import { UserSession, AppNotification } from '../types';
import { Bell, LogOut, Shield, User, Bike, FileCode, CheckCheck, RefreshCw } from 'lucide-react';

interface NavbarProps {
  session: UserSession;
  onLogout: () => void;
  onSwitchRole: (role: UserSession['role']) => void;
  notifications: AppNotification[];
  onClearNotifications: () => void;
  onOpenGasGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onLogout,
  onSwitchRole,
  notifications,
  onClearNotifications,
  onOpenGasGuide
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const userNotifs = notifications.filter(n =>
    session.role === 'Admin' ? n.target === 'ADMIN' : n.target === `USER:${session.name}`
  );

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg tracking-wider shadow-inner">
            QS
          </div>
          <div>
            <div className="font-bold text-base sm:text-lg tracking-tight leading-none text-white">
              Qatar Shop Manager
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">
              Business Portal &middot; 0-Cost Stack
            </div>
          </div>
        </div>

        {/* Center / Role Indicator */}
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                {session.role === 'Admin' && <Shield className="w-3.5 h-3.5 text-indigo-400" />}
                {session.role === 'Order Entry' && <User className="w-3.5 h-3.5 text-emerald-400" />}
                {session.role === 'Driver' && <Bike className="w-3.5 h-3.5 text-amber-400" />}
                <span className="font-semibold text-white">{session.name}</span>
                <span className="text-slate-400">({session.role})</span>
              </span>
              <RefreshCw className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1 z-50 text-xs">
                <div className="px-3 py-1.5 text-slate-400 font-medium uppercase tracking-wider text-[10px] border-b border-slate-700">
                  Switch Active Role (Testing)
                </div>
                <button
                  onClick={() => { onSwitchRole('Admin'); setShowRoleSwitcher(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-2 text-slate-200"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Admin Manager</span>
                </button>
                <button
                  onClick={() => { onSwitchRole('Order Entry'); setShowRoleSwitcher(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-2 text-slate-200"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Order Entry (Fatima)</span>
                </button>
                <button
                  onClick={() => { onSwitchRole('Driver'); setShowRoleSwitcher(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-2 text-slate-200"
                >
                  <Bike className="w-3.5 h-3.5 text-amber-400" />
                  <span>Driver (Rahim Khan)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* GAS Deployment Button */}
          <button
            onClick={onOpenGasGuide}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title="Google Apps Script Source Code & 0-Cost Deployment"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Google Apps Script Hub</span>
            <span className="sm:hidden">GAS</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifs(!showNotifs);
                if (!showNotifs && userNotifs.length > 0) {
                  onClearNotifications();
                }
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {userNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                  {userNotifs.length}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-2">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-indigo-400" /> Notifications
                  </div>
                  <button
                    onClick={() => { onClearNotifications(); setShowNotifs(false); }}
                    className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Clear
                  </button>
                </div>
                {userNotifs.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    কোনো নতুন notification নেই
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {userNotifs.map(n => (
                      <div key={n.id} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60">
                        <div className="font-semibold text-slate-200">{n.title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">{n.time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
