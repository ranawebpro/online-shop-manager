// ==================== SETTINGS (এখানে আপনার তথ্য দিন) ====================
// Page এর তথ্য এখন "Pages" ট্যাব থেকে আসে। নিচের SHOP_INFO শুধু fallback (Page না পেলে)
var SHOP_INFO = {
  name: 'Qatar Online Shop',
  phone: '',
  address: 'Doha, Qatar',
  footer: 'Thanks For Shopping With Us!'
};
// Session settings are defined in the AUTH / SESSION section below.
var EMP_SHEET = 'Employees';
var ROLES = ['Admin', 'Order Entry', 'Driver'];
var STATUSES = ['Delivered', 'Pending', 'Return', 'Exchange'];
var NOTIF_SHEET = 'Notifications';
var ORDER_COLS = 40;

var EXPENSE_SHEET = 'ExpenseLog';
var EXPCAT_SHEET = 'ExpenseCategories';
var DEFAULT_EXPENSE_CATEGORIES = [
  'Product Transport (Market → Shop)',
  'Packaging Materials',
  'Food / Snacks (নাস্তা)',
  'Office Supplies (Invoice pad, Paper, Pen, Elastic, Files)',
  'Shop Rent',
  'Electricity Bill',
  'Warehouse Rent',
  'Employee Salary',
  'TA/DA (Transport Allowance)',
  'Employee Home Allowance',
  'Employee Food Allowance',
  'Marketing / Ads',
  'Internet / Phone Bill',
  'Maintenance / Repair',
  'Other'
];

// ==================== WEB APP ENTRY POINT ====================
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Qatar Shop Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== HELPERS ====================
function getDb() { return SpreadsheetApp.getActiveSpreadsheet(); }

function _getSheet_(name) {
  var sh = getDb().getSheetByName(name);
  if (!sh) throw new Error('Sheet not found: ' + name);
  return sh;
}

function _getOrCreateSheet_(name, headers) {
  var ss = getDb();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers && headers.length) sh.appendRow(headers);
  } else if (sh.getLastRow() === 0 && headers && headers.length) {
    sh.appendRow(headers);
  }
  return sh;
}

function _ensureSize_(sh, rows, cols) {
  if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows());
  if (sh.getMaxColumns() < cols) sh.insertColumnsAfter(sh.getMaxColumns(), cols - sh.getMaxColumns());
}

// নির্দিষ্ট cell গুলো text format করে (ফোন/নোট/তারিখ যেন formula বা date না হয়ে যায়)
function _setText_(sh, r, cols) {
  var a = cols.map(function (c) { return sh.getRange(r, c).getA1Notation(); });
  sh.getRangeList(a).setNumberFormat('@');
}

function _tz_() { return Session.getScriptTimeZone(); }
function _todayKey_() { return Utilities.formatDate(new Date(), _tz_(), 'yyyy-MM-dd'); }
function _nowStr_() { return Utilities.formatDate(new Date(), _tz_(), 'dd/MM/yyyy hh:mm a'); }
function _r2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function _m2_(n) { return (Number(n) || 0).toFixed(2); }
function _safe_(row, idx) { return (row.length > idx) ? row[idx] : ''; }
function _h_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _dateKey_(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : Utilities.formatDate(v, _tz_(), 'yyyy-MM-dd');
  var s = String(v).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}
function _orderDateKey_(row) { return _dateKey_(_safe_(row, 27)) || _dateKey_(row[1]); }
function _fmtDateTime_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, _tz_(), 'dd/MM/yyyy hh:mm a');
  return String(v || '');
}
function _groupKey_(k, groupBy) {
  if (groupBy === 'month') return k.substring(0, 7);
  if (groupBy === 'year') return k.substring(0, 4);
  return k;
}

// ফোন নম্বর: "+974 55551234" ফরম্যাটে রাখা হয়। শুধু ৮ ডিজিট দিলে Qatar ধরা হয়
function _cleanIntlPhone_(s) {
  s = String(s || '').trim();
  if (/^\d{8}$/.test(s)) return '+974 ' + s;
  var m = s.match(/^\+(\d{1,4})[\s-]*(\d[\d\s-]{3,16})$/);
  if (!m) return '';
  var cc = m[1], num = m[2].replace(/\D/g, '');
  if (cc === '974' && num.length !== 8) return '';
  if (num.length < 5 || num.length > 14) return '';
  return '+' + cc + ' ' + num;
}

// ==================== AUTH / SESSION ====================
function _adminPassword_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || 'admin123';
}
function _normPhone_(p) {
  var d = String(p || '').replace(/\D/g, '');
  if (d.length > 8) d = d.slice(-8);
  return d;
}

// Session storage: CacheService is primary fast store, Script Properties is durable backup.
var SESSION_PREFIX = 'QSM_SESSION_';
var SESSION_SECONDS = 6 * 60 * 60;

function _sessionKey_(token) { return SESSION_PREFIX + String(token || '').trim(); }

function _makeSession_(user) {
  var token = Utilities.getUuid();
  var raw = JSON.stringify({ user: user, createdAt: Date.now(), expiresAt: Date.now() + SESSION_SECONDS * 1000 });
  var cache = CacheService.getScriptCache();
  try { cache.put('S_' + token, JSON.stringify(user), SESSION_SECONDS); } catch (e) {}
  try { PropertiesService.getScriptProperties().setProperty(_sessionKey_(token), raw); } catch (e2) {}
  return token;
}

function _auth_(token, roles) {
  token = String(token || '').trim();
  if (!token) throw new Error('SESSION_EXPIRED');

  var user = null;
  var cache = CacheService.getScriptCache();

  try {
    var raw = cache.get('S_' + token);
    if (raw) user = JSON.parse(raw);
  } catch (e) {}

  if (!user) {
    try {
      var raw2 = PropertiesService.getScriptProperties().getProperty(_sessionKey_(token));
      if (raw2) {
        var s = JSON.parse(raw2);
        if (!s || !s.user || Number(s.expiresAt) <= Date.now()) {
          try { PropertiesService.getScriptProperties().deleteProperty(_sessionKey_(token)); } catch (ignore) {}
          throw new Error('SESSION_EXPIRED');
        }
        user = s.user;
        try { cache.put('S_' + token, JSON.stringify(user), SESSION_SECONDS); } catch (ignore2) {}
        try {
          s.expiresAt = Date.now() + SESSION_SECONDS * 1000;
          PropertiesService.getScriptProperties().setProperty(_sessionKey_(token), JSON.stringify(s));
        } catch (ignore3) {}
      }
    } catch (e2) {
      if (String(e2.message || e2) === 'SESSION_EXPIRED') throw e2;
    }
  }

  if (!user) throw new Error('SESSION_EXPIRED');
  if (roles && roles.indexOf(user.role) === -1) throw new Error('আপনার এই কাজের অনুমতি নেই');
  return user;
}

function loginWithPassword(password) {
  if (String(password || '') !== _adminPassword_()) return { success: false, message: 'ভুল অ্যাডমিন পাসওয়ার্ড!' };
  var user = { name: 'Admin', phone: '', role: 'Admin', zone: '' };
  return { success: true, token: _makeSession_(user), user: user };
}

function loginEmployee(phone, pin) {
  var p = _normPhone_(phone);
  pin = String(pin == null ? '' : pin).trim();
  if (!p || !pin) return { success: false, message: 'মোবাইল নম্বর ও পিন দিন' };

  var list = _employeesAll_();
  for (var i = 0; i < list.length; i++) {
    var e = list[i];
    if (_normPhone_(e.phone) === p && String(e.pin == null ? '' : e.pin).trim() === pin) {
      if (String(e.status || '').trim().toLowerCase() !== 'active') {
        return { success: false, message: 'একাউন্ট ইনঅ্যাক্টিভ! Admin থেকে Active করুন।' };
      }
      var user = { name: e.name, phone: e.phone, role: e.role, zone: e.zone };
      try {
        var token = _makeSession_(user);
        return { success: true, token: token, user: user };
      } catch (sessionErr) {
        return { success: false, message: 'Login session তৈরি করা যায়নি। আবার চেষ্টা করুন।' };
      }
    }
  }
  return { success: false, message: 'মোবাইল নম্বর বা পিন সঠিক নয়!' };
}

function resumeSession(token) {
  try { return { success: true, user: _auth_(token) }; }
  catch (e) { return { success: false, message: 'SESSION_EXPIRED' }; }
}

function serverLogout(token) {
  token = String(token || '').trim();
  if (!token) return true;
  try { CacheService.getScriptCache().remove('S_' + token); } catch (e) {}
  try { PropertiesService.getScriptProperties().deleteProperty(_sessionKey_(token)); } catch (e2) {}
  return true;
}

// ==================== NOTIFICATIONS ====================
function _notifSheet_() {
  var ss = getDb();
  var sh = ss.getSheetByName(NOTIF_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(NOTIF_SHEET);
  sh.appendRow(['ID', 'Time', 'Target', 'Type', 'Title', 'Message', 'OrderID']);
  sh.getRange('B:B').setNumberFormat('@');
  return sh;
}

function _notifMax_() {
  var cache = CacheService.getScriptCache();
  var c = cache.get('NOTIF_MAX');
  if (c !== null) return Number(c) || 0;
  var sh = _notifSheet_();
  var n = sh.getLastRow();
  var max = n >= 2 ? (Number(sh.getRange(n, 1).getValue()) || 0) : 0;
  cache.put('NOTIF_MAX', String(max), 21600);
  return max;
}

function _pushNotif_(target, type, title, message, orderId) {
  try {
    var sh = _notifSheet_();
    var cache = CacheService.getScriptCache();
    var id = Math.max(Date.now(), _notifMax_() + 1);
    var r = sh.getLastRow() + 1;
    _ensureSize_(sh, r, 7);
    sh.getRange(r, 2).setNumberFormat('@');
    sh.getRange(r, 1, 1, 7).setValues([[id, _nowStr_(), target, type, title, message, orderId || '']]);
    cache.put('NOTIF_MAX', String(id), 21600);
    if (r > 700) sh.deleteRows(2, 300);
  } catch (e) {}
}
function _notifyDriver_(driver, type, title, message, orderId) {
  if (driver) _pushNotif_('USER:' + driver, type, title, message, orderId);
}
function _notifyAdmin_(type, title, message, orderId) {
  _pushNotif_('ADMIN', type, title, message, orderId);
}
function _notifMine_(u, target) {
  target = String(target || '');
  return u.role === 'Admin' ? target === 'ADMIN' : target === 'USER:' + u.name;
}
function _notifObj_(r) {
  return { id: Number(r[0]), time: String(r[1] || ''), type: String(r[3] || ''), title: String(r[4] || ''), message: String(r[5] || ''), orderId: String(r[6] || '') };
}

function getRecentNotifications(token) {
  var u = _auth_(token);
  var sh = _notifSheet_();
  var n = sh.getLastRow();
  var items = [];
  if (n >= 2) {
    var start = Math.max(2, n - 199);
    var v = sh.getRange(start, 1, n - start + 1, 7).getValues();
    for (var i = v.length - 1; i >= 0 && items.length < 30; i--) {
      if (_notifMine_(u, v[i][2])) items.push(_notifObj_(v[i]));
    }
  }
  return { items: items, maxId: _notifMax_() };
}

function pollNotifications(token, lastId) {
  var u = _auth_(token);
  lastId = Number(lastId) || 0;
  var max = _notifMax_();
  if (lastId >= max) return { items: [], maxId: max };
  var sh = _notifSheet_();
  var n = sh.getLastRow();
  var items = [];
  if (n >= 2) {
    var start = Math.max(2, n - 99);
    var v = sh.getRange(start, 1, n - start + 1, 7).getValues();
    for (var i = 0; i < v.length; i++) {
      if (Number(v[i][0]) > lastId && _notifMine_(u, v[i][2])) items.push(_notifObj_(v[i]));
    }
  }
  return { items: items, maxId: max };
}

function deleteMyNotifications(token) {
  var u = _auth_(token);
  var sh = _notifSheet_();
  var n = sh.getLastRow();
  if (n < 2) return { success:true, deleted:0 };
  var v = sh.getRange(2,1,n-1,7).getValues();
  var rowsToDelete = [];
  for (var i = 0; i < v.length; i++) {
    if (_notifMine_(u, v[i][2])) rowsToDelete.push(i + 2);
  }
  for (var j = rowsToDelete.length - 1; j >= 0; j--) sh.deleteRow(rowsToDelete[j]);
  return { success:true, deleted:rowsToDelete.length };
}

// ==================== EMPLOYEES ====================
function _empSheet_() {
  var ss = getDb();
  var sh = ss.getSheetByName(EMP_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(EMP_SHEET);
  sh.appendRow(['Name', 'Phone', 'PIN', 'Role', 'Zone', 'Status']);
  sh.getRange('B:C').setNumberFormat('@');
  return sh;
}

function _employeesAll_() {
  var sh = _empSheet_();
  var n = sh.getLastRow();
  if (n < 2) return [];
  var v = sh.getRange(2, 1, n - 1, 6).getValues();
  var list = [];
  v.forEach(function (r, i) {
    var name = String(r[0] || '').trim();
    if (!name) return;
    list.push({
      row: i + 2,
      name: name,
      phone: String(r[1] || '').trim(),
      pin: String(r[2] || '').trim(),
      role: String(r[3] || 'Driver').trim() || 'Driver',
      zone: String(r[4] || '').trim(),
      status: String(r[5] || 'Active').trim() || 'Active'
    });
  });
  return list;
}
function _pubEmp_(e) { return { name: e.name, phone: e.phone, role: e.role, zone: e.zone, status: e.status }; }
function _driversActive_() {
  return _employeesAll_().filter(function (e) {
    return e.role === 'Driver' && e.status.toLowerCase() === 'active';
  });
}

function getEmployees(token) {
  _auth_(token, ['Admin']);
  var zones = _zonesAll_().map(function (z) { return z.name; });
  return { employees: _employeesAll_().map(_pubEmp_), zones: zones };
}

function getDriversZones(token) {
  _auth_(token, ['Admin']);
  return {
    zones: _zonesAll_(),
    drivers: _employeesAll_().filter(function (e) { return e.role === 'Driver'; }).map(_pubEmp_)
  };
}

function _renameDriverInOrders_(oldName, newName) {
  var sh = _getSheet_('Orders');
  var n = sh.getLastRow();
  if (n < 2) return;
  var rng = sh.getRange(2, 12, n - 1, 1);
  var v = rng.getValues();
  var changed = false;
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][0]) === oldName) { v[i][0] = newName; changed = true; }
  }
  if (changed) rng.setValues(v);
}

function saveEmployee(token, emp, origPhone) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    emp = emp || {};
    var name = String(emp.name || '').trim();
    var phone = _normPhone_(emp.phone);
    var pin = String(emp.pin || '').trim();
    var role = String(emp.role || '').trim();
    var zone = String(emp.zone || '').trim();
    var isNew = !origPhone;
    var origKey = _normPhone_(origPhone);

    if (!name) return { success: false, message: 'নাম দিন' };
    if (phone.length !== 8) return { success: false, message: 'মোবাইল নম্বর ৮ ডিজিটের হতে হবে (Qatar)' };
    if (ROLES.indexOf(role) === -1) return { success: false, message: 'Designation নির্বাচন করুন' };
    if (isNew && !/^\d{4,6}$/.test(pin)) return { success: false, message: 'পিন ৪-৬ ডিজিটের সংখ্যা হতে হবে' };
    if (!isNew && pin && !/^\d{4,6}$/.test(pin)) return { success: false, message: 'পিন ৪-৬ ডিজিটের সংখ্যা হতে হবে' };

    var list = _employeesAll_();
    var target = null;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var key = _normPhone_(e.phone);
      if (!isNew && key === origKey) { target = e; continue; }
      if (key === phone) return { success: false, message: 'এই মোবাইল নম্বর আগে থেকেই আছে' };
      if (e.name.toLowerCase() === name.toLowerCase()) return { success: false, message: 'এই নামে আগে থেকেই employee আছে' };
    }

    var sh = _empSheet_();
    if (isNew) {
      var r = sh.getLastRow() + 1;
      _ensureSize_(sh, r, 6);
      sh.getRange(r, 2, 1, 2).setNumberFormat('@');
      sh.getRange(r, 1, 1, 6).setValues([[name, phone, pin, role, zone, 'Active']]);
      return { success: true, message: 'Employee add হয়েছে' };
    }

    if (!target) return { success: false, message: 'Employee পাওয়া যায়নি' };
    var row = target.row;
    sh.getRange(row, 2, 1, 2).setNumberFormat('@');
    sh.getRange(row, 1, 1, 2).setValues([[name, phone]]);
    if (pin) sh.getRange(row, 3).setValue(pin);
    sh.getRange(row, 4, 1, 2).setValues([[role, zone]]);
    if (target.name !== name) _renameDriverInOrders_(target.name, name);
    return { success: true, message: 'Employee update হয়েছে' };
  } finally {
    lock.releaseLock();
  }
}

function setEmployeeStatus(token, phone, makeActive) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var key = _normPhone_(phone);
    var list = _employeesAll_();
    for (var i = 0; i < list.length; i++) {
      if (_normPhone_(list[i].phone) === key) {
        _empSheet_().getRange(list[i].row, 6).setValue(makeActive ? 'Active' : 'Inactive');
        return { success: true, message: makeActive ? 'Employee restore হয়েছে' : 'Employee deactivate হয়েছে' };
      }
    }
    return { success: false, message: 'Employee পাওয়া যায়নি' };
  } finally {
    lock.releaseLock();
  }
}

// ==================== PAGES ====================
var PAGES_SHEET = 'Pages';
var PAGE_HEADERS = ['Code', 'PageName', 'Mobile', 'Address', 'Facebook', 'Instagram', 'TikTok', 'Other', 'Status'];
var DEFAULT_PAGES = ['NS', 'CZ', 'DPW'];

function _pagesSheet_() {
  var ss = getDb();
  var sh = ss.getSheetByName(PAGES_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(PAGES_SHEET);
  sh.appendRow(PAGE_HEADERS);
  sh.getRange('A:H').setNumberFormat('@');
  var rows = DEFAULT_PAGES.map(function (c) { return [c, c, '', '', '', '', '', '', 'Active']; });
  sh.getRange(2, 1, rows.length, 9).setValues(rows);
  return sh;
}

function _pagesAll_() {
  var sh = _pagesSheet_();
  var n = sh.getLastRow();
  if (n < 2) return [];
  _ensureSize_(sh, n, 9);
  var v = sh.getRange(2, 1, n - 1, 9).getValues();
  var list = [];
  v.forEach(function (r) {
    var code = String(r[0] || '').trim().toUpperCase();
    if (!code) return;
    list.push({
      code: code,
      name: String(r[1] || '').trim() || code,
      mobile: String(r[2] || '').trim(),
      address: String(r[3] || '').trim(),
      facebook: String(r[4] || '').trim(),
      instagram: String(r[5] || '').trim(),
      tiktok: String(r[6] || '').trim(),
      other: String(r[7] || '').trim(),
      status: String(r[8] || 'Active').trim() || 'Active'
    });
  });
  return list;
}
function _pagesActive_() {
  return _pagesAll_().filter(function (p) { return p.status.toLowerCase() === 'active'; });
}
function _pagesMap_() {
  var m = {};
  _pagesAll_().forEach(function (p) { m[p.code] = p; });
  return m;
}
function _findPageRow_(code) {
  var sh = _pagesSheet_();
  code = String(code || '').trim().toUpperCase();
  var n = sh.getLastRow();
  if (n < 2) return -1;
  var v = sh.getRange(2, 1, n - 1, 1).getValues();
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][0] || '').trim().toUpperCase() === code) return i + 2;
  }
  return -1;
}

function getPages(token) {
  _auth_(token, ['Admin']);
  return _pagesAll_();
}

function savePage(token, page, origCode) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    page = page || {};
    var isNew = !origCode;
    var code = isNew ? String(page.code || '').trim().toUpperCase() : String(origCode).trim().toUpperCase();
    var name = String(page.name || '').trim();
    if (!/^[A-Z0-9]{2,6}$/.test(code)) return { success: false, message: 'Page code ২-৬ অক্ষরের হতে হবে (A-Z, 0-9)' };
    if (!name) return { success: false, message: 'Page এর নাম দিন' };

    function clean(v) { return String(v || '').trim().substring(0, 200); }
    var vals = [name.substring(0, 100), clean(page.mobile), clean(page.address), clean(page.facebook),
                clean(page.instagram), clean(page.tiktok), clean(page.other)];

    var sh = _pagesSheet_();
    var row = _findPageRow_(code);
    if (isNew) {
      if (row !== -1) return { success: false, message: 'এই Page code আগে থেকেই আছে: ' + code };
      var r = sh.getLastRow() + 1;
      _ensureSize_(sh, r, 9);
      sh.getRange(r, 1, 1, 8).setNumberFormat('@');
      sh.getRange(r, 1, 1, 9).setValues([[code].concat(vals, ['Active'])]);
      return { success: true, message: 'Page যোগ হয়েছে' };
    }
    if (row === -1) return { success: false, message: 'Page পাওয়া যায়নি: ' + code };
    sh.getRange(row, 2, 1, 7).setNumberFormat('@');
    sh.getRange(row, 2, 1, 7).setValues([vals]);
    return { success: true, message: 'Page আপডেট হয়েছে' };
  } finally { lock.releaseLock(); }
}

function setPageStatus(token, code, makeActive) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var row = _findPageRow_(code);
    if (row === -1) return { success: false, message: 'Page পাওয়া যায়নি' };
    _pagesSheet_().getRange(row, 9).setValue(makeActive ? 'Active' : 'Inactive');
    return { success: true, message: makeActive ? 'Page restore হয়েছে' : 'Page deactivate হয়েছে' };
  } finally { lock.releaseLock(); }
}

function deletePage(token, code) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var row = _findPageRow_(code);
    if (row === -1) return { success: false, message: 'Page পাওয়া যায়নি' };
    _pagesSheet_().deleteRow(row);
    return { success: true, message: 'Page মুছে ফেলা হয়েছে' };
  } finally { lock.releaseLock(); }
}

// ==================== PRODUCTS ====================
var PRODUCTS_SHEET = 'Products';
var COL_SKU = 1;
var COL_CURRENT_STOCK = 9;

function _normalizeStatus_(s) { s = String(s || '').trim(); return s ? s : 'Active'; }
function _isActive_(s) { return _normalizeStatus_(s).toLowerCase() === 'active'; }

function _ensureProductsHeaderCol_(headerName, startFrom) {
  var sheet = _getSheet_(PRODUCTS_SHEET);
  startFrom = startFrom || 10;
  var maxCols = sheet.getMaxColumns();
  var maxCheck = Math.min(maxCols, 40);
  var headers = sheet.getRange(1, 1, 1, maxCheck).getValues()[0];

  for (var c = 0; c < headers.length; c++) {
    if (String(headers[c]).trim().toLowerCase() === String(headerName).toLowerCase()) return c + 1;
  }
  for (var col = startFrom; col <= maxCheck; col++) {
    var h = String(headers[col - 1] || '').trim();
    if (h === '') { sheet.getRange(1, col).setValue(headerName); return col; }
  }
  sheet.insertColumnAfter(sheet.getMaxColumns());
  var newCol = sheet.getMaxColumns();
  sheet.getRange(1, newCol).setValue(headerName);
  return newCol;
}
function _getProductsStatusCol_() { return _ensureProductsHeaderCol_('Status', 10); }
function _getProductsBundleQtyCol_() { return _ensureProductsHeaderCol_('BundleQty', 10); }
function _getProductsBundlePriceCol_() { return _ensureProductsHeaderCol_('BundlePrice', 10); }

function _findProductRowBySku_(sku) {
  var sheet = _getSheet_(PRODUCTS_SHEET);
  sku = String(sku).trim();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var values = sheet.getRange(2, COL_SKU, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === sku) return i + 2;
  }
  return -1;
}

function _productsAll_() {
  var sheet = _getSheet_(PRODUCTS_SHEET);
  var statusCol = _getProductsStatusCol_();
  var bqCol = _getProductsBundleQtyCol_();
  var bpCol = _getProductsBundlePriceCol_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var base = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var statuses = sheet.getRange(2, statusCol, lastRow - 1, 1).getValues();
  var bqVals = sheet.getRange(2, bqCol, lastRow - 1, 1).getValues();
  var bpVals = sheet.getRange(2, bpCol, lastRow - 1, 1).getValues();

  var list = [];
  for (var i = 0; i < base.length; i++) {
    var row = base[i];
    list.push({
      sku: row[0], name: row[1], category: row[2], variation: row[3],
      buyPrice: row[4], sellPrice: row[5], extraCost: row[6],
      openingStock: row[7], stock: row[8],
      status: _normalizeStatus_(statuses[i][0]),
      bundleQty: Number(bqVals[i][0]) || 0,
      bundlePrice: Number(bpVals[i][0]) || 0
    });
  }
  return list;
}
function _productsActive_() {
  return _productsAll_().filter(function (p) { return _isActive_(p.status); });
}

function _getProductPricingMap_() {
  var all = _productsAll_();
  var map = {};
  for (var i = 0; i < all.length; i++) {
    map[all[i].sku] = {
      name: all[i].name, variation: all[i].variation,
      sellPrice: Number(all[i].sellPrice) || 0,
      buyPrice: Number(all[i].buyPrice) || 0,
      extraCost: Number(all[i].extraCost) || 0,
      bundleQty: Number(all[i].bundleQty) || 0,
      bundlePrice: Number(all[i].bundlePrice) || 0
    };
  }
  return map;
}

function _calcLineTotalWithBundle_(unitPrice, qty, bundleQty, bundlePrice) {
  unitPrice = Number(unitPrice) || 0; qty = Number(qty) || 0;
  bundleQty = Number(bundleQty) || 0; bundlePrice = Number(bundlePrice) || 0;
  if (qty <= 0) return 0;
  if (bundleQty > 0 && bundlePrice > 0) {
    var bundles = Math.floor(qty / bundleQty);
    var rem = qty % bundleQty;
    return bundles * bundlePrice + rem * unitPrice;
  }
  return unitPrice * qty;
}

function getOrderFormData(token) {
  _auth_(token, ['Admin', 'Order Entry']);
  return {
    products: _productsActive_().map(function (p) {
      return { sku: p.sku, name: p.name, category: p.category, variation: p.variation,
               sellPrice: p.sellPrice, stock: p.stock, bundleQty: p.bundleQty, bundlePrice: p.bundlePrice };
    }),
    zones: _zonesActive_(),
    drivers: _driversActive_().map(function (d) { return { name: d.name, zone: d.zone }; }),
    pages: _pagesActive_().map(function (p) { return { code: p.code, name: p.name }; })
  };
}

function getInventoryData(token) {
  _auth_(token, ['Admin']);
  return _productsAll_();
}

// ==================== ZONES ====================
var ZONES_SHEET = 'Zones';
function _ensureZonesSheet_() {
  var sh = _getOrCreateSheet_(ZONES_SHEET, ['Code', 'ZoneName', 'Charge', 'Status', 'AreaNumbers']);
  _ensureSize_(sh, 1, 5);
  if (String(sh.getRange(1, 5).getValue()).trim() === '') {
    sh.getRange(1, 5).setValue('AreaNumbers');
    sh.getRange('E:E').setNumberFormat('@');
  }
  return sh;
}
function _normalizeZoneStatus_(s) { s = String(s || '').trim(); return s ? s : 'Active'; }
function _isZoneActive_(s) { return _normalizeZoneStatus_(s).toLowerCase() === 'active'; }

function _parseAreas_(s) {
  var seen = {}, list = [], bad = [];
  String(s == null ? '' : s).split(/[\s,;]+/).forEach(function (t) {
    t = t.trim();
    if (!t) return;
    var m = t.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) { bad.push(t); return; }
    var a = parseInt(m[1], 10), b = m[2] !== undefined ? parseInt(m[2], 10) : a;
    if (b < a || b - a > 300) { bad.push(t); return; }
    for (var n = a; n <= b; n++) {
      var k = String(n);
      if (!seen[k]) { seen[k] = true; list.push(k); }
    }
  });
  return { list: list, bad: bad };
}

function _zonesAll_() {
  var sh = _ensureZonesSheet_();
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  var values = sh.getRange(2, 1, lastRow - 1, 5).getValues();
  var list = [];
  for (var i = 0; i < values.length; i++) {
    list.push({
      code: String(values[i][0] || '').trim(),
      name: String(values[i][1] || '').trim(),
      charge: Number(values[i][2]) || 0,
      status: _normalizeZoneStatus_(values[i][3]),
      areas: _parseAreas_(values[i][4]).list
    });
  }
  return list.filter(function (z) { return z.code; });
}
function _zonesActive_() {
  return _zonesAll_().filter(function (z) { return _isZoneActive_(z.status); });
}
function _findZoneRowByCode_(code) {
  var sh = _ensureZonesSheet_();
  code = String(code || '').trim().toUpperCase();
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return -1;
  var values = sh.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toUpperCase() === code) return i + 2;
  }
  return -1;
}

function saveZone(token, zone, origCode) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = _ensureZonesSheet_();
    zone = zone || {};
    var code = String(zone.code || '').trim().toUpperCase();
    var name = String(zone.name || '').trim();
    var charge = Number(zone.charge);
    if (!code) return { success: false, message: 'Zone code দিন' };
    if (!name) return { success: false, message: 'Zone name দিন' };
    if (isNaN(charge) || charge < 0) return { success: false, message: 'Charge সঠিক নয়' };

    var parsed = _parseAreas_(zone.areas);
    if (parsed.bad.length) return { success: false, message: 'Address Zone Number সঠিক নয়: ' + parsed.bad.join(', ') + ' (ex: 40, 41, 45-48)' };
    var areasStr = parsed.list.join(', ');

    if (!origCode) {
      if (_findZoneRowByCode_(code) !== -1) return { success: false, message: 'এই code আগে থেকেই আছে: ' + code };
      var r = sh.getLastRow() + 1;
      _ensureSize_(sh, r, 5);
      sh.getRange(r, 5).setNumberFormat('@');
      sh.getRange(r, 1, 1, 5).setValues([[code, name, charge, 'Active', areasStr]]);
      return { success: true, message: 'Zone যোগ হয়েছে' };
    }

    var row = _findZoneRowByCode_(origCode);
    if (row === -1) return { success: false, message: 'Zone পাওয়া যায়নি: ' + origCode };
    var other = _findZoneRowByCode_(code);
    if (other !== -1 && other !== row) return { success: false, message: 'এই code আগে থেকেই আছে: ' + code };
    sh.getRange(row, 1, 1, 3).setValues([[code, name, charge]]);
    sh.getRange(row, 5).setNumberFormat('@');
    sh.getRange(row, 5).setValue(areasStr);
    return { success: true, message: 'Zone আপডেট হয়েছে' };
  } finally { lock.releaseLock(); }
}

function setZoneActiveStatus(token, code, makeActive) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = _ensureZonesSheet_();
    code = String(code || '').trim().toUpperCase();
    var row = _findZoneRowByCode_(code);
    if (row === -1) return { success: false, message: 'Zone not found: ' + code };
    sh.getRange(row, 4).setValue(makeActive ? 'Active' : 'Inactive');
    return { success: true, message: makeActive ? 'Zone restored' : 'Zone deactivated' };
  } finally { lock.releaseLock(); }
}

// ==================== CUSTOMERS ====================
var CUSTOMER_SHEET = 'Customers';
var CUSTOMER_HEADERS = [
  'Mobile', 'Name', 'WhatsApp', 'BuildingNo', 'ZoneNo', 'StreetNo',
  'ZoneName', 'MapLink', 'Note', 'AddressExtra', 'CreatedAt', 'UpdatedAt'
];

function _customerSheet_() {
  var sh = _getOrCreateSheet_(CUSTOMER_SHEET, CUSTOMER_HEADERS);
  _ensureSize_(sh, Math.max(sh.getLastRow(), 1), CUSTOMER_HEADERS.length);
  if (sh.getLastRow() === 1 && String(sh.getRange(1,1).getValue()).trim() === '') {
    sh.getRange(1,1,1,CUSTOMER_HEADERS.length).setValues([CUSTOMER_HEADERS]);
  }
  sh.getRange('A:C').setNumberFormat('@');
  sh.getRange('D:J').setNumberFormat('@');
  return sh;
}
function _customerKey_(phone) {
  var c = _cleanIntlPhone_(phone);
  return c ? c.replace(/\D/g,'') : '';
}

function _customersAll_() {
  var sh = _customerSheet_(), n = sh.getLastRow();
  if (n < 2) return [];
  var v = sh.getRange(2,1,n-1,CUSTOMER_HEADERS.length).getValues();
  var out = [];
  v.forEach(function(r,i) {
    var key = _customerKey_(r[0]);
    if (!key) return;
    out.push({
      row:i+2, mobile:String(r[0]||''), name:String(r[1]||''), whatsapp:String(r[2]||''),
      buildingNo:String(r[3]||''), zoneNo:String(r[4]||''), streetNo:String(r[5]||''),
      zoneName:String(r[6]||''), mapLink:String(r[7]||''), note:String(r[8]||''), addressExtra:String(r[9]||''),
      createdAt:String(r[10]||''), updatedAt:String(r[11]||'')
    });
  });
  return out;
}
function _findCustomerRow_(phone) {
  var key = _customerKey_(phone);
  if (!key) return -1;
  var sh = _customerSheet_(), n = sh.getLastRow();
  if (n < 2) return -1;
  var v = sh.getRange(2,1,n-1,1).getValues();
  for (var i=0;i<v.length;i++) if (_customerKey_(v[i][0]) === key) return i+2;
  return -1;
}
function _pubCustomer_(c) {
  return {
    mobile:c.mobile, name:c.name, whatsapp:c.whatsapp, buildingNo:c.buildingNo, zoneNo:c.zoneNo,
    streetNo:c.streetNo, zoneName:c.zoneName, mapLink:c.mapLink, note:c.note, addressExtra:c.addressExtra,
    createdAt:c.createdAt, updatedAt:c.updatedAt
  };
}
function getCustomers(token, search) {
  _auth_(token, ['Admin']);
  var list = _customersAll_();
  search = String(search || '').trim().toLowerCase();
  if (search) list = list.filter(function(c) {
    return [c.mobile,c.name,c.whatsapp,c.buildingNo,c.zoneNo,c.streetNo,c.zoneName].join(' ').toLowerCase().indexOf(search) > -1;
  });
  list.sort(function(a,b){ return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
  return list.map(_pubCustomer_);
}
function getCustomerByPhone(token, phone) {
  _auth_(token, ['Admin','Order Entry']);
  var row = _findCustomerRow_(phone);
  if (row === -1) return { found:false };
  var sh = _customerSheet_();
  var r = sh.getRange(row,1,1,CUSTOMER_HEADERS.length).getValues()[0];
  return { found:true, customer:_pubCustomer_({
    mobile:String(r[0]||''), name:String(r[1]||''), whatsapp:String(r[2]||''),
    buildingNo:String(r[3]||''), zoneNo:String(r[4]||''), streetNo:String(r[5]||''),
    zoneName:String(r[6]||''), mapLink:String(r[7]||''), note:String(r[8]||''), addressExtra:String(r[9]||''),
    createdAt:String(r[10]||''), updatedAt:String(r[11]||'')
  })};
}
function saveCustomer(token, customer, origMobile) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    customer = customer || {};
    var mobile = _cleanIntlPhone_(customer.mobile);
    if (!mobile) return {success:false,message:'Mobile number সঠিক নয়'};
    var name = String(customer.name || '').trim();
    if (!name) return {success:false,message:'Customer Name দিন'};
    var whatsapp = String(customer.whatsapp || '').trim() ? _cleanIntlPhone_(customer.whatsapp) : '';
    if (String(customer.whatsapp || '').trim() && !whatsapp) return {success:false,message:'WhatsApp number সঠিক নয়'};
    var mapLink = String(customer.mapLink || '').trim();
    if (mapLink && !/^https?:\/\//i.test(mapLink)) return {success:false,message:'Map link http/https দিয়ে শুরু হতে হবে'};
    var sh = _customerSheet_();
    var orig = _customerKey_(origMobile);
    var row = orig ? _findCustomerRow_(origMobile) : _findCustomerRow_(mobile);
    if (orig && row === -1) return {success:false,message:'পুরনো customer পাওয়া যায়নি'};
    if (orig && _customerKey_(mobile) !== orig && _findCustomerRow_(mobile) !== -1)
      return {success:false,message:'এই mobile number অন্য customer-এর আছে'};
    var now = _nowStr_();
    var created = row > 0 ? String(sh.getRange(row,11).getValue() || sh.getRange(row,10).getValue() || now) : now;
    var vals = [mobile,name,whatsapp,String(customer.buildingNo||''),String(customer.zoneNo||''),String(customer.streetNo||''),
      String(customer.zoneName||''),mapLink,String(customer.note||'').substring(0,500),String(customer.addressExtra||'').substring(0,500),created,now];
    if (row > 0) sh.getRange(row,1,1,CUSTOMER_HEADERS.length).setValues([vals]);
    else { sh.getRange(sh.getLastRow()+1,1,1,CUSTOMER_HEADERS.length).setValues([vals]); }
    return {success:true,message:row>0?'Customer update হয়েছে':'Customer add হয়েছে'};
  } finally { lock.releaseLock(); }
}
function deleteCustomer(token, mobile) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var row = _findCustomerRow_(mobile);
    if (row === -1) return {success:false,message:'Customer পাওয়া যায়নি'};
    _customerSheet_().deleteRow(row);
    return {success:true,message:'Customer মুছে ফেলা হয়েছে। পুরনো order/history অক্ষত আছে।'};
  } finally { lock.releaseLock(); }
}
function bulkSaveCustomers(token, rows) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    rows = Array.isArray(rows) ? rows : [];
    if (!rows.length) return {success:false,message:'Bulk data পাওয়া যায়নি'};
    var sh = _customerSheet_(), now = _nowStr_(), added=0, updated=0, errors=[];
    var existing = {};
    _customersAll_().forEach(function(c){ existing[_customerKey_(c.mobile)] = c; });
    rows.forEach(function(c,idx){
      try {
        var mobile = _cleanIntlPhone_(c.mobile || c.phone);
        if (!mobile) throw new Error('Mobile invalid');
        var name = String(c.name || c.customerName || '').trim();
        if (!name) throw new Error('Name missing');
        var wa = String(c.whatsapp || '').trim() ? _cleanIntlPhone_(c.whatsapp) : '';
        if (String(c.whatsapp || '').trim() && !wa) throw new Error('WhatsApp invalid');
        var mapLink = String(c.mapLink || '').trim();
        if (mapLink && !/^https?:\/\//i.test(mapLink)) throw new Error('Map link invalid');
        var key = _customerKey_(mobile), old = existing[key];
        var vals = [mobile,name,wa,String(c.buildingNo||''),String(c.zoneNo||''),String(c.streetNo||''),
          String(c.zoneName||''),mapLink,String(c.note||'').substring(0,500),String(c.addressExtra||'').substring(0,500),old?old.createdAt:now,now];
        if (old) { sh.getRange(old.row,1,1,CUSTOMER_HEADERS.length).setValues([vals]); updated++; }
        else { sh.getRange(sh.getLastRow()+1,1,1,CUSTOMER_HEADERS.length).setValues([vals]); added++; }
      } catch(e) { errors.push('Row '+(idx+2)+': '+e.message); }
    });
    return {success:true,message:added+' added, '+updated+' updated'+(errors.length?' | '+errors.length+' error':''),
      added:added,updated:updated,errors:errors};
  } finally { lock.releaseLock(); }
}
function exportCustomersCsv(token) {
  _auth_(token, ['Admin']);
  var list = _customersAll_();
  var headers = ['Mobile','Name','WhatsApp','Building No','Zone No','Street No','Zone Name','Map Link','Note','Address Additional Info','Created At','Updated At'];
  function qcsv(v) {
    var s = String(v == null ? '' : v).replace(/\r?\n/g,' ');
    return '"' + s.replace(/"/g,'""') + '"';
  }
  var csv = '\uFEFF' + headers.map(qcsv).join(',') + '\r\n';
  list.forEach(function(c){
    csv += [c.mobile,c.name,c.whatsapp,c.buildingNo,c.zoneNo,c.streetNo,c.zoneName,c.mapLink,c.note,c.addressExtra,c.createdAt,c.updatedAt].map(qcsv).join(',') + '\r\n';
  });
  return {success:true,filename:'Customers-'+_todayKey_()+'.csv',csv:csv,count:list.length};
}
function _upsertCustomerFromOrder_(order) {
  var sh = _customerSheet_();
  var mobile = _cleanIntlPhone_(order.phone);
  if (!mobile) return;
  var row = _findCustomerRow_(mobile);
  var wa = String(order.whatsapp || '').trim() ? _cleanIntlPhone_(order.whatsapp) : '';
  var mapLink = String(order.mapLink || '').trim();
  if (!mapLink && row > 0) mapLink = String(sh.getRange(row, 8).getValue() || '').trim();
  var now = _nowStr_();
  var vals = [mobile,String(order.customerName||''),wa,String(order.buildingNo||''),String(order.zoneNo||''),
    String(order.streetNo||''),String(order.zoneName||''),mapLink,String(order.note||'').substring(0,500),String(order.addressExtra||'').substring(0,500),
    row > 0 ? String(sh.getRange(row,11).getValue()||now) : now,now];
  if (row > 0) sh.getRange(row,1,1,CUSTOMER_HEADERS.length).setValues([vals]);
  else sh.getRange(sh.getLastRow()+1,1,1,CUSTOMER_HEADERS.length).setValues([vals]);
}

// ==================== ORDER ITEMS ====================
var ORDER_ITEMS_SHEET = 'OrderItems';
function _ensureOrderItemsSheet_() {
  var sh = _getOrCreateSheet_(ORDER_ITEMS_SHEET,
    ['OrderID', 'SKU', 'Qty', 'UnitPrice', 'LineTotal', 'ProductName', 'Variation', 'BuyPrice', 'ExtraCost', 'ItemNote']);
  _ensureSize_(sh, Math.max(sh.getLastRow(), 1), 10);
  var headers = sh.getRange(1, 1, 1, 10).getValues()[0];
  var wanted = ['OrderID', 'SKU', 'Qty', 'UnitPrice', 'LineTotal', 'ProductName', 'Variation', 'BuyPrice', 'ExtraCost', 'ItemNote'];
  for (var i = 0; i < wanted.length; i++) {
    if (!String(headers[i] || '').trim()) sh.getRange(1, i + 1).setValue(wanted[i]);
  }
  sh.getRange('A:B').setNumberFormat('@');
  sh.getRange('F:G').setNumberFormat('@');
  return sh;
}
function _getOrderItemsMap_() {
  _migrateOrderItemSnapshots_();
  var sh = _ensureOrderItemsSheet_();
  var lastRow = sh.getLastRow();
  var map = {};
  if (lastRow < 2) return map;
  var values = sh.getRange(2, 1, lastRow - 1, 10).getValues();
  for (var i = 0; i < values.length; i++) {
    var id = values[i][0];
    if (!id) continue;
    if (!map[id]) map[id] = [];
    map[id].push({
      sku: values[i][1],
      qty: Number(values[i][2]) || 0,
      unitPrice: Number(values[i][3]) || 0,
      lineTotal: Number(values[i][4]) || 0,
      name: String(values[i][5] || ''),
      variation: String(values[i][6] || ''),
      buyPrice: Number(values[i][7]) || 0,
      extraCost: Number(values[i][8]) || 0,
      note: String(values[i][9] || ''),
      _hasCostSnapshot: String(values[i][7] || '') !== '' || String(values[i][8] || '') !== ''
    });
  }
  return map;
}
function _fallbackItemsFromOrdersRow_(orderRow) {
  var sku = String(orderRow[6] || '').trim();
  var qty = Number(orderRow[7]) || 0;
  if (!sku || sku.toUpperCase() === 'MULTI' || qty <= 0) return [];
  return [{ sku: sku, qty: qty, unitPrice: 0, lineTotal: 0, _legacy: true }];
}
function _deleteOrderItems_(orderId) {
  var sh = _ensureOrderItemsSheet_();
  var n = sh.getLastRow();
  if (n < 2) return;
  var ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(orderId)) sh.deleteRow(i + 2);
  }
}
function _appendOrderItems_(orderId, items) {
  if (!items || !items.length) return;
  var sh = _ensureOrderItemsSheet_();
  var rows = items.map(function (it) {
    return [
      orderId, it.sku, it.qty, it.unitPrice, it.lineTotal,
      it.name || '', it.variation || '', Number(it.buyPrice) || 0, Number(it.extraCost) || 0, String(it.note || '')
    ];
  });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 10).setValues(rows);
}

function _orderItemSkuExists_(sku, exceptOrderId) {
  sku = String(sku || '').trim();
  if (!sku) return false;
  var sh = _ensureOrderItemsSheet_();
  var n = sh.getLastRow();
  if (n < 2) return false;
  var v = sh.getRange(2, 1, n - 1, 2).getValues();
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][1]).trim() === sku && String(v[i][0]).trim() !== String(exceptOrderId || '').trim()) return true;
  }
  return false;
}

function _migrateOrderItemSnapshots_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('ORDERITEM_SNAPSHOT_V2') === '1') return;
  var sh = _ensureOrderItemsSheet_();
  var n = sh.getLastRow();
  if (n < 2) { props.setProperty('ORDERITEM_SNAPSHOT_V2','1'); return; }
  var prod = _getProductPricingMap_();
  var v = sh.getRange(2,1,n-1,10).getValues();
  var changed = false;
  for (var i=0;i<v.length;i++) {
    var sku=String(v[i][1]||'').trim(), p=prod[sku];
    if (!sku || !p) continue;
    if (String(v[i][5]||'') === '') { v[i][5]=p.name||''; changed=true; }
    if (String(v[i][6]||'') === '') { v[i][6]=p.variation||''; changed=true; }
    if (String(v[i][7]||'') === '' && Number(p.buyPrice)!==0) { v[i][7]=Number(p.buyPrice)||0; changed=true; }
    if (String(v[i][8]||'') === '' && Number(p.extraCost)!==0) { v[i][8]=Number(p.extraCost)||0; changed=true; }
  }
  if (changed) sh.getRange(2,1,n-1,10).setValues(v);
  props.setProperty('ORDERITEM_SNAPSHOT_V2','1');
}

// ==================== ORDER ID ====================
var ORDER_SOURCE_CODES = {
  'Messenger': 'M',
  'WhatsApp': 'W',
  'Instagram': 'I'
};

var ORDER_PAGE_CODES = {
  'COLOR ZONE': 'C',
  'COLOR ZONE - QATAR ONLINE SHOPPING': 'C',
  'CZ': 'C',
  'NASMATH': 'N',
  'NASMATH QATAR ONLINE SHOPPING': 'N',
  'NS': 'N',
  'DOHA PINOY WEAR': 'D',
  'DPW': 'D'
};
function _pageOrderCode_(pageCode) {
  pageCode = String(pageCode || '').trim().toUpperCase();
  var page = _pagesMap_()[pageCode];
  var name = page ? String(page.name || '').trim().toUpperCase() : '';
  return ORDER_PAGE_CODES[name] || ORDER_PAGE_CODES[pageCode] || pageCode.replace(/[^A-Z0-9]/g, '').substring(0, 1) || 'P';
}
function _sourceCode_(source) {
  source = String(source || '').trim();
  if (ORDER_SOURCE_CODES[source]) return ORDER_SOURCE_CODES[source];
  var x = source.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (x || 'SRC').substring(0, 4);
}
function _normalizeOrderDateKey_(dateKey) {
  dateKey = String(dateKey || '').trim();
  var m = dateKey.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  m = dateKey.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2);
  m = dateKey.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2);
  return '';
}
function _validOrderDateKey_(dateKey) {
  var key = _normalizeOrderDateKey_(dateKey);
  var m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  var y = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  var days = [31, (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}
function _formatOrderDate_(dateKey) {
  var p = String(dateKey || '').split('-');
  return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : String(dateKey || '');
}
function _orderIdPrefix_(dateKey, source, pageCode) {
  return String(dateKey).replace(/-/g, '') + _sourceCode_(source) + _pageOrderCode_(pageCode);
}
function _orderIdExists_(orderId) {
  var sh = _getSheet_('Orders');
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return false;
  var ids = sh.getRange(2, 1, lastRow - 1, 1).getValues();
  var target = String(orderId || '').trim().toUpperCase();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0] || '').trim().toUpperCase() === target) return true;
  return false;
}

// ==================== ORDERS SHEET ====================
function _ordersSheetW_() {
  var sh = _getSheet_('Orders');
  _ensureSize_(sh, Math.max(sh.getLastRow(), 1), ORDER_COLS);
  var names = ['CreatedBy', 'DateKey', 'FreeDelivery', 'WhatsApp', 'DriverStatus', 'DriverReason', 'ApprovalState', 'DriverUpdatedAt', 'OrderNote'];
  var hdr = sh.getRange(1, 27, 1, 9).getValues()[0];
  for (var i = 0; i < 9; i++) {
    if (!String(hdr[i]).trim()) sh.getRange(1, 27 + i).setValue(names[i]);
  }
  if (!String(sh.getRange(1, 36).getValue()).trim()) sh.getRange(1, 36).setValue('DeliveryCost');
  if (!String(sh.getRange(1, 37).getValue()).trim()) sh.getRange(1, 37).setValue('DeliveryMode');
  if (!String(sh.getRange(1, 38).getValue()).trim()) sh.getRange(1, 38).setValue('ProductPricingMode');
  if (!String(sh.getRange(1, 39).getValue()).trim()) sh.getRange(1, 39).setValue('DeliveredAt');
  if (!String(sh.getRange(1, 40).getValue()).trim()) sh.getRange(1, 40).setValue('AddressExtra');
  return sh;
}

function _mapUrl_(o) {
  return (o.mapLink && /^https?:\/\//i.test(String(o.mapLink))) ? String(o.mapLink) : '';
}

function _orderObj_(row, itemsMap, prodMap) {
  var id = row[0];
  var items = itemsMap[id];
  if (!items || items.length === 0) items = _fallbackItemsFromOrdersRow_(row);
  var subTotal = Number(row[8]) || 0;

  items = items.map(function (it) {
    var p = prodMap[it.sku] || {};
    var unit = it.unitPrice, line = it.lineTotal;
    var name = it.name || p.name || '';
    var variation = it.variation || p.variation || '';
    if (it._legacy) {
      line = subTotal;
      unit = it.qty ? subTotal / it.qty : 0;
    }
    return {
      sku: it.sku, name: name, variation: variation, qty: it.qty,
      unitPrice: unit, lineTotal: line,
      buyPrice: it._hasCostSnapshot ? it.buyPrice : (Number(p.buyPrice) || 0),
      extraCost: it._hasCostSnapshot ? it.extraCost : (Number(p.extraCost) || 0),
      note: String(it.note || ''),
      historical: !!it._hasCostSnapshot
    };
  });

  var free = String(_safe_(row, 28)).trim().toUpperCase() === 'YES';
  var delCharge = Number(row[5]) || 0;
  var savedDeliveryCost = Number(_safe_(row, 35));
  var deliveryCost = String(_safe_(row, 35)) !== '' ? savedDeliveryCost : (free ? Math.max(delCharge - 10, 0) : 0);

  var o = {
    id: id,
    date: _fmtDateTime_(row[1]),
    dateKey: _orderDateKey_(row),
    name: row[2],
    phone: String(row[3] || '').replace(/^'/, ''),
    whatsapp: String(_safe_(row, 29) || '').replace(/^'/, ''),
    zone: row[4],
    delCharge: delCharge,
    freeDelivery: free,
    delCharged: free ? 0 : delCharge,
    deliveryCost: deliveryCost,
    deliveryMode: String(_safe_(row, 36) || 'auto'),
    productPricingMode: String(_safe_(row, 37) || 'auto'),
    subTotal: subTotal,
    grandTotal: Number(row[9]) || 0,
    status: row[10],
    driver: row[11],
    reason: row[12],
    payment: _safe_(row, 13) || 'COD',
    source: _safe_(row, 15),
    pageCode: _safe_(row, 16),
    buildingNo: String(_safe_(row, 17)),
    zoneNo: String(_safe_(row, 18)),
    streetNo: String(_safe_(row, 19)),
    zoneName: _safe_(row, 20),
    mapLink: _safe_(row, 21),
    addressExtra: _safe_(row, 39),
    discountType: _safe_(row, 22),
    discountValue: _safe_(row, 23),
    discountAmount: Number(_safe_(row, 24)) || 0,
    couponCode: _safe_(row, 25),
    createdBy: _safe_(row, 26),
    driverStatus: String(_safe_(row, 30) || ''),
    driverReason: String(_safe_(row, 31) || ''),
    approval: String(_safe_(row, 32) || '') === 'AWAITING',
    driverAt: String(_safe_(row, 33) || ''),
    note: String(_safe_(row, 34) || ''),
    deliveredAt: String(_safe_(row, 38) || ''),
    items: items
  };
  o.mapUrl = _mapUrl_(o);
  return o;
}

// ==================== ORDERS API ====================
function getOrders(token, from, to) {
  _auth_(token, ['Admin', 'Order Entry']);
  var data = _getSheet_('Orders').getDataRange().getValues();
  var itemsMap = _getOrderItemsMap_();
  var prodMap = _getProductPricingMap_();
  var list = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    var k = _orderDateKey_(data[i]);
    if (from || to) {
      if (!k) continue;
      if (from && k < from) continue;
      if (to && k > to) continue;
    }
    list.push(_orderObj_(data[i], itemsMap, prodMap));
  }
  return list;
}

function getOrderForEdit(token, orderId) {
  _auth_(token, ['Admin']);
  var data = _getSheet_('Orders').getDataRange().getValues();
  var itemsMap = _getOrderItemsMap_();
  var prodMap = _getProductPricingMap_();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(orderId)) return _orderObj_(data[i], itemsMap, prodMap);
  }
  throw new Error('অর্ডার পাওয়া যায়নি');
}

function getInvoices(token, ids) {
  var u = _auth_(token, ['Admin', 'Order Entry', 'Driver']);
  ids = (ids || []).map(String).slice(0, 200);
  var want = {};
  ids.forEach(function (x) { want[x] = true; });

  var data = _getSheet_('Orders').getDataRange().getValues();
  var itemsMap = _getOrderItemsMap_();
  var prodMap = _getProductPricingMap_();
  var pagesMap = _pagesMap_();
  var found = {};
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0]);
    if (!want[id]) continue;
    if (u.role === 'Driver' && String(data[i][11]) !== u.name) continue;
    var o = _orderObj_(data[i], itemsMap, prodMap);
    o.page = pagesMap[String(o.pageCode || '').toUpperCase()] || null;
    found[id] = o;
  }
  var orders = [];
  ids.forEach(function (id) { if (found[id]) orders.push(found[id]); });
  return { shop: SHOP_INFO, orders: orders };
}

// ==================== ORDER PREPARATION ====================
function _prepareOrder_(order, opts) {
  opts = opts || {};
  order = order || {};
  var items = order.items || [];
  if (!Array.isArray(items) || items.length === 0) return { ok: false, message: 'কমপক্ষে ১টি item যোগ করুন' };

  var source = String(order.source || '').trim();
  var pageCode = String(order.pageCode || '').trim().toUpperCase();
  var orderDateKey = _normalizeOrderDateKey_(order.orderDateKey) || _todayKey_();
  if (!_validOrderDateKey_(orderDateKey)) return { ok: false, message: 'Order Date সঠিক নয়' };
  if (!source) return { ok: false, message: 'Source নির্বাচন করুন' };
  if (!pageCode) return { ok: false, message: 'Page নির্বাচন করুন' };
  var pageOk = _pagesActive_().some(function (p) { return p.code === pageCode; }) || (opts.keepPage && opts.keepPage === pageCode);
  if (!pageOk) return { ok: false, message: 'Page code invalid/Inactive: ' + pageCode };

  var customerName = String(order.customerName || '').trim();
  if (!customerName) return { ok: false, message: 'কাস্টমারের নাম দিন' };

  var phone = _cleanIntlPhone_(order.phone);
  if (!phone) return { ok: false, message: 'ফোন নম্বর সঠিক নয় (Qatar হলে ৮ ডিজিট)' };

  var whatsapp = '';
  if (String(order.whatsapp || '').trim()) {
    whatsapp = _cleanIntlPhone_(order.whatsapp);
    if (!whatsapp) return { ok: false, message: 'WhatsApp নম্বর সঠিক নয়' };
  }

  var freeDelivery = (order.freeDelivery === true || order.freeDelivery === 'true');

  var buildingNo = String(order.buildingNo || '').trim();
  var zoneNo = String(order.zoneNo || '').trim();
  var streetNo = String(order.streetNo || '').trim();
  var zoneName = String(order.zoneName || '').trim();
  var addressExtra = String(order.addressExtra || '').trim().substring(0, 500);
  var mapLink = String(order.mapLink || '').trim();
  if (mapLink && !/^https?:\/\//i.test(mapLink)) return { ok: false, message: 'Map link টি http/https দিয়ে শুরু হতে হবে' };
  if (!(buildingNo && zoneNo && streetNo) && !mapLink) return { ok: false, message: 'Address numbers দিন অথবা Google Map link দিন' };

  var driverName = String(order.driverName || '').trim();
  var okDriver = _driversActive_().some(function (d) { return d.name === driverName; }) ||
                 (opts.currentDriver && driverName === opts.currentDriver);
  if (!okDriver) return { ok: false, message: 'Delivery man নির্বাচন করুন (Active driver লাগবে)' };

  var zoneCode = String(order.zoneCode || '').trim().toUpperCase();
  var zoneMap = {};
  (opts.anyZone ? _zonesAll_() : _zonesActive_()).forEach(function (z) { zoneMap[z.code] = z; });
  if (!zoneMap[zoneCode]) return { ok: false, message: 'Zone invalid/Inactive: ' + zoneCode };
  var zoneLabel = zoneMap[zoneCode].code + ' - ' + zoneMap[zoneCode].name;
  var zoneBaseCharge = Number(zoneMap[zoneCode].charge) || 0;
  if (opts.keepCharge !== undefined && opts.keepCode === zoneCode) zoneBaseCharge = opts.keepCharge;
  var deliveryMode = String(order.deliveryChargeMode || 'auto').toLowerCase() === 'manual' ? 'manual' : 'auto';
  var manualDeliveryCharge = Number(order.manualDeliveryCharge);
  var deliveryCharge = deliveryMode === 'manual' ? (isNaN(manualDeliveryCharge) ? 0 : Math.max(0, manualDeliveryCharge)) : zoneBaseCharge;
  var deliveryCost = freeDelivery
    ? (deliveryMode === 'manual' ? deliveryCharge : Math.max(zoneBaseCharge - 10, 0))
    : 0;

  var pricingMode = String(order.productPricingMode || 'auto').toLowerCase() === 'manual' ? 'manual' : 'auto';
  var pricingMap = _getProductPricingMap_();
  var subTotal = 0, totalQty = 0, normalized = [];
  for (var i = 0; i < items.length; i++) {
    var sku = String(items[i].sku || '').trim();
    var qty = Number(items[i].qty) || 0;
    if (!sku || qty <= 0) continue;
    var p = pricingMap[sku];
    if (!p) return { ok: false, message: 'SKU পাওয়া যায়নি: ' + sku };
    var unitPrice = Number(p.sellPrice) || 0;
    var lineTotal = pricingMode === 'manual'
      ? Number(items[i].linePrice)
      : _calcLineTotalWithBundle_(unitPrice, qty, p.bundleQty, p.bundlePrice);
    if (isNaN(lineTotal) || lineTotal < 0) return { ok: false, message: 'Manual Line Price সঠিক নয়: ' + sku };
    if (pricingMode === 'manual') unitPrice = qty ? lineTotal / qty : 0;
    subTotal += lineTotal;
    totalQty += qty;
    normalized.push({
      sku: sku, qty: qty, unitPrice: unitPrice, lineTotal: lineTotal,
      name: String(p.name || ''), variation: String(p.variation || ''),
      buyPrice: Number(p.buyPrice) || 0, extraCost: Number(p.extraCost) || 0,
      note: String(items[i].note || '').trim().substring(0, 300)
    });
  }
  if (normalized.length === 0) return { ok: false, message: 'Valid item পাওয়া যায়নি (SKU/Qty ঠিক করুন)' };

  var discountType = String(order.discountType || 'none').trim().toLowerCase();
  var discountValue = Number(order.discountValue) || 0;
  var couponCode = String(order.couponCode || '').trim();
  var discountAmount = 0;
  if (discountType === 'flat') discountAmount = discountValue;
  else if (discountType === 'percent') discountAmount = (subTotal * discountValue) / 100;
  else { discountType = 'none'; discountValue = 0; }
  if (discountAmount < 0) discountAmount = 0;
  if (discountAmount > subTotal) discountAmount = subTotal;

  var grandTotal = (subTotal - discountAmount) + (freeDelivery ? 0 : deliveryCharge);

  return {
    ok: true,
    d: {
      source: source, pageCode: pageCode, customerName: customerName, phone: phone, whatsapp: whatsapp,
      freeDelivery: freeDelivery, productPricingMode: pricingMode, deliveryMode: deliveryMode, deliveryCost: deliveryCost, buildingNo: buildingNo, zoneNo: zoneNo, streetNo: streetNo, zoneName: zoneName, addressExtra: addressExtra,
      mapLink: mapLink, driverName: driverName, zoneLabel: zoneLabel, deliveryCharge: deliveryCharge,
      items: normalized, subTotal: subTotal, totalQty: totalQty,
      skuSummary: normalized.length === 1 ? normalized[0].sku : 'MULTI',
      qtySummary: normalized.length === 1 ? normalized[0].qty : totalQty,
      discountType: discountType, discountValue: discountValue, discountAmount: discountAmount,
      couponCode: couponCode, grandTotal: grandTotal,
      orderDateKey: orderDateKey,
      requestedOrderId: String(order.orderId || '').trim().toUpperCase(),
      note: String(order.note || '').trim().substring(0, 500)
    }
  };
}

function createNewOrder(token, order) {
  var user = _auth_(token, ['Admin', 'Order Entry']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var prep = _prepareOrder_(order, {});
    if (!prep.ok) return { success: false, message: prep.message };
    var d = prep.d;
    _upsertCustomerFromOrder_(order);

    var sh = _ordersSheetW_();
    var expectedPrefix = _orderIdPrefix_(d.orderDateKey, d.source, d.pageCode);
    var orderId = d.requestedOrderId;
    if (!orderId) {
      return { success:false, message:'Invoice / Order No দিন। Prefix ' + expectedPrefix + ' এর পরে আপনার পছন্দের number লিখুন।' };
    }
    if (!new RegExp('^' + expectedPrefix + '[0-9]+$').test(orderId)) {
      return { success:false, message:'Invoice / Order No অবশ্যই ' + expectedPrefix + ' + আপনার পছন্দের number হতে হবে।' };
    }
    if (_orderIdExists_(orderId)) {
      return { success:false, message:'এই Invoice / Order No আগে থেকেই আছে: ' + orderId + '. অন্য একটি unique number দিন।' };
    }

    sh.insertRowsAfter(1, 1);
    var r = 2;
    _ensureSize_(sh, r, ORDER_COLS);
    _setText_(sh, r, [2, 3, 4, 18, 19, 20, 21, 22, 26, 28, 30, 34, 35]);

    sh.getRange(r, 1, 1, ORDER_COLS).setValues([[
      orderId, _formatOrderDate_(d.orderDateKey), d.customerName, d.phone, d.zoneLabel, d.deliveryCharge, d.skuSummary, d.qtySummary,
      d.subTotal, d.grandTotal, 'Pending', d.driverName, '', 'COD', '',
      d.source, d.pageCode, d.buildingNo, d.zoneNo, d.streetNo, d.zoneName, d.mapLink,
      d.discountType, d.discountValue, d.discountAmount, d.couponCode,
      user.name, d.orderDateKey, d.freeDelivery ? 'YES' : '', d.whatsapp,
      '', '', '', '', d.note, d.deliveryCost, d.deliveryMode, d.productPricingMode, '', d.addressExtra
    ]]);
    _appendOrderItems_(orderId, d.items);

    _notifyDriver_(d.driverName, 'assign', '📦 নতুন অর্ডার', 'অর্ডার ' + orderId + ' আপনাকে assign করা হয়েছে (' + d.customerName + ')', orderId);
    return { success: true, message: 'অর্ডার সফলভাবে সেভ হয়েছে! ID: ' + orderId };
  } finally {
    lock.releaseLock();
  }
}

function updateOrder(token, orderId, order) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = _ordersSheetW_();
    var data = sh.getDataRange().getValues();
    var idx = _findOrderRow_(data, orderId);
    if (idx < 0) return { success: false, message: 'অর্ডার পাওয়া যায়নি' };
    var old = data[idx];
    var row = idx + 1;
    var oldDriver = String(old[11]);

    var oldCode = String(old[4] || '').split(' - ')[0].trim().toUpperCase();
    var prep = _prepareOrder_(order, {
      anyZone: true, currentDriver: oldDriver, keepCode: oldCode, keepCharge: Number(old[5]) || 0,
      keepPage: String(_safe_(old, 16) || '').trim().toUpperCase()
    });
    if (!prep.ok) return { success: false, message: prep.message };
    var d = prep.d;
    _upsertCustomerFromOrder_(order);

    var itemsMap = _getOrderItemsMap_();
    var oldItems = itemsMap[old[0]];
    if (!oldItems || !oldItems.length) oldItems = _fallbackItemsFromOrdersRow_(old);

    if (String(old[10]) === 'Delivered' && String(_safe_(old, 14)).trim().toUpperCase() === 'YES') {
      var delta = {};
      oldItems.forEach(function (it) { delta[it.sku] = (delta[it.sku] || 0) - it.qty; });
      d.items.forEach(function (it) { delta[it.sku] = (delta[it.sku] || 0) + it.qty; });
      Object.keys(delta).forEach(function (sku) { if (delta[sku]) _decreaseCurrentStockBySku_(sku, delta[sku]); });
    }

    _setText_(sh, row, [3, 4, 18, 19, 20, 21, 22, 26, 30, 35]);
    sh.getRange(row, 3, 1, 8).setValues([[d.customerName, d.phone, d.zoneLabel, d.deliveryCharge, d.skuSummary, d.qtySummary, d.subTotal, d.grandTotal]]);
    sh.getRange(row, 12).setValue(d.driverName);
    sh.getRange(row, 2).setValue(_formatOrderDate_(d.orderDateKey));
    sh.getRange(row, 16, 1, 2).setValues([[d.source, d.pageCode]]);
    sh.getRange(row, 28).setValue(d.orderDateKey);
    sh.getRange(row, 18, 1, 9).setValues([[d.buildingNo, d.zoneNo, d.streetNo, d.zoneName, d.mapLink, d.discountType, d.discountValue, d.discountAmount, d.couponCode]]);
    sh.getRange(row, 29, 1, 2).setValues([[d.freeDelivery ? 'YES' : '', d.whatsapp]]);
    sh.getRange(row, 35, 1, 4).setValues([[d.note, d.deliveryCost, d.deliveryMode, d.productPricingMode]]);
    sh.getRange(row, 40).setValue(d.addressExtra);

    _deleteOrderItems_(old[0]);
    _appendOrderItems_(old[0], d.items);

    if (d.driverName !== oldDriver) {
      sh.getRange(row, 31, 1, 4).setValues([['', '', '', '']]);
      _notifyDriver_(d.driverName, 'assign', '📦 অর্ডার assign', 'অর্ডার ' + old[0] + ' আপনাকে assign করা হয়েছে', old[0]);
      _notifyDriver_(oldDriver, 'info', 'অর্ডার সরানো হয়েছে', 'অর্ডার ' + old[0] + ' অন্য driver কে দেওয়া হয়েছে', old[0]);
    } else {
      _notifyDriver_(d.driverName, 'info', '✏️ অর্ডার আপডেট', 'অর্ডার ' + old[0] + ' Admin এডিট করেছেন', old[0]);
    }
    return { success: true, message: 'অর্ডার আপডেট হয়েছে' };
  } finally {
    lock.releaseLock();
  }
}

function deleteOrder(token, orderId, restock) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = _getSheet_('Orders');
    var data = sh.getDataRange().getValues();
    var idx = _findOrderRow_(data, orderId);
    if (idx < 0) return { success: false, message: 'অর্ডার পাওয়া যায়নি' };
    var row = data[idx];

    if (restock && String(row[10]) === 'Delivered' && String(_safe_(row, 14)).trim().toUpperCase() === 'YES') {
      var itemsMap = _getOrderItemsMap_();
      var items = itemsMap[row[0]];
      if (!items || !items.length) items = _fallbackItemsFromOrdersRow_(row);
      items.forEach(function (it) { if (it.sku && it.qty > 0) _decreaseCurrentStockBySku_(it.sku, -it.qty); });
    }
    _deleteOrderItems_(row[0]);
    sh.deleteRow(idx + 1);
    _notifyDriver_(String(row[11]), 'info', '🗑 অর্ডার মুছে ফেলা হয়েছে', 'অর্ডার ' + row[0] + ' Admin মুছে ফেলেছেন', row[0]);
    return { success: true, message: 'অর্ডার মুছে ফেলা হয়েছে' };
  } finally {
    lock.releaseLock();
  }
}

function _ensureOrdersStockAdjustedHeader_(ordersSheet) {
  var headerCell = ordersSheet.getRange(1, 15);
  if (String(headerCell.getValue()).trim() === '') headerCell.setValue('StockAdjusted');
}

function _decreaseCurrentStockBySku_(sku, qty) {
  var sheet = _getSheet_(PRODUCTS_SHEET);
  var row = _findProductRowBySku_(sku);
  if (row === -1) return { ok: false, warn: 'Product SKU পাওয়া যায়নি: ' + sku };
  var cur = Number(sheet.getRange(row, COL_CURRENT_STOCK).getValue()) || 0;
  var next = cur - qty;
  var warn = '';
  if (next < 0) { next = 0; warn = 'Stock কম ছিল, তাই 0 সেট করা হয়েছে।'; }
  sheet.getRange(row, COL_CURRENT_STOCK).setValue(next);
  return { ok: true, warn: warn };
}

function _finalizeStatus_(sh, rowNum, rowVals, newStatus, reason, itemsMap) {
  var oldStatus = rowVals[10];
  sh.getRange(rowNum, 11).setValue(newStatus);
  sh.getRange(rowNum, 13).setValue(reason || '');
  if (newStatus === 'Delivered' && oldStatus !== 'Delivered') {
    sh.getRange(rowNum, 39).setNumberFormat('@').setValue(_nowStr_());
  } else if (newStatus !== 'Delivered') {
    sh.getRange(rowNum, 39).clearContent();
  }
  var adjusted = String(_safe_(rowVals, 14) || '').trim().toUpperCase();
  var warnText = '';
  if (newStatus === 'Delivered' && oldStatus !== 'Delivered' && adjusted !== 'YES') {
    _ensureOrdersStockAdjustedHeader_(sh);
    var items = itemsMap[rowVals[0]];
    if (!items || items.length === 0) items = _fallbackItemsFromOrdersRow_(rowVals);
    var warnings = [];
    for (var k = 0; k < items.length; k++) {
      var sku = items[k].sku;
      var qty = Number(items[k].qty) || 0;
      if (!sku || qty <= 0) continue;
      var res = _decreaseCurrentStockBySku_(sku, qty);
      if (res.warn) warnings.push(sku + ': ' + res.warn);
    }
    sh.getRange(rowNum, 15).setValue('YES');
    if (warnings.length) warnText = warnings.join(' | ');
  }
  return warnText;
}

function setOrderStatusAdmin(token, orderId, newStatus, reason) {
  _auth_(token, ['Admin']);
  if (STATUSES.indexOf(newStatus) === -1) return { success: false, message: 'Invalid status' };
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = _ordersSheetW_();
    var data = sh.getDataRange().getValues();
    var idx = _findOrderRow_(data, orderId);
    if (idx < 0) return { success: false, message: 'অর্ডার পাওয়া যায়নি' };
    var warn = _finalizeStatus_(sh, idx + 1, data[idx], newStatus, reason, _getOrderItemsMap_());
    sh.getRange(idx + 1, 31, 1, 4).setValues([['', '', '', '']]);
    _notifyDriver_(String(data[idx][11]), 'info', 'Status পরিবর্তন', 'অর্ডার ' + orderId + ' এর status Admin ' + newStatus + ' করেছেন', orderId);
    return { success: true, message: 'Status আপডেট হয়েছে' + (warn ? ' | ' + warn : '') };
  } finally {
    lock.releaseLock();
  }
}

function assignOrdersDriver(token, ids, driverName) {
  _auth_(token, ['Admin']);
  ids = (ids || []).map(String);
  driverName = String(driverName || '').trim();
  var okDriver = _driversActive_().some(function (d) { return d.name === driverName; });
  if (!okDriver) return { success: false, message: 'Active driver নির্বাচন করুন' };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var want = {};
    ids.forEach(function (x) { want[x] = true; });
    var sh = _ordersSheetW_();
    var data = sh.getDataRange().getValues();
    var moved = [], oldMap = {};
    for (var i = 1; i < data.length; i++) {
      var id = String(data[i][0]);
      if (!want[id]) continue;
      var oldDriver = String(data[i][11]);
      if (oldDriver === driverName) continue;
      sh.getRange(i + 1, 12).setValue(driverName);
      sh.getRange(i + 1, 31, 1, 4).setValues([['', '', '', '']]);
      moved.push(id);
      if (oldDriver) { if (!oldMap[oldDriver]) oldMap[oldDriver] = []; oldMap[oldDriver].push(id); }
    }
    if (!moved.length) return { success: true, message: 'কোনো পরিবর্তন হয়নি (আগে থেকেই এই driver এর)' };

    _notifyDriver_(driverName, 'assign', '📦 নতুন অর্ডার assign',
      moved.length === 1 ? 'অর্ডার ' + moved[0] + ' আপনাকে assign করা হয়েছে' : moved.length + ' টি অর্ডার আপনাকে assign করা হয়েছে', moved[0]);
    Object.keys(oldMap).forEach(function (dn) {
      _notifyDriver_(dn, 'info', 'অর্ডার সরানো হয়েছে',
        oldMap[dn].length === 1 ? 'অর্ডার ' + oldMap[dn][0] + ' অন্য driver কে দেওয়া হয়েছে' : oldMap[dn].length + ' টি অর্ডার অন্য driver কে দেওয়া হয়েছে', oldMap[dn][0]);
    });
    return { success: true, message: moved.length + ' টি অর্ডার ' + driverName + ' কে assign হয়েছে' };
  } finally {
    lock.releaseLock();
  }
}

// ==================== DRIVER & APPROVALS ====================
function submitDriverStatus(token, orderId, newStatus, reason) {
  var u = _auth_(token, ['Driver']);
  if (STATUSES.indexOf(newStatus) === -1) return { success: false, message: 'Invalid status' };
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = _ordersSheetW_();
    var data = sh.getDataRange().getValues();
    var idx = _findOrderRow_(data, orderId);
    if (idx < 0) return { success: false, message: 'অর্ডার খুঁজে পাওয়া যায়নি!' };
    var row = data[idx];
    if (String(row[11]) !== u.name) return { success: false, message: 'এই অর্ডারটি আপনার নয়!' };
    if (String(row[10]) !== 'Pending') return { success: false, message: 'এই অর্ডার Admin ইতিমধ্যে final করেছেন। বদলাতে Admin কে জানান।' };

    var r = idx + 1;
    _setText_(sh, r, [34]);
    sh.getRange(r, 31, 1, 4).setValues([[newStatus, reason || '', 'AWAITING', _nowStr_()]]);
    _notifyAdmin_('approval', '🔔 ' + u.name + ' status দিয়েছেন',
      'অর্ডার ' + orderId + ' (' + row[2] + ') → ' + newStatus + (reason ? ' (' + reason + ')' : '') + ' — Approval দরকার', orderId);
    return { success: true, message: 'Admin এর কাছে পাঠানো হয়েছে। Admin approve করলে final হবে।' };
  } finally {
    lock.releaseLock();
  }
}

function getApprovals(token) {
  _auth_(token, ['Admin']);
  var data = _getSheet_('Orders').getDataRange().getValues();
  var itemsMap = _getOrderItemsMap_();
  var prodMap = _getProductPricingMap_();
  var list = [];
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] && String(_safe_(data[i], 32)) === 'AWAITING') list.push(_orderObj_(data[i], itemsMap, prodMap));
  }
  return list;
}

function approveOrders(token, ids) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var want = {};
    (ids || []).forEach(function (x) { want[String(x)] = true; });
    var sh = _ordersSheetW_();
    var data = sh.getDataRange().getValues();
    var itemsMap = _getOrderItemsMap_();
    var count = 0, warns = [];
    for (var i = 1; i < data.length; i++) {
      var id = String(data[i][0]);
      if (!want[id] || String(_safe_(data[i], 32)) !== 'AWAITING') continue;
      var st = String(_safe_(data[i], 30));
      if (STATUSES.indexOf(st) === -1) continue;
      var w = _finalizeStatus_(sh, i + 1, data[i], st, String(_safe_(data[i], 31) || ''), itemsMap);
      if (w) warns.push(id + ': ' + w);
      sh.getRange(i + 1, 31, 1, 4).setValues([['', '', '', '']]);
      count++;
      _notifyDriver_(String(data[i][11]), 'info', '✅ Approved', 'অর্ডার ' + id + ' এর status "' + st + '" final হয়েছে', id);
    }
    return { success: true, count: count, warn: warns.join(' | '), message: count + ' টি অর্ডার approve হয়েছে' };
  } finally {
    lock.releaseLock();
  }
}

function rejectOrder(token, orderId, note) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = _ordersSheetW_();
    var data = sh.getDataRange().getValues();
    var idx = _findOrderRow_(data, orderId);
    if (idx < 0) return { success: false, message: 'অর্ডার পাওয়া যায়নি' };
    sh.getRange(idx + 1, 31, 1, 4).setValues([['', '', '', '']]);
    note = String(note || '').trim();
    _notifyDriver_(String(data[idx][11]), 'info', '❌ Status গ্রহণ হয়নি',
      'অর্ডার ' + orderId + ' এর status Admin approve করেননি' + (note ? ': ' + note : '') + '। আবার চেক করে জমা দিন।', orderId);
    return { success: true, message: 'Reject করা হয়েছে, driver কে জানানো হয়েছে' };
  } finally {
    lock.releaseLock();
  }
}

// ==================== DAILY DELIVERED PROFIT ====================
function getDailyDeliveredProfit(token, dateKey, selectedIds) {
  _auth_(token, ['Admin']);
  dateKey = String(dateKey || '').trim() || _todayKey_();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error('সঠিক তারিখ দিন (YYYY-MM-DD)');

  selectedIds = Array.isArray(selectedIds) ? selectedIds.map(String) : [];
  var selectedMap = {};
  selectedIds.forEach(function(id) { selectedMap[id] = true; });

  var data = _getSheet_('Orders').getDataRange().getValues();
  var itemsMap = _getOrderItemsMap_();
  var prodMap = _getProductPricingMap_();
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] || String(row[10]) !== 'Delivered') continue;

    var deliveredKey = _dateKey_(_safe_(row, 38)) || _orderDateKey_(row);
    if (deliveredKey !== dateKey) continue;

    var id = String(row[0]);
    if (selectedIds.length && !selectedMap[id]) continue;

    var items = itemsMap[id];
    if (!items || !items.length) items = _fallbackItemsFromOrdersRow_(row);

    var productSales = (Number(row[8]) || 0) - (Number(_safe_(row, 24)) || 0);
    var productCost = 0;
    var qty = 0;

    for (var j = 0; j < items.length; j++) {
      var q = Number(items[j].qty) || 0;
      if (q <= 0) continue;
      var p = prodMap[items[j].sku] || {};
      var buy = items[j]._hasCostSnapshot ? Number(items[j].buyPrice) || 0 : Number(p.buyPrice) || 0;
      var extra = items[j]._hasCostSnapshot ? Number(items[j].extraCost) || 0 : Number(p.extraCost) || 0;
      productCost += (buy + extra) * q;
      qty += q;
    }

    var free = String(_safe_(row, 28)).trim().toUpperCase() === 'YES';
    var freeDeliveryCost = free
      ? (String(_safe_(row, 35)) !== '' ? Number(_safe_(row, 35)) || 0 : Math.max((Number(row[5]) || 0) - 10, 0))
      : 0;

    var grossProfit = productSales - productCost;
    var profit = grossProfit - freeDeliveryCost;

    rows.push({
      id: id,
      date: _fmtDateTime_(row[1]),
      deliveredAt: String(_safe_(row, 38) || ''),
      customer: String(row[2] || ''),
      phone: String(row[3] || ''),
      driver: String(row[11] || ''),
      zone: String(row[4] || ''),
      qty: qty,
      productSales: _r2_(productSales),
      productCost: _r2_(productCost),
      freeDelivery: free,
      freeDeliveryCost: _r2_(freeDeliveryCost),
      grossProfit: _r2_(grossProfit),
      profit: _r2_(profit)
    });
  }

  rows.sort(function(a,b) { return String(b.deliveredAt || b.date).localeCompare(String(a.deliveredAt || a.date)); });

  var totals = rows.reduce(function(t, o) {
    t.orders++;
    t.qty += o.qty;
    t.productSales += o.productSales;
    t.productCost += o.productCost;
    t.freeDeliveryCost += o.freeDeliveryCost;
    t.grossProfit += o.grossProfit;
    t.profit += o.profit;
    if (o.freeDelivery) t.freeOrders++;
    return t;
  }, {orders:0, qty:0, productSales:0, productCost:0, freeDeliveryCost:0, freeOrders:0, grossProfit:0, profit:0});

  Object.keys(totals).forEach(function(k) {
    if (k !== 'orders' && k !== 'qty' && k !== 'freeOrders') totals[k] = _r2_(totals[k]);
  });

  return {
    date: dateKey,
    selectedOnly: selectedIds.length > 0,
    rows: rows,
    totals: totals
  };
}

// ==================== DRIVER STATEMENTS ====================
function getDriverOrders(token, scope) {
  var u = _auth_(token, ['Driver']);
  var data = _getSheet_('Orders').getDataRange().getValues();
  var itemsMap = _getOrderItemsMap_();
  var prodMap = _getProductPricingMap_();
  var cutoff = Utilities.formatDate(new Date(Date.now() - 2 * 86400000), _tz_(), 'yyyy-MM-dd');
  var list = [];
  for (var i = data.length - 1; i >= 1; i--) {
    if (!data[i][0] || String(data[i][11]) !== u.name) continue;
    if (scope !== 'all') {
      var k = _orderDateKey_(data[i]);
      if (data[i][10] !== 'Pending' && (!k || k < cutoff)) continue;
    }
    list.push(_orderObj_(data[i], itemsMap, prodMap));
  }
  return list;
}

function getDriverStatement(token, driverName, from, to, groupBy) {
  var u = _auth_(token, ['Admin', 'Driver']);
  var name = (u.role === 'Driver') ? u.name : String(driverName || '').trim();
  if (!name) throw new Error('Driver নির্বাচন করুন');
  from = from || _todayKey_();
  to = to || from;

  var data = _getSheet_('Orders').getDataRange().getValues();
  var groups = {};
  var T = { delivered: 0, pending: 0, returned: 0, exchange: 0, awaiting: 0, earnings: 0, cash: 0 };

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] || String(row[11]) !== name) continue;
    var k = _orderDateKey_(row);
    if (!k || k < from || k > to) continue;

    var gk = _groupKey_(k, groupBy);
    var g = groups[gk] || (groups[gk] = { key: gk, delivered: 0, pending: 0, returned: 0, exchange: 0, awaiting: 0, earnings: 0, cash: 0 });
    var st = row[10];
    if (st === 'Delivered') {
      g.delivered++; T.delivered++;
      g.earnings += Number(row[5]) || 0; T.earnings += Number(row[5]) || 0;
      g.cash += Number(row[9]) || 0; T.cash += Number(row[9]) || 0;
    } else if (st === 'Pending') { g.pending++; T.pending++; }
    else if (st === 'Return') { g.returned++; T.returned++; }
    else if (st === 'Exchange') { g.exchange++; T.exchange++; }
    if (String(_safe_(row, 32)) === 'AWAITING') { g.awaiting++; T.awaiting++; }
  }

  var rows = Object.keys(groups).map(function (k) { return groups[k]; });
  rows.sort(function (a, b) { return a.key < b.key ? 1 : -1; });
  rows.forEach(function (r) { r.earnings = _r2_(r.earnings); r.cash = _r2_(r.cash); });
  T.earnings = _r2_(T.earnings); T.cash = _r2_(T.cash);
  return { driver: name, from: from, to: to, groupBy: groupBy || 'day', rows: rows, totals: T };
}

// ==================== EXPENSES ====================
function _expSheet_() {
  var ss = getDb();
  var sh = ss.getSheetByName(EXPENSE_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(EXPENSE_SHEET);
  sh.appendRow(['ID', 'Date', 'Category', 'Amount', 'Note', 'CreatedBy', 'CreatedAt']);
  sh.getRange('B:B').setNumberFormat('@');
  sh.getRange('G:G').setNumberFormat('@');
  return sh;
}

function _catSheet_() {
  var ss = getDb();
  var sh = ss.getSheetByName(EXPCAT_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(EXPCAT_SHEET);
  sh.appendRow(['Category']);
  var rows = DEFAULT_EXPENSE_CATEGORIES.map(function (c) { return [c]; });
  sh.getRange(2, 1, rows.length, 1).setValues(rows);
  return sh;
}

function _expCategories_() {
  var sh = _catSheet_();
  var n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, 1).getValues()
    .map(function (r) { return String(r[0] || '').trim(); })
    .filter(function (c) { return c; });
}

function _addCategoryIfMissing_(name) {
  var list = _expCategories_();
  var low = name.toLowerCase();
  for (var i = 0; i < list.length; i++) if (list[i].toLowerCase() === low) return list[i];
  _catSheet_().appendRow([name]);
  return name;
}

function _expenseEntries_() {
  var sh = _expSheet_();
  var n = sh.getLastRow();
  if (n < 2) return [];
  var v = sh.getRange(2, 1, n - 1, 7).getValues();
  var list = [];
  v.forEach(function (r, i) {
    if (!r[0]) return;
    list.push({
      row: i + 2, id: String(r[0]), date: _dateKey_(r[1]), category: String(r[2] || ''),
      amount: Number(r[3]) || 0, note: String(r[4] || ''), createdBy: String(r[5] || ''), createdAt: _fmtDateTime_(r[6])
    });
  });
  return list;
}

function addExpenseCategory(token, name) {
  _auth_(token, ['Admin']);
  name = String(name || '').trim();
  if (!name) return { success: false, message: 'Category নাম দিন' };
  if (name.length > 80) return { success: false, message: 'নাম অনেক বড়' };
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var saved = _addCategoryIfMissing_(name);
    return { success: true, message: 'Category যোগ হয়েছে', category: saved };
  } finally { lock.releaseLock(); }
}

function saveExpense(token, exp) {
  var u = _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    exp = exp || {};
    var date = _dateKey_(exp.date);
    var category = String(exp.category || '').trim();
    var amount = _r2_(exp.amount);
    var note = String(exp.note || '').trim().substring(0, 300);

    if (!date) return { success: false, message: 'তারিখ দিন' };
    if (!category) return { success: false, message: 'Category নির্বাচন করুন' };
    if (!(amount > 0)) return { success: false, message: 'Amount 0 এর বেশি হতে হবে' };

    category = _addCategoryIfMissing_(category);
    var sh = _expSheet_();

    if (!exp.id) {
      var r = sh.getLastRow() + 1;
      _ensureSize_(sh, r, 7);
      _setText_(sh, r, [2, 5, 7]);
      var id = 'EX' + Date.now().toString(36).toUpperCase();
      sh.getRange(r, 1, 1, 7).setValues([[id, date, category, amount, note, u.name, _nowStr_()]]);
      return { success: true, message: 'খরচ সেভ হয়েছে' };
    }

    var list = _expenseEntries_();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === String(exp.id)) {
        _setText_(sh, list[i].row, [2, 5]);
        sh.getRange(list[i].row, 2, 1, 4).setValues([[date, category, amount, note]]);
        return { success: true, message: 'খরচ আপডেট হয়েছে' };
      }
    }
    return { success: false, message: 'Expense পাওয়া যায়নি' };
  } finally { lock.releaseLock(); }
}

function deleteExpense(token, id) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var list = _expenseEntries_();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === String(id)) {
        _expSheet_().deleteRow(list[i].row);
        return { success: true, message: 'খরচ মুছে ফেলা হয়েছে' };
      }
    }
    return { success: false, message: 'Expense পাওয়া যায়নি' };
  } finally { lock.releaseLock(); }
}

function getExpenseData(token, from, to, groupBy, category) {
  _auth_(token, ['Admin']);
  from = from || _todayKey_();
  to = to || from;
  category = String(category || '').trim();

  var groups = {}, cats = {}, list = [], total = 0;
  _expenseEntries_().forEach(function (e) {
    if (!e.date || e.date < from || e.date > to) return;
    if (category && e.category !== category) return;
    list.push(e);
    total += e.amount;
    var gk = _groupKey_(e.date, groupBy);
    if (!groups[gk]) groups[gk] = { key: gk, total: 0, count: 0 };
    groups[gk].total += e.amount; groups[gk].count++;
    cats[e.category] = (cats[e.category] || 0) + e.amount;
  });

  list.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (b.row - a.row); });

  var groupRows = Object.keys(groups).map(function (k) { groups[k].total = _r2_(groups[k].total); return groups[k]; });
  groupRows.sort(function (a, b) { return a.key < b.key ? 1 : -1; });
  var catRows = Object.keys(cats).map(function (c) { return { category: c, total: _r2_(cats[c]) }; });
  catRows.sort(function (a, b) { return b.total - a.total; });

  var rep = _buildReport_(from, to, 'day').totals;

  return {
    from: from, to: to, groupBy: groupBy || 'day',
    total: _r2_(total), count: list.length,
    categories: _expCategories_(),
    entries: list.slice(0, 1000).map(function (e) {
      return { id: e.id, date: e.date, category: e.category, amount: e.amount, note: e.note, createdBy: e.createdBy };
    }),
    groups: groupRows,
    byCategory: catRows,
    pl: { productSales: rep.productSales, cost: rep.cost, freeCost: rep.freeCost, gross: rep.gross, expense: rep.expense, profit: rep.profit }
  };
}

// ==================== REPORT (PROFIT / LOSS) ====================
function _buildReport_(from, to, groupBy) {
  var orders = _getSheet_('Orders').getDataRange().getValues();
  var itemsMap = _getOrderItemsMap_();
  var pricing = _getProductPricingMap_();

  var groups = {};
  var T = { orders: 0, delivered: 0, pending: 0, returned: 0, exchange: 0, awaiting: 0, freeOrders: 0,
            collected: 0, productSales: 0, deliveryCollected: 0, freeCost: 0, cost: 0, discount: 0,
            gross: 0, expense: 0, profit: 0 };

  function G(k) {
    var gk = _groupKey_(k, groupBy);
    if (!groups[gk]) groups[gk] = { key: gk, orders: 0, delivered: 0, productSales: 0, cost: 0, freeCost: 0, expense: 0, profit: 0 };
    return groups[gk];
  }

  for (var i = 1; i < orders.length; i++) {
    var row = orders[i];
    if (!row[0]) continue;
    var k = _orderDateKey_(row);
    if (!k || k < from || k > to) continue;

    var g = G(k);
    T.orders++; g.orders++;
    var st = row[10];
    if (String(_safe_(row, 32)) === 'AWAITING') T.awaiting++;

    if (st === 'Delivered') {
      T.delivered++; g.delivered++;
      var disc = Number(_safe_(row, 24)) || 0;
      var ps = (Number(row[8]) || 0) - disc;
      var del = Number(row[5]) || 0;
      var free = String(_safe_(row, 28)).trim().toUpperCase() === 'YES';
      var freeDeliveryCost = String(_safe_(row, 35)) !== '' ? (Number(_safe_(row, 35)) || 0) : (free ? Math.max(del - 10, 0) : 0);

      T.collected += Number(row[9]) || 0;
      T.productSales += ps; g.productSales += ps;
      T.discount += disc;
      if (free) { T.freeOrders++; T.freeCost += freeDeliveryCost; g.freeCost += freeDeliveryCost; }
      else { T.deliveryCollected += del; }

      var items = itemsMap[row[0]];
      if (!items || items.length === 0) items = _fallbackItemsFromOrdersRow_(row);
      for (var j = 0; j < items.length; j++) {
        var qty = Number(items[j].qty) || 0;
        var p = pricing[items[j].sku];
        if (qty <= 0) continue;
        var buy = (items[j]._hasCostSnapshot ? Number(items[j].buyPrice) : (p ? Number(p.buyPrice) : 0)) || 0;
        var extra = (items[j]._hasCostSnapshot ? Number(items[j].extraCost) : (p ? Number(p.extraCost) : 0)) || 0;
        if (!p && !items[j]._hasCostSnapshot) continue;
        var c = (buy + extra) * qty;
        T.cost += c; g.cost += c;
      }
    } else if (st === 'Pending') T.pending++;
    else if (st === 'Return') T.returned++;
    else if (st === 'Exchange') T.exchange++;
  }

  _expenseEntries_().forEach(function (e) {
    if (!e.date || e.date < from || e.date > to) return;
    T.expense += e.amount;
    G(e.date).expense += e.amount;
  });

  var rows = Object.keys(groups).map(function (key) {
    var g = groups[key];
    g.profit = g.productSales - g.cost - g.freeCost - g.expense;
    ['productSales', 'cost', 'freeCost', 'expense', 'profit'].forEach(function (f) { g[f] = _r2_(g[f]); });
    return g;
  });
  rows.sort(function (a, b) { return a.key < b.key ? 1 : -1; });

  T.gross = T.productSales - T.cost - T.freeCost;
  T.profit = T.gross - T.expense;
  ['collected', 'productSales', 'deliveryCollected', 'freeCost', 'cost', 'discount', 'gross', 'expense', 'profit']
    .forEach(function (f) { T[f] = _r2_(T[f]); });

  return { from: from, to: to, groupBy: groupBy || 'day', totals: T, rows: rows };
}

function getReport(token, from, to, groupBy) {
  _auth_(token, ['Admin']);
  from = from || _todayKey_();
  to = to || from;
  return _buildReport_(from, to, groupBy);
}

// ==================== INVENTORY CRUD ====================
function addProduct(token, product) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = _getSheet_(PRODUCTS_SHEET);
    var statusCol = _getProductsStatusCol_();
    var bqCol = _getProductsBundleQtyCol_();
    var bpCol = _getProductsBundlePriceCol_();

    product = product || {};
    var sku = String(product.sku || '').trim();
    var name = String(product.name || '').trim();
    if (!sku) return { success: false, message: 'SKU আবশ্যক' };
    if (!name) return { success: false, message: 'Product Name আবশ্যক' };
    if (_findProductRowBySku_(sku) !== -1) return { success: false, message: 'এই SKU আগে থেকেই আছে: ' + sku };

    var category = String(product.category || '').trim();
    var variation = String(product.variation || '').trim();
    var buyPrice = Number(product.buyPrice) || 0;
    var sellPrice = Number(product.sellPrice) || 0;
    var extraCost = Number(product.extraCost) || 0;
    var stockNum = Number(product.stock);
    var stock = isNaN(stockNum) ? 0 : stockNum;
    var bundleQty = Number(product.bundleQty) || 0;
    var bundlePrice = Number(product.bundlePrice) || 0;

    sheet.appendRow([sku, name, category, variation, buyPrice, sellPrice, extraCost, stock, stock]);
    var newRow = sheet.getLastRow();
    sheet.getRange(newRow, statusCol).setValue('Active');
    sheet.getRange(newRow, bqCol).setValue(bundleQty);
    sheet.getRange(newRow, bpCol).setValue(bundlePrice);
    return { success: true, message: 'Product add হয়েছে' };
  } finally { lock.releaseLock(); }
}

function saveProduct(token, product, origSku) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    product = product || {};
    var sheet = _getSheet_(PRODUCTS_SHEET);
    var statusCol = _getProductsStatusCol_();
    var bqCol = _getProductsBundleQtyCol_();
    var bpCol = _getProductsBundlePriceCol_();

    var original = String(origSku || '').trim();
    var sku = String(product.sku || '').trim();
    var name = String(product.name || '').trim();
    if (!sku) return { success: false, message: 'SKU আবশ্যক' };
    if (!name) return { success: false, message: 'Product Name আবশ্যক' };

    var isNew = !original;
    var row = isNew ? -1 : _findProductRowBySku_(original);
    if (!isNew && row === -1) return { success: false, message: 'Product পাওয়া যায়নি: ' + original };

    var sameRow = _findProductRowBySku_(sku);
    if (sameRow !== -1 && sameRow !== row) return { success: false, message: 'এই SKU আগে থেকেই আছে: ' + sku };

    if (!isNew && sku !== original && _orderItemSkuExists_(original, '')) {
      return { success: false, message: 'এই SKU পুরনো order-এ ব্যবহৃত হয়েছে। Historical হিসাব ঠিক রাখতে SKU পরিবর্তন করা যাবে না।' };
    }

    var category = String(product.category || '').trim();
    var variation = String(product.variation || '').trim();
    var buyPrice = Number(product.buyPrice) || 0;
    var sellPrice = Number(product.sellPrice) || 0;
    var extraCost = Number(product.extraCost) || 0;
    var stockNum = Number(product.stock);
    var stock = isNaN(stockNum) ? 0 : stockNum;
    var bundleQty = Number(product.bundleQty) || 0;
    var bundlePrice = Number(product.bundlePrice) || 0;

    if (isNew) {
      sheet.appendRow([sku, name, category, variation, buyPrice, sellPrice, extraCost, stock, stock]);
      row = sheet.getLastRow();
      sheet.getRange(row, statusCol).setValue('Active');
    } else {
      var currentStatus = String(sheet.getRange(row, statusCol).getValue() || 'Active');
      var opening = sheet.getRange(row, 8).getValue();
      sheet.getRange(row, 1, 1, 9).setValues([[sku, name, category, variation, buyPrice, sellPrice, extraCost, opening, stock]]);
      sheet.getRange(row, statusCol).setValue(currentStatus || 'Active');
    }
    sheet.getRange(row, bqCol).setValue(bundleQty);
    sheet.getRange(row, bpCol).setValue(bundlePrice);
    return { success: true, message: isNew ? 'Product add হয়েছে' : 'Product update হয়েছে' };
  } finally { lock.releaseLock(); }
}

function deleteProduct(token, sku) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = _getSheet_(PRODUCTS_SHEET);
    sku = String(sku || '').trim();
    var row = _findProductRowBySku_(sku);
    if (row === -1) return { success: false, message: 'SKU পাওয়া যায়নি: ' + sku };
    if (_orderItemSkuExists_(sku, '')) {
      return { success: false, message: 'এই Product পুরনো/বর্তমান order-এ ব্যবহৃত হয়েছে। Historical হিসাব রক্ষার জন্য এটি hard delete করা যাবে না। Deactivate করুন।' };
    }
    sh.deleteRow(row);
    return { success: true, message: 'Product মুছে ফেলা হয়েছে' };
  } finally { lock.releaseLock(); }
}

function setProductStock(token, sku, newStock) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = _getSheet_(PRODUCTS_SHEET);
    var row = _findProductRowBySku_(sku);
    if (row === -1) return { success: false, message: 'SKU পাওয়া যায়নি: ' + sku };
    var stock = Number(newStock);
    if (isNaN(stock) || stock < 0) return { success: false, message: 'Stock অবশ্যই 0 বা তার বেশি সংখ্যা হতে হবে' };
    sheet.getRange(row, COL_CURRENT_STOCK).setValue(stock);
    return { success: true, message: 'Current Stock update হয়েছে' };
  } finally { lock.releaseLock(); }
}

function setProductActiveStatus(token, sku, makeActive) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = _getSheet_(PRODUCTS_SHEET);
    var statusCol = _getProductsStatusCol_();
    var row = _findProductRowBySku_(sku);
    if (row === -1) return { success: false, message: 'SKU পাওয়া যায়নি: ' + sku };
    if (makeActive) {
      sheet.getRange(row, statusCol).setValue('Active');
      return { success: true, message: 'Product restore হয়েছে (Active)' };
    }
    sheet.getRange(row, statusCol).setValue('Inactive');
    sheet.getRange(row, COL_CURRENT_STOCK).setValue(0);
    return { success: true, message: 'Product deactivate হয়েছে (Inactive) এবং Stock 0 করা হয়েছে' };
  } finally { lock.releaseLock(); }
}

function updateProductBundle(token, sku, bundleQty, bundlePrice) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = _getSheet_(PRODUCTS_SHEET);
    var row = _findProductRowBySku_(sku);
    if (row === -1) return { success: false, message: 'SKU পাওয়া যায়নি: ' + sku };
    sheet.getRange(row, _getProductsBundleQtyCol_()).setValue(Number(bundleQty) || 0);
    sheet.getRange(row, _getProductsBundlePriceCol_()).setValue(Number(bundlePrice) || 0);
    return { success: true, message: 'Bundle updated' };
  } finally { lock.releaseLock(); }
}

function duplicateProductBySku(token, sourceSku, newSku, newVariation) {
  _auth_(token, ['Admin']);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = _getSheet_(PRODUCTS_SHEET);
    var statusCol = _getProductsStatusCol_();
    var bqCol = _getProductsBundleQtyCol_();
    var bpCol = _getProductsBundlePriceCol_();

    sourceSku = String(sourceSku || '').trim();
    newSku = String(newSku || '').trim();
    newVariation = String(newVariation || '').trim();
    if (!sourceSku || !newSku) return { success: false, message: 'Source SKU এবং New SKU লাগবে' };

    var sourceRow = _findProductRowBySku_(sourceSku);
    if (sourceRow === -1) return { success: false, message: 'Source SKU পাওয়া যায়নি: ' + sourceSku };
    if (_findProductRowBySku_(newSku) !== -1) return { success: false, message: 'New SKU আগে থেকেই আছে: ' + newSku };

    var base = sheet.getRange(sourceRow, 1, 1, 9).getValues()[0];
    base[0] = newSku;
    if (newVariation) base[3] = newVariation;
    base[7] = 0;
    base[8] = 0;
    sheet.appendRow(base);
    var newRow = sheet.getLastRow();

    sheet.getRange(newRow, statusCol).setValue('Active');
    sheet.getRange(newRow, bqCol).setValue(Number(sheet.getRange(sourceRow, bqCol).getValue()) || 0);
    sheet.getRange(newRow, bpCol).setValue(Number(sheet.getRange(sourceRow, bpCol).getValue()) || 0);
    return { success: true, message: 'Product duplicated: ' + newSku };
  } finally { lock.releaseLock(); }
}
