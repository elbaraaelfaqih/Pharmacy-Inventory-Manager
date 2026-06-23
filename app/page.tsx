'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Eye, EyeOff, ChevronLeft,
  AlertTriangle,
  FileCheck2,
  Trash2,
  RefreshCw,
  TrendingDown,
  Database,
  ArrowDownToLine,
  Activity,
  User,
  ClipboardList,
  Flame,
  CornerDownLeft,
  ChevronRight,
  ExternalLink,
  Settings,
  X,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  Printer,
  BarChart3,
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Drug {
  id: string;
  name: string;
  quantity: number;
  alertLimit: number;
  alternative?: string;
  activeIngredient?: string;
  notes?: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface DispenseLog {
  id: string;
  drugId: string;
  drugName: string;
  quantity: number;
  dispensedAt: string;
  notes?: string;
  createdBy?: string;
}

export interface InvoiceItem {
  drugId: string;
  drugName: string;
  quantity: number;
}

export interface Invoice {
  id: string;
  recipientName: string;
  items: InvoiceItem[];
  dispensedAt: string;
  notes?: string;
  createdBy?: string;
}



// Initial realistic Arabic medications data for the pharmacy
const INITIAL_DRUGS: Drug[] = [
  {
    id: '00',
    name: 'بندول اكسترا (Panadol Extra)',
    quantity: 25,
    alertLimit: 10,
    alternative: 'أدول أو باراسيتامول عادي (Adol)',
    activeIngredient: 'باراسيتامول + كافيين (Paracetamol)',
    notes: 'مسكن آلام عام وخافض حرارة متوفر بانتظام.',
    updatedAt: new Date().toLocaleDateString('ar-EG'),
  },
  {
    id: '01',
    name: 'أوجمنتين 1 غرام (Augmentin)',
    quantity: 3,
    alertLimit: 8,
    alternative: 'كلاموكسين أو أموكسيل (Amoxil)',
    activeIngredient: 'أموكسيسيلين + كلافولانيك أسيد',
    notes: 'مضاد حيوي واسع الطيف - يفضل صرفه بوصفة دكتور.',
    updatedAt: new Date().toLocaleDateString('ar-EG'),
  },
  {
    id: '02',
    name: 'بروفين 400 ملغ (Brufen)',
    quantity: 18,
    alertLimit: 5,
    alternative: 'أيبوبروفين أو بروفيناك',
    activeIngredient: 'أيبوبروفين (Ibuprofen)',
    notes: 'مضاد للالتهابات ومسكن لآلام المفاصل والأسنان.',
    updatedAt: new Date().toLocaleDateString('ar-EG'),
  },
  {
    id: '03',
    name: 'فنتولين بخاخ جهاز الاستنشاق',
    quantity: 0,
    alertLimit: 5,
    alternative: 'أستالين بخاخ (Asthalin)',
    activeIngredient: 'سالبوتامول (Salbutamol)',
    notes: 'موسع للشعب الهوائية لحالات الربو وضيق التنفس.',
    updatedAt: new Date().toLocaleDateString('ar-EG'),
  },
  {
    id: '04',
    name: 'أوميبرازول 20 ملغ (Omeprazole)',
    quantity: 42,
    alertLimit: 10,
    alternative: 'رايسك أو رازون (Risek)',
    activeIngredient: 'أوميبرازول (Omeprazole)',
    notes: 'منظم لحموضة وحرقة المعدة ومضاد للقرحة الهضمية.',
    updatedAt: new Date().toLocaleDateString('ar-EG'),
  }
];

// Helper functions defined outside of the component to maintain pure rendering
function getNewId(existingDrugs?: { id: string }[]): string {
  if (!existingDrugs || existingDrugs.length === 0) return '00';
  const existingIds = existingDrugs.map(d => parseInt(d.id, 10)).filter(n => !isNaN(n));
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : -1;
  const nextNum = maxId + 1;
  return nextNum.toString().padStart(2, '0');
}

function getLogId(): string {
  return `L-${Date.now().toString().slice(-4)}`;
}

function getInvoiceId(existingInvoices?: { id: string }[]): string {
  if (!existingInvoices || existingInvoices.length === 0) return '00';
  const existingIds = existingInvoices.map(i => parseInt(i.id, 10)).filter(n => !isNaN(n));
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : -1;
  const nextNum = maxId + 1;
  return nextNum.toString().padStart(2, '0');
}

export interface Doctor {
  username: string;
  name: string;
  password: string;
  createdAt: string;
}

export default function PharmacyDashboard() {
  // --- States ---
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [dispenseLogs, setDispenseLogs] = useState<DispenseLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'inventory' | 'dispense' | 'logs' | 'reports' >('inventory');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isPrintingReport, setIsPrintingReport] = useState<boolean>(false);

  // --- Admin & Doctor Auth States ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('admin123'); // افتراضي مسبق
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string>('');
  const [newAdminPasswordInput, setNewAdminPasswordInput] = useState<string>('');
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isSettingsPwdVisible, setIsSettingsPwdVisible] = useState<boolean>(false);

  // --- Doctor Accounts Management States ---
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'doctor'>('admin');
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string>('المدير المشرف');
  const [usernameInput, setUsernameInput] = useState<string>(''); // For the login screen username input
  const [newDocName, setNewDocName] = useState<string>('');
  const [newDocUsername, setNewDocUsername] = useState<string>('');
  const [newDocPassword, setNewDocPassword] = useState<string>('');

  // --- Invoice/Fawateer States ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [invoiceRecipient, setInvoiceRecipient] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  // --- Quick Inventory Adjustments ---
  const [quickAmounts, setQuickAmounts] = useState<Record<string, string>>({});

  // --- Custom Confirmation Modal State ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDanger: false,
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDanger,
    });
  };

  // Input states for Add Drug Form
  const [newDrugId, setNewDrugId] = useState('');
  const [newDrugName, setNewDrugName] = useState('');
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newAlertLimit, setNewAlertLimit] = useState<number>(5);
  const [newAlternative, setNewAlternative] = useState('');
  const [newActiveIngredient, setNewActiveIngredient] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // --- Inline Quantity Editing State ---
  const [editingDrugId, setEditingDrugId] = useState<string | null>(null);
  const [editingQtyValue, setEditingQtyValue] = useState<string>('');

  // --- Add Alternative Medication Standalone States ---
  const [addAlternativeAsStandalone, setAddAlternativeAsStandalone] = useState<boolean>(false);
  const [altQuantity, setAltQuantity] = useState<number>(10);
  const [altAlertLimit, setAltAlertLimit] = useState<number>(5);
  const [altActiveIngredient, setAltActiveIngredient] = useState<string>('');
  const [altNotes, setAltNotes] = useState<string>('');
  
  // --- Print/Export Invoice State ---
  const [printSelectedInvoice, setPrintSelectedInvoice] = useState<Invoice | null>(null);

  // Input states for Dispense Medication Form
  const [selectDrugId, setSelectDrugId] = useState('');
  const [dispenseQuantity, setDispenseQuantity] = useState<number>(1);

  // Google Sheets Config State
  
  
  
  
  
  
  
  
  const [isSyncing, setIsSyncing] = useState(false);
   
  
  

  

  
  
  // Synchronized state refs for reliable background and real-time syncing
  const drugsRef = useRef<Drug[]>([]);
  const dispenseLogsRef = useRef<DispenseLog[]>([]);
  const invoicesRef = useRef<Invoice[]>([]);
  const syncQueuePromiseRef = useRef<Promise<void>>(Promise.resolve());
  const syncDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingLogsRef = useRef<DispenseLog[]>([]);

  useEffect(() => {
    drugsRef.current = drugs;
  }, [drugs]);

  useEffect(() => {
    dispenseLogsRef.current = dispenseLogs;
  }, [dispenseLogs]);

  useEffect(() => {
    invoicesRef.current = invoices;
  }, [invoices]);
  
  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // --- Load initial data from localStorage or fallback ---
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedDrugs = localStorage.getItem('pharmacy_drugs_v2');
      const savedLogs = localStorage.getItem('pharmacy_dispense_logs_v2');
      
      
      
      // تحميل كلمة مرور الأدمن (أو تعيين اللفظ الافتراضي admin123 في أول استخدام)
      const savedPassword = localStorage.getItem('pharmacy_admin_password');
      if (savedPassword) {
        setAdminPassword(savedPassword);
      } else {
        localStorage.setItem('pharmacy_admin_password', 'admin123');
      }

      // التحقق من حالة تسجيل الدخول النشطة
      const localLogin = localStorage.getItem('pharmacy_remember_login');
      const sessionLogin = sessionStorage.getItem('pharmacy_session_login');
      if (localLogin === 'true' || sessionLogin === 'true') {
        setIsLoggedIn(true);
        const storedRole = localStorage.getItem('pharmacy_user_role') || sessionStorage.getItem('pharmacy_user_role') || 'admin';
        const storedDisplayName = localStorage.getItem('pharmacy_user_display_name') || sessionStorage.getItem('pharmacy_user_display_name') || 'المدير المشرف';
        setUserRole(storedRole as 'admin' | 'doctor');
        setCurrentUserDisplayName(storedDisplayName);
      }

      const rememberCheck = localStorage.getItem('pharmacy_remember_check');
      if (rememberCheck !== null) {
        setRememberMe(rememberCheck === 'true');
      }

      // تحميل قائمة الأطباء المولدين
      const savedDoctors = localStorage.getItem('pharmacy_doctors');
      if (savedDoctors) {
        try {
          const parsed = JSON.parse(savedDoctors);
          if (Array.isArray(parsed)) {
            const seenUsernames = new Set<string>();
            const uniqueDocs = parsed.filter(doc => {
              if (!doc || !doc.username) return false;
              const normalized = doc.username.trim().toLowerCase();
              if (seenUsernames.has(normalized)) return false;
              seenUsernames.add(normalized);
              return true;
            });
            setDoctors(uniqueDocs);
          } else {
            setDoctors([]);
          }
        } catch {
          setDoctors([]);
        }
      } else {
        setDoctors([]);
      }

      if (savedDrugs) {
        try {
          const parsed = JSON.parse(savedDrugs);
          if (Array.isArray(parsed)) {
            const seenIds = new Set<string>();
            const uniqueDrugs = parsed.filter(drug => {
              if (!drug || !drug.id) return false;
              const id = drug.id.trim();
              if (seenIds.has(id)) return false;
              seenIds.add(id);
              return true;
            });
            setDrugs(uniqueDrugs);
          } else {
            setDrugs(INITIAL_DRUGS);
          }
        } catch {
          setDrugs(INITIAL_DRUGS);
        }
      } else {
        setDrugs(INITIAL_DRUGS);
        localStorage.setItem('pharmacy_drugs_v2', JSON.stringify(INITIAL_DRUGS));
      }

      if (savedLogs) {
        try {
          const parsed = JSON.parse(savedLogs);
          if (Array.isArray(parsed)) {
            const seenLogIds = new Set<string>();
            const uniqueLogs = parsed.filter(log => {
              if (!log || !log.id) return false;
              const id = log.id.trim();
              if (seenLogIds.has(id)) return false;
              seenLogIds.add(id);
              return true;
            });
            setDispenseLogs(uniqueLogs);
          }
        } catch {
          setDispenseLogs([]);
        }
      }

      const savedInvoices = localStorage.getItem('pharmacy_invoices_v2');
      if (savedInvoices) {
        try {
          const parsed = JSON.parse(savedInvoices);
          if (Array.isArray(parsed)) {
            const seenInvIds = new Set<string>();
            const uniqueInvoices = parsed.filter(inv => {
              if (!inv || !inv.id) return false;
              const id = inv.id.trim();
              if (seenInvIds.has(id)) return false;
              seenInvIds.add(id);
              return true;
            });
            setInvoices(uniqueInvoices);
          }
        } catch {
          setInvoices([]);
        }
      }

      
      
      
      
      
      
      
      
      
      
      
      
      
      
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  

  // Save changes to localstorage helper
  const saveDrugsToLocalStorage = (updatedDrugs: Drug[]) => {
    setDrugs(updatedDrugs);
    localStorage.setItem('pharmacy_drugs_v2', JSON.stringify(updatedDrugs));
  };

  const saveLogsToLocalStorage = (updatedLogs: DispenseLog[]) => {
    setDispenseLogs(updatedLogs);
    localStorage.setItem('pharmacy_dispense_logs_v2', JSON.stringify(updatedLogs));
  };

  const saveInvoicesToLocalStorage = (updatedInvoices: Invoice[]) => {
    setInvoices(updatedInvoices);
    localStorage.setItem('pharmacy_invoices_v2', JSON.stringify(updatedInvoices));
  };

  // --- Reports Calculation ---
  const getFilteredReportData = () => {
    const parseDateStr = (dateStr: string) => {
      if (!dateStr) return new Date();
      const arabicMap: Record<string, string> = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
      };
      let cleanStr = dateStr;
      for (const char in arabicMap) {
        cleanStr = cleanStr.replaceAll(char, arabicMap[char]);
      }
      
      const parts = cleanStr.match(/(\d+)\/(\d+)\/(\d+)/);
      if (parts) {
        const day = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10) - 1;
        const year = parseInt(parts[3], 10);
        
        const timeParts = cleanStr.match(/(\d+):(\d+):(\d+)/);
        let hour = 0, min = 0, sec = 0;
        if (timeParts) {
          hour = parseInt(timeParts[1], 10);
          min = parseInt(timeParts[2], 10);
          sec = parseInt(timeParts[3], 10);
          if ((cleanStr.includes('م') || cleanStr.toLowerCase().includes('pm')) && hour < 12) {
            hour += 12;
          }
          if ((cleanStr.includes('ص') || cleanStr.toLowerCase().includes('am')) && hour === 12) {
            hour = 0;
          }
        }
        return new Date(year, month, day, hour, min, sec);
      }
      return new Date(cleanStr) || new Date();
    };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);

    const filteredLogs = dispenseLogs.filter(log => {
      const d = parseDateStr(log.dispensedAt);
      if (reportPeriod === 'daily') return d >= startOfToday;
      if (reportPeriod === 'weekly') return d >= startOfWeek;
      return d >= startOfMonth;
    });

    const filteredInvoices = invoices.filter(inv => {
      const d = parseDateStr(inv.dispensedAt);
      if (reportPeriod === 'daily') return d >= startOfToday;
      if (reportPeriod === 'weekly') return d >= startOfWeek;
      return d >= startOfMonth;
    });

    const totalTransactions = filteredInvoices.length;
    const totalUnitsDispensed = filteredLogs.reduce((acc, curr) => acc + curr.quantity, 0);
    
    const drugCounts: Record<string, { qty: number; id: string; active: string }> = {};
    filteredLogs.forEach(log => {
      const dMatch = drugs.find(dr => dr.name === log.drugName);
      const activeIng = dMatch?.activeIngredient || 'غير معروف';
      const drugId = dMatch ? dMatch.id : '-';
      if (!drugCounts[log.drugName]) {
        drugCounts[log.drugName] = { qty: 0, id: drugId, active: activeIng };
      }
      drugCounts[log.drugName].qty += log.quantity;
    });

    const topDrugs = Object.entries(drugCounts)
      .map(([name, info]) => ({ name, qty: info.qty, id: info.id, active: info.active }))
      .sort((a, b) => b.qty - a.qty);

    const dispenserCounts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      const user = log.createdBy || 'غير محدد';
      dispenserCounts[user] = (dispenserCounts[user] || 0) + log.quantity;
    });
    
    const topDispensers = Object.entries(dispenserCounts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    const uniqueDrugsCount = Object.keys(drugCounts).length;

    // Filter alerting drugs currently
    const alertingDrugs = drugs.filter(d => d.quantity <= d.alertLimit);

    return {
      filteredLogs,
      filteredInvoices,
      totalTransactions,
      totalUnitsDispensed,
      topDrugs,
      topDispensers,
      uniqueDrugsCount,
      alertingDrugs,
    };
  };

  const exportReportToCSV = () => {
    const { filteredLogs, totalTransactions, totalUnitsDispensed, uniqueDrugsCount } = getFilteredReportData();
    let csvContent = "\uFEFF"; // BOM for Excel UTF-8
    
    // Title & Summaries
    const periodLabel = reportPeriod === 'daily' ? 'اليومي' : reportPeriod === 'weekly' ? 'الأسبوعي' : 'الشهري';
    csvContent += `تقرير الصيدلية ${periodLabel}\n`;
    csvContent += `تاريخ التصدير,${new Date().toLocaleDateString('ar-EG')}\n`;
    csvContent += `إجمالي العمليات,${totalTransactions}\n`;
    csvContent += `إجمالي عبوات الصرف,${totalUnitsDispensed}\n`;
    csvContent += `أصناف مختلفة مصروفة,${uniqueDrugsCount}\n\n`;
    
    // Table Headers
    csvContent += "الرقم التسلسلي,اسم الدواء,الكمية المصروفة,وقت العملية,ملاحظات العملية,بواسطة\n";
    
    // Rows
    filteredLogs.forEach((log) => {
      const escapedNotes = (log.notes || "").replace(/"/g, '""');
      const row = [
        log.id,
        `"${log.drugName.replace(/"/g, '""')}"`,
        log.quantity,
        `"${log.dispensedAt}"`,
        `"${escapedNotes}"`,
        `"${(log.createdBy || "-").replace(/"/g, '""')}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_الصيدلية_${periodLabel}_${new Date().toLocaleDateString('ar-EG')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Actions ---

  // Open Add Drug Modal Initializer
  const openAddDrug = () => {
    setNewDrugId(getNewId(drugs));
    setNewDrugName('');
    setNewQuantity(10);
    setNewAlertLimit(5);
    setNewAlternative('');
    setNewActiveIngredient('');
    setNewNotes('');
    setAddAlternativeAsStandalone(false);
    setAltQuantity(10);
    setAltAlertLimit(5);
    setAltActiveIngredient('');
    setAltNotes('');
    setShowAddModal(true);
  };

  // Add Medication Handlers

  const handleAddDrugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugName.trim()) {
      alert('الرجاء إدخال اسم الدواء.');
      return;
    }

    // Check if ID already exists
    const idExists = drugs.some(d => d.id === newDrugId);
    const finalId = idExists ? getNewId(drugs) : newDrugId;

    const originalAlternativeField = newAlternative.trim();

    const newDrug: Drug = {
      id: finalId,
      name: newDrugName.trim(),
      quantity: Number(newQuantity),
      alertLimit: Number(newAlertLimit),
      alternative: originalAlternativeField,
      activeIngredient: newActiveIngredient.trim(),
      notes: newNotes.trim() || undefined,
      updatedAt: new Date().toLocaleDateString('ar-EG'),
      createdBy: currentUserDisplayName,
      updatedBy: currentUserDisplayName,
    };

    let updatedDrugs = [newDrug, ...drugs];

    // If addAlternativeAsStandalone is checked and newAlternative is set, create the alternative drug record as well!
    if (originalAlternativeField && addAlternativeAsStandalone) {
      const altId = getNewId(updatedDrugs);
      const altName = originalAlternativeField;
      const finalAltActiveIngredient = altActiveIngredient.trim() || newActiveIngredient.trim();
      
      const newAltDrug: Drug = {
        id: altId,
        name: altName,
        quantity: Number(altQuantity),
        alertLimit: Number(altAlertLimit),
        alternative: newDrugName.trim(), // Mutually link them!
        activeIngredient: finalAltActiveIngredient,
        notes: altNotes.trim() ? altNotes.trim() : `دواء بديل مسجل تلقائياً لـ ${newDrugName.trim()}`,
        updatedAt: new Date().toLocaleDateString('ar-EG'),
        createdBy: currentUserDisplayName,
        updatedBy: currentUserDisplayName,
      };

      updatedDrugs = [newAltDrug, ...updatedDrugs];
    }

    saveDrugsToLocalStorage(updatedDrugs);
    setShowAddModal(false);

    // Reset alt states
    setAddAlternativeAsStandalone(false);
    setAltQuantity(10);
    setAltAlertLimit(5);
    setAltActiveIngredient('');
    setAltNotes('');

    // Auto-sync to google sheet if config is ready. Only sync inventory.
    
  };

  // Delete Medication Handler with Dialogue Confirmation
  const handleDeleteDrug = (id: string, name: string) => {
    triggerConfirm(
      'تأكيد حذف الدواء',
      `هل أنت متأكد من حذف الدواء "${name}" نهائياً من المخزون؟`,
      () => {
        const latestDrugs = drugsRef.current;
        const updatedDrugs = latestDrugs.filter((drug) => drug.id !== id);
        saveDrugsToLocalStorage(updatedDrugs);

        // Reset dispense select selection if deleted drug was selected
        if (selectDrugId === id) {
          setSelectDrugId('');
        }

        // Auto-sync. Only sync inventory
        
      },
      true
    );
  };

  // Helper functions for quick inventory adjustments
  const getQuickAmount = (id: string): number => {
    const val = quickAmounts[id];
    if (val === undefined || val === '') return 1;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  };

  const handleQuickAmountChange = (id: string, val: string) => {
    // Allow digits or empty string (to clear and type easily)
    if (val === '' || /^\d+$/.test(val)) {
      setQuickAmounts(prev => ({
        ...prev,
        [id]: val
      }));
    }
  };

  // Edit quantity directly in table
  const handleChangeAmount = (id: string, direction: 'add' | 'subtract') => {
    const step = getQuickAmount(id);
    const amount = direction === 'subtract' ? -step : step;

    const latestDrugs = drugsRef.current;
    const updatedDrugs = latestDrugs.map((drug) => {
      if (drug.id === id) {
        const newQty = Math.max(0, drug.quantity + amount);
        return {
          ...drug,
          quantity: newQty,
          updatedAt: new Date().toLocaleDateString('ar-EG'),
          updatedBy: currentUserDisplayName,
        };
      }
      return drug;
    });
    saveDrugsToLocalStorage(updatedDrugs);

    // Auto-sync. Only sync inventory.
    
  };

  // Inline Direct Quantity Edit Save Handler
  const handleInlineQtySave = (id: string, qtyTextValue: string) => {
    const parsed = parseInt(qtyTextValue, 10);
    if (isNaN(parsed) || parsed < 0) {
      setEditingDrugId(null);
      return;
    }

    const latestDrugs = drugsRef.current;
    const updatedDrugs = latestDrugs.map((drug) => {
      if (drug.id === id) {
        return {
          ...drug,
          quantity: parsed,
          updatedAt: new Date().toLocaleDateString('ar-EG'),
          updatedBy: currentUserDisplayName,
        };
      }
      return drug;
    });

    saveDrugsToLocalStorage(updatedDrugs);
    setEditingDrugId(null);

    // Auto-sync. Only sync inventory.
    
  };

  // Dispense Medication Handlers
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectDrugId) {
      alert('الرجاء اختيار دواء من القائمة أولاً.');
      return;
    }
    if (dispenseQuantity <= 0) {
      alert('الرجاء إدخال كمية صحيحة أكبر من الصفر.');
      return;
    }

    const selectedDrug = drugs.find((d) => d.id === selectDrugId);
    if (!selectedDrug) return;

    // Check if total quantity added (existing in cart + new quantity) exceeds stock
    const existingCartItem = cartItems.find((item) => item.drugId === selectDrugId);
    const existingQty = existingCartItem ? existingCartItem.quantity : 0;
    const totalRequestedQty = existingQty + dispenseQuantity;

    if (selectedDrug.quantity < totalRequestedQty) {
      alert(`الكمية المتوفرة من دواء "${selectedDrug.name}" في المخزن هي (${selectedDrug.quantity} وحدات فقط). الكمية الإجمالية المطلوبة للفاتورة تفوق المتوفر!`);
      return;
    }

    if (existingCartItem) {
      // Update quantity
      const updatedCart = cartItems.map((item) => {
        if (item.drugId === selectDrugId) {
          return { ...item, quantity: totalRequestedQty };
        }
        return item;
      });
      setCartItems(updatedCart);
    } else {
      // Add new item
      const newItem: InvoiceItem = {
        drugId: selectedDrug.id,
        drugName: selectedDrug.name,
        quantity: dispenseQuantity,
      };
      setCartItems([...cartItems, newItem]);
    }

    // Reset simple selection fields to let user add another
    setSelectDrugId('');
    setDispenseQuantity(1);
  };

  const handleRemoveFromCart = (drugId: string) => {
    setCartItems(cartItems.filter((item) => item.drugId !== drugId));
  };

  const handleClearCart = () => {
    triggerConfirm(
      'تصفير السلة',
      'هل أنت متأكد من إفراغ سلة الأدوية بالكامل وتصفير الفاتورة؟',
      () => {
        setCartItems([]);
      },
      true
    );
  };

  // Confirm and Dispense Entire Bill
  const handleDispenseInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('الرجاء إضافة دواء واحد على الأقل للسلة لكي تتمكن من إنشاء فاتورة وصرفها.');
      return;
    }

    const patientName = invoiceRecipient.trim() || 'غير محدد';
    const confirmMessage = `تأكيد صرف الفاتورة بالكامل وقيدها مجهولة التكلفة لصالح (${patientName})؟ تحتوي السلة على (${cartItems.length}) من الأدوية المختلفة.`;

    triggerConfirm(
      'تأكيد صرف الفاتورة',
      confirmMessage,
      () => {
        // Fetch absolute latest states from refs to prevent stale closure bugs
        const latestDrugs = drugsRef.current;
        const latestLogs = dispenseLogsRef.current;
        const latestInvoices = invoicesRef.current;

        // 1. Decrease Inventory quantity of all drugs in the invoice
        const updatedDrugs = latestDrugs.map((drug) => {
          const cartItem = cartItems.find((item) => item.drugId === drug.id);
          if (cartItem) {
            return {
              ...drug,
              quantity: Math.max(0, drug.quantity - cartItem.quantity),
              updatedAt: new Date().toLocaleDateString('ar-EG'),
              updatedBy: currentUserDisplayName,
            };
          }
          return drug;
        });

        const invoiceId = getInvoiceId(latestInvoices);
        const timeNow = new Date().toLocaleString('ar-EG');
        const noteText = invoiceNotes.trim() || 'صرف فاتورة أدوية متعددة';

        // 2. Create the custom Invoice Object
        const newInvoice: Invoice = {
          id: invoiceId,
          dispensedAt: timeNow,
          recipientName: patientName,
          items: cartItems,
          notes: noteText,
          createdBy: currentUserDisplayName,
        };

        // 3. Create DispenseLogs for transaction stream
        const newLogs: DispenseLog[] = cartItems.map((item, idx) => ({
          id: `${invoiceId}-${String(idx).padStart(2, '0')}`,
          drugId: item.drugId,
          drugName: item.drugName,
          quantity: item.quantity,
          dispensedAt: timeNow,
          notes: `تابع للفاتورة ${invoiceId} - المستلم: ${patientName}`,
          createdBy: currentUserDisplayName,
        }));

        const updatedLogs = [...newLogs, ...latestLogs];
        const updatedInvoices = [newInvoice, ...latestInvoices];

        // Persist
        saveDrugsToLocalStorage(updatedDrugs);
        saveLogsToLocalStorage(updatedLogs);
        saveInvoicesToLocalStorage(updatedInvoices);

        // Empty Cart and Client Input Fields
        setCartItems([]);
        setInvoiceRecipient('');
        setInvoiceNotes('');

        // Provide immediate visual notification feedback
        alert('تم صرف الفاتورة وتسجيل الأدوية في النظام بنجاح! 💾.');
      }
    );
  };

  // --- إدارة تسجيل دخول وخروج المستخدمين (أدمن / طبيب) ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setLoginError('الرجاء إدخال كلمة المرور أولاً.');
      return;
    }

    const typedUsername = usernameInput.trim() ? usernameInput.trim().toLowerCase() : 'admin';
    const pwd = passwordInput.trim();

    // 1. Check if login is main admin
    if (typedUsername === 'admin') {
      if (pwd === adminPassword) {
        setIsLoggedIn(true);
        setUserRole('admin');
        setCurrentUserDisplayName('المدير المشرف');
        setLoginError('');
        setPasswordInput('');
        setUsernameInput('');

        // حفظ جلسة تسجيل الدخول
        if (rememberMe) {
          localStorage.setItem('pharmacy_remember_login', 'true');
          localStorage.setItem('pharmacy_remember_check', 'true');
          localStorage.setItem('pharmacy_user_role', 'admin');
          localStorage.setItem('pharmacy_user_display_name', 'المدير المشرف');
        } else {
          sessionStorage.setItem('pharmacy_session_login', 'true');
          sessionStorage.setItem('pharmacy_user_role', 'admin');
          sessionStorage.setItem('pharmacy_user_display_name', 'المدير المشرف');
          localStorage.setItem('pharmacy_remember_check', 'false');
        }
        return;
      } else {
        setLoginError('عذراً! كلمة مرور المشرف (الأدمن) غير صحيحة، يرجى المحاولة مجدداً.');
        return;
      }
    }

    // 2. Check if login is a doctor
    const matchedDoctor = doctors.find(
      (doc) => doc.username.toLowerCase() === typedUsername && doc.password === pwd
    );

    if (matchedDoctor) {
      setIsLoggedIn(true);
      setUserRole('doctor');
      setCurrentUserDisplayName(matchedDoctor.name);
      setLoginError('');
      setPasswordInput('');
      setUsernameInput('');
      
      // If we are logged in as a doctor, we must not be on the sheets-config tab
      

      // حفظ جلسة تسجيل الدخول للطبيب
      if (rememberMe) {
        localStorage.setItem('pharmacy_remember_login', 'true');
        localStorage.setItem('pharmacy_remember_check', 'true');
        localStorage.setItem('pharmacy_user_role', 'doctor');
        localStorage.setItem('pharmacy_user_display_name', matchedDoctor.name);
      } else {
        sessionStorage.setItem('pharmacy_session_login', 'true');
        sessionStorage.setItem('pharmacy_user_role', 'doctor');
        sessionStorage.setItem('pharmacy_user_display_name', matchedDoctor.name);
        localStorage.setItem('pharmacy_remember_check', 'false');
      }
    } else {
      setLoginError('عذراً! اسم المستخدم أو كلمة المرور غير صحيحة لأي حساب طبيب مسجل أو مشرف.');
    }
  };

  const handleLogout = () => {
    triggerConfirm(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج وقفل لوحة التحكم؟',
      () => {
        setIsLoggedIn(false);
        setUserRole('admin');
        setCurrentUserDisplayName('المدير المشرف');
        setPasswordInput('');
        setUsernameInput('');
        localStorage.removeItem('pharmacy_remember_login');
        sessionStorage.removeItem('pharmacy_session_login');
        localStorage.removeItem('pharmacy_user_role');
        sessionStorage.removeItem('pharmacy_user_role');
        localStorage.removeItem('pharmacy_user_display_name');
        sessionStorage.removeItem('pharmacy_user_display_name');
      }
    );
  };

  // --- دالات إدارة حسابات الأطباء والموظفين المولدين ---
  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocUsername.trim() || !newDocPassword.trim()) {
      alert('الرجاء تعبئة كامل حقول الاستمارة لتتمكن من إضافة الطبيب.');
      return;
    }

    const cleanUsername = newDocUsername.trim().toLowerCase();
    
    if (cleanUsername === 'admin') {
      alert('ممنوع استخدام اسم المستخدم "admin" لحسابات الأطباء.');
      return;
    }

    // Check unique username constraint
    if (doctors.some((d) => d.username.toLowerCase() === cleanUsername)) {
      alert('اسم المستخدم هذا موجود ومحجوز مسبقاً لمستخدم آخر، يرجى كتابة اسم مستخدم فريد.');
      return;
    }

    const newDoctor: Doctor = {
      username: cleanUsername,
      name: newDocName.trim(),
      password: newDocPassword.trim(),
      createdAt: new Date().toLocaleDateString('ar-EG'),
    };

    const updated = [...doctors, newDoctor];
    setDoctors(updated);
    localStorage.setItem('pharmacy_doctors', JSON.stringify(updated));

    // Reset Form Fields
    setNewDocName('');
    setNewDocUsername('');
    setNewDocPassword('');

    
  };

  const handleDeleteDoctor = (usernameToDelete: string) => {
    const targetDoc = doctors.find((d) => d.username === usernameToDelete);
    if (!targetDoc) return;

    triggerConfirm(
      'إلغاء حساب الطبيب وتوقيف الدخول',
      `هل أنت متأكد من حذف حساب الطبيب الجاهز (${targetDoc.name}) بشكل نهائي؟ لن يقدر بعدها على الدخول للمنظومة.`,
      () => {
        const updated = doctors.filter((d) => d.username !== usernameToDelete);
        setDoctors(updated);
        localStorage.setItem('pharmacy_doctors', JSON.stringify(updated));
        
      },
      true
    );
  };

  const handleGenerateDocPassword = () => {
    const prefixes = ['doc', 'dr', 'tabeeb', 'shifa', 'ph', 'med'];
    const suffixes = ['care', 'clinic', 'heal', 'safe', 'plus', 'rx'];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const pfx = prefixes[Math.floor(Math.random() * prefixes.length)];
    const sfx = suffixes[Math.floor(Math.random() * suffixes.length)];
    const generated = `${pfx}-${sfx}-${randomNum}`;
    setNewDocPassword(generated);
  };

  // توليد كلمة مرور عشوائية آمنة وسهلة الحفظ للمصطلحات الطبية
  const handleGenerateNewPassword = () => {
    const prefixes = ['صيدلية', 'دواء', 'طبيب', 'صحة', 'مستودع', 'بندول', 'علاج'];
    const middleWords = ['نشط', 'امين', 'محمي', 'سريع', 'شفاء', 'دائم', 'كافي'];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const pfx = prefixes[Math.floor(Math.random() * prefixes.length)];
    const mid = middleWords[Math.floor(Math.random() * middleWords.length)];
    const generated = `${pfx}-${mid}-${randomNum}`;
    setNewAdminPasswordInput(generated);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPasswordInput.trim()) {
      alert('الرجاء إدخال كلمة مرور جديدة أو توليدها أولاً.');
      return;
    }
    
    if (newAdminPasswordInput.trim().length < 4) {
      alert('كلمة المرور قصيرة جداً، يرجى استخدام 4 خانات على الأقل لضمان الأمن.');
      return;
    }

    triggerConfirm(
      'تغيير كلمة المرور',
      'تأكيد تغيير كلمة مرور الأدمن بالكامل؟ سيتوجب عليك تسجيل الدخول في المرات المقبلة بالكلمة الجديدة.',
      () => {
        setAdminPassword(newAdminPasswordInput.trim());
        localStorage.setItem('pharmacy_admin_password', newAdminPasswordInput.trim());
        setNewAdminPasswordInput('');
        
      }
    );
  };

  


  // Helpers to check drug stocks for indicators
  const getStockStatus = (drug: Drug) => {
    if (drug.quantity === 0) return { label: 'نفذ', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    if (drug.quantity <= drug.alertLimit) return { label: 'منخفض', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'متوفر وبخير', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  };

  // Filtered drugs based on search input - fully robust against null/undefined values and supports tracking by ID
  const filteredDrugs = drugs.filter((drug) => {
    // Apply stock filter
    if (stockFilter === 'low' && !(drug.quantity > 0 && drug.quantity <= drug.alertLimit)) {
      return false;
    }
    if (stockFilter === 'out' && drug.quantity !== 0) {
      return false;
    }

    const q = searchQuery.toLowerCase();
    const nameMatch = (drug.name || '').toLowerCase().includes(q);
    const alternativeMatch = (drug.alternative || '').toLowerCase().includes(q);
    const activeMatch = (drug.activeIngredient || '').toLowerCase().includes(q);
    const notesMatch = (drug.notes || '').toLowerCase().includes(q);
    const idMatch = (drug.id || '').toLowerCase().includes(q);
    return nameMatch || alternativeMatch || activeMatch || notesMatch || idMatch;
  });

  // Calculate metrics
  const totalDrugs = drugs.length;
  const lowStockCount = drugs.filter(d => d.quantity > 0 && d.quantity <= d.alertLimit).length;
  const outOfStockCount = drugs.filter(d => d.quantity === 0).length;
  const dispenseCountToday = dispenseLogs.length;

  // --- شاشة تسجيل الدخول في حال لم يكن المستخدم مسجلاً دخولاً ---
  if (!isLoggedIn) {
    return (
      <div 
        className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans text-right" 
        id="login-screen-outer"
        dir="rtl"
      >
        {/* الخلفية والمؤثرات الجمالية بالتصميم الفاخر */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10" id="login-container">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl flex flex-col gap-6"
          >
            {/* الهوية البصرية اللطيفة للصيدلية */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="bg-gradient-to-tr from-emerald-400 to-teal-500 p-4 rounded-2xl shadow-emerald-500/20 shadow-lg text-slate-950 flex items-center justify-center">
                <Lock size={32} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-2">منظومة صيدليّتي الذكيّة</h1>
                <p className="text-xs text-slate-300 mt-1">بوابة تسجيل دخول المشرف والأطباء 🩺</p>
              </div>
            </div>

            {/* نموذج تسجيل الدخول */}
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4" id="admin-login-form">
              <div className="flex flex-col gap-1.5 text-right">
                <label className="text-xs font-bold text-slate-300 border-none">اسم المستخدم:</label>
                <div className="relative">
                  <span className="absolute right-3.5 top-3.5 text-slate-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="أكتب اسم المستخدم الخاص بك للدخول"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none text-left font-semibold"
                    dir="ltr"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-right">
                <label className="text-xs font-bold text-slate-300">كلمة المرور الخاصة بالحساب:</label>
                <div className="relative">
                  <span className="absolute right-3.5 top-3.5 text-slate-500">
                    <KeyRound size={16} />
                  </span>
                  <input
                    id="login-password-field"
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder=" أدخل كلمة المرور "
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none text-left"
                    dir="ltr"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-200"
                  >
                    {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                />
                <label htmlFor="remember-me" className="text-xs text-slate-400 select-none cursor-pointer">
                  تذكر الجلسة في هذا المتصفح
                </label>
              </div>

              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-center justify-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group focus:ring-2 focus:ring-emerald-500/30"
              >
                <span>دخول آمن</span>
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-right" dir="rtl">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm" id="dashboard-header">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-500 p-2 rounded-xl xl text-white shadow-emerald-500/20 shadow-md">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-slate-800 tracking-tight leading-tight">صيدليّتي الذكيّة</h2>
              <p className="text-[10px] md:text-xs text-slate-500 font-semibold flex items-center gap-1">
                مرحلة التشغيل والإنتاج
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              id="header-logout-btn"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-slate-800 hover:bg-rose-950/85 text-slate-350 hover:text-rose-200 border border-slate-700/50 hover:border-rose-900/60 cursor-pointer"
              title="تسجيل الخروج وقفل النظام"
            >
              <LogOut size={14} className="text-rose-400" />
              <span>خروج ({userRole === 'admin' ? 'المشرف' : 'الدكتور'})</span>
            </button>
          </div>
        </div>
      </header>
      <section className="bg-slate-100 border-b border-slate-200 py-6" id="dashboard-metrics-section">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div
            onClick={() => {
              setActiveTab('inventory');
              setStockFilter('all');
              setTimeout(() => {
                const el = document.getElementById('main-tabs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-98 cursor-pointer select-none"
            title="انقر للانتقال لجدول الأدوية كاملة"
          >
            <div>
              <span className="text-slate-500 text-xs font-semibold block">إجمالي أدوية المخزون</span>
              <span className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1 block font-mono">{totalDrugs}</span>
            </div>
            <div className="bg-slate-50 text-slate-600 p-3 rounded-xl">
              <ClipboardList size={22} />
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('inventory');
              setStockFilter('low');
              setTimeout(() => {
                const el = document.getElementById('main-tabs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="bg-white p-4 rounded-2xl border border-slate-250 flex items-center justify-between shadow-sm hover:shadow-md hover:border-amber-300 transition-all active:scale-98 cursor-pointer select-none"
            title="انقر للاستعراض والتصفية السريعة للنواقص"
          >
            <div>
              <span className="text-amber-600 text-xs font-semibold block">أدوية أوشكت على النفاد</span>
              <span className="text-2xl md:text-3xl font-extrabold text-amber-600 mt-1 block font-mono">{lowStockCount}</span>
            </div>
            <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-amber-50 text-amber-500 animate-bounce' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={22} />
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('inventory');
              setStockFilter('out');
              setTimeout(() => {
                const el = document.getElementById('main-tabs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md hover:border-rose-300 transition-all active:scale-98 cursor-pointer select-none"
            title="انقر لاستعراض الأدوية المنتهية أو الفارغة تماماً من المخزن"
          >
            <div>
              <span className="text-rose-600 text-xs font-semibold block">أدوية نفدت بالكامل</span>
              <span className="text-2xl md:text-3xl font-extrabold text-rose-600 mt-1 block font-mono">{outOfStockCount}</span>
            </div>
            <div className={`p-3 rounded-xl ${outOfStockCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
              <TrendingDown size={22} />
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('logs');
              setTimeout(() => {
                const el = document.getElementById('main-tabs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="bg-gradient-to-bl from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-sm hover:shadow-md hover:border-emerald-300 transition-all active:scale-98 cursor-pointer select-none animate-pulse-subtle"
            title="انقر للانتقال مباشرة لسجل تفاصيل الصرف اليومي"
          >
            <div>
              <span className="text-emerald-700 text-xs font-semibold block">أدوية صُرفت اليوم</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl md:text-3xl font-extrabold text-emerald-700 font-mono">{dispenseCountToday}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">(مجانية)</span>
              </div>
            </div>
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl">
              <FileCheck2 size={22} />
            </div>
          </div>

        </div>
      </section>

            {/* Main Content Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col gap-6" id="dashboard-main-content">
        
        {/* Navigation Tabs and Quick Search Panel */}
        <section id="main-tabs-section" className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-200 pb-2">
          
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 scrollbar-none overflow-x-auto self-start">
            <button
              id="tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <Database size={16} />
              <span>المخزون المتوفر</span>
            </button>

            <button
              id="tab-dispense"
              onClick={() => setActiveTab('dispense')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dispense'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <ArrowDownToLine size={16} />
              <span>صرف وفواتير</span>
            </button>

            <button
              id="tab-logs"
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-white text-amber-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <Activity size={16} />
              <span>حركة السجل</span>
            </button>

            {userRole === 'admin' && (
              <button
                id="tab-reports"
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <TrendingUp size={16} />
                <span>تقارير إحصائية</span>
              </button>
            )}
          </div>

          <div className="flex items-stretch flex-col md:flex-row md:items-center gap-3">
            {/* Quick search input */}
            {activeTab !== 'reports' && (
              <div className="flex items-center gap-2">
                {/* If in inventory tab, show the stock filters */}
                {activeTab === 'inventory' && (
                  <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setStockFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        stockFilter === 'all'
                          ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                    onClick={() => setStockFilter('low')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      stockFilter === 'low'
                        ? 'bg-amber-500 text-white shadow-sm border border-amber-600'
                        : 'text-amber-700 hover:text-amber-800 hover:bg-amber-50/50'
                    }`}
                  >
                    موشك على النفاد ({lowStockCount})
                  </button>
                  <button
                    onClick={() => setStockFilter('out')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      stockFilter === 'out'
                        ? 'bg-rose-600 text-white shadow-sm border border-rose-700'
                        : 'text-rose-750 hover:text-rose-900 hover:bg-rose-50/50'
                    }`}
                  >
                    نفد بالمخزن ({outOfStockCount})
                  </button>
                </div>
              )}

              <div className="relative w-full max-w-sm">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="search-input"
                  type="text"
                  placeholder="ابحث باسم الدواء، البديل، أو المادة الفعالة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-555 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-right focus:bg-slate-50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
          </div>
        </section>

        {/* Display Current View */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: INVENTORY MANAGEMENT */}
          {activeTab === 'inventory' && (
            <motion.div
              key="inventory-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {/* Table Toolbar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">جدول استعراض وتحرير مخازن الدواء</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    أدناه قائمة بكامل الأدوية المتوفرة ومراقبة مستويات العجز وأسمائهم وموادهم الفعالة وبدائلهم المقترحة.
                  </p>
                </div>
                <button
                  id="add-medicine-btn"
                  onClick={openAddDrug}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-750 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-md shrink-0 focus:ring-2 focus:ring-emerald-500/30"
                >
                  <Plus size={16} />
                  إضافة دواء جديد للمخزن
                </button>
              </div>

              {/* Inventory Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="inventory-table-container">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/85 text-slate-600 border-b border-slate-200 text-xs font-bold font-sans">
                        <th className="p-4 w-16">الكود</th>
                        <th className="p-4 min-w-[200px]">اسم الدواء التجاري</th>
                        <th className="p-4 min-w-[150px]">المادة الفعالة</th>
                        <th className="p-4">الكمية المتوفرة</th>
                        <th className="p-4">الدواء البديل المقترح</th>
                        <th className="p-4 w-28 text-center">تحديث سريع</th>
                        <th className="p-4 w-20 text-center">أدوات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-xs md:text-sm">
                      {filteredDrugs.length > 0 ? (
                        filteredDrugs.map((drug) => {
                          const status = getStockStatus(drug);
                          return (
                            <motion.tr
                              key={drug.id}
                              className={`hover:bg-slate-50/50 transition-colors ${
                                drug.quantity === 0
                                  ? 'bg-rose-50/20'
                                  : drug.quantity <= drug.alertLimit
                                  ? 'bg-amber-50/10'
                                  : ''
                              }`}
                              id={`drug-row-${drug.id}`}
                            >
                              <td className="p-4 font-mono font-semibold text-slate-500">{drug.id}</td>
                              <td className="p-4">
                                <div className="font-bold text-slate-800">{drug.name}</div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {drug.notes && (
                                    <div className="text-[11px] text-slate-450 font-normal bg-slate-50/80 px-2 py-0.5 rounded border border-slate-100 inline-block text-slate-500">
                                      {drug.notes}
                                    </div>
                                  )}
                                  {drug.createdBy && (
                                    <span className="text-[10px] text-slate-400 font-normal bg-slate-50/50 px-1.5 py-0.5 rounded border border-slate-100 max-h-5 flex items-center justify-center">
                                      بواسطة: {drug.createdBy}
                                    </span>
                                  )}
                                  {drug.updatedBy && drug.updatedBy !== drug.createdBy && (
                                    <span className="text-[10px] text-amber-500/80 font-normal bg-amber-50/30 px-1.5 py-0.5 rounded border border-amber-100/30 max-h-5 flex items-center justify-center">
                                      تعديل: {drug.updatedBy}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-slate-600 font-medium">
                                {drug.activeIngredient || 'غير محدد'}
                              </td>
                               <td className="p-4">
                                {editingDrugId === drug.id ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      value={editingQtyValue}
                                      onChange={(e) => setEditingQtyValue(e.target.value)}
                                      onBlur={() => handleInlineQtySave(drug.id, editingQtyValue)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleInlineQtySave(drug.id, editingQtyValue);
                                        } else if (e.key === 'Escape') {
                                          setEditingDrugId(null);
                                        }
                                      }}
                                      autoFocus
                                      className="w-20 p-1.5 text-center font-mono font-bold border border-emerald-500 rounded-lg text-xs focus:outline-none bg-white text-slate-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleInlineQtySave(drug.id, editingQtyValue)}
                                      className="p-1 px-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-250 cursor-pointer text-xs font-bold"
                                      title="حفظ"
                                    >
                                      ✓
                                    </button>
                                  </div>
                                ) : (
                                  <span 
                                    onClick={() => {
                                      setEditingDrugId(drug.id);
                                      setEditingQtyValue(String(drug.quantity));
                                    }}
                                    className={`font-mono font-bold text-xs px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-105 hover:shadow-xs border border-dashed border-slate-300 hover:border-emerald-400 transition-all inline-flex items-center gap-1 select-none ${
                                      drug.quantity === 0
                                        ? 'text-rose-600 bg-rose-50 border-rose-200'
                                        : drug.quantity <= drug.alertLimit
                                        ? 'text-amber-600 bg-amber-50 border-amber-200'
                                        : 'text-slate-800 bg-slate-50'
                                    }`}
                                    title="انقر هنا لكتابة رقم وتعديل القيمة مباشرة"
                                  >
                                    <span>{drug.quantity} وحدات</span>
                                    <span className="text-[10px] opacity-75">✏️</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                {drug.alternative ? (
                                  <div className="text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-xl border border-emerald-100 text-xs font-semibold inline-flex items-center gap-1.5">
                                    <CornerDownLeft size={12} className="text-emerald-500 text-emerald-600" />
                                    <span>{drug.alternative}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">لا يوجد بديل مسجل</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1 font-sans">
                                  <button
                                    onClick={() => handleChangeAmount(drug.id, 'subtract')}
                                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center text-xs cursor-pointer"
                                    title="خصم من المخزون"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="text"
                                    value={quickAmounts[drug.id] !== undefined ? quickAmounts[drug.id] : '1'}
                                    onChange={(e) => handleQuickAmountChange(drug.id, e.target.value)}
                                    className="w-12 h-7 rounded-lg border border-slate-200 text-center text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                                    title="أدخل مقدار الزيادة أو النقص"
                                  />
                                  <button
                                    onClick={() => handleChangeAmount(drug.id, 'add')}
                                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center text-xs cursor-pointer"
                                    title="إضافة للمخزون"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  id={`delete-btn-${drug.id}`}
                                  onClick={() => handleDeleteDrug(drug.id, drug.name)}
                                  className="p-1 px-2.5 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg transition-all cursor-pointer"
                                  title="حذف الدواء"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            لا يوجد أدوية تطابق بحثك حالياً. هل ترغب في تسجيل دواء جديد؟
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'dispense' && (
            <motion.div
              key="dispense-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Column 1: Add Drug to Cart Form (4 cols wide) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                       <Plus size={18} className="text-emerald-600" />
                      إضافة دواء للفاتورة الحالية
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      اختر الدواء من المخزون والكمية المناسبة لإضافته إلى سلة الصرف للفاتورة الحالية المتعددة الأدوية.
                    </p>
                  </div>

                  <form onSubmit={handleAddToCart} className="flex flex-col gap-4" id="add-to-cart-form">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">الدواء المطلوب:</label>
                      <select
                        id="dispense-drug-select"
                        value={selectDrugId}
                        onChange={(e) => setSelectDrugId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">-- اختر الدواء المطلوب --</option>
                        {drugs.map((drug) => (
                          <option key={drug.id} value={drug.id} disabled={drug.quantity === 0}>
                            {drug.name} ({drug.quantity} متوفر) {drug.quantity === 0 ? '- [نفذ]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">الكمية المطلوبة:</label>
                      <input
                        id="dispense-quantity-input"
                        type="number"
                        min={1}
                        value={dispenseQuantity}
                        onChange={(e) => setDispenseQuantity(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-500 focus:outline-none text-right font-mono"
                      />
                    </div>

                    <button
                      id="add-to-cart-btn"
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-l from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>إضافة الدواء للفاتورة الحالية ➕</span>
                    </button>
                  </form>
                </div>

                {/* Real-time Assistant / Alternatives panel */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Sparkles size={18} className="text-emerald-650 text-emerald-600" />
                      مساعد البدائل والنواقص الفوري
                    </h3>
                  </div>

                  {selectDrugId ? (
                    (() => {
                      const selected = drugs.find((d) => d.id === selectDrugId);
                      if (!selected) return null;
                      const status = getStockStatus(selected);
                      const isLow = selected.quantity <= selected.alertLimit;

                      return (
                        <div className="flex flex-col gap-3" id="consultation-result">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex flex-col gap-2">
                            <div>
                              <span className="text-[10px] text-slate-500 block">الدواء المختار حالياً:</span>
                              <span className="font-bold text-slate-800 text-xs">{selected.name}</span>
                            </div>
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-slate-500 text-[10px]">الكمية المتوفرة: <strong className="text-slate-800 font-mono text-xs">{selected.quantity} وحدات</strong></span>
                              <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          </div>

                          {isLow ? (
                            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-250 flex flex-col gap-1.5">
                              <span className="font-bold text-amber-950 text-xs block">بدائل الدواء المقترحة:</span>
                              <p className="text-[10px] text-amber-800 font-sans">
                                كمية الدواء المتبقية منخفضة ({selected.quantity} وحدات). اعتمد هذا البديل المقترح:
                              </p>
                              {selected.alternative ? (
                                <div className="mt-1 bg-emerald-50 border border-emerald-250 p-2.5 rounded-lg text-xs leading-relaxed">
                                  <span className="font-extrabold text-emerald-900 block">{selected.alternative}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-rose-700 font-bold">لا يوجد دواء بديل مسجل بقواعد البيانات لهذا العنصر.</span>
                              )}
                            </div>
                          ) : (
                            <div className="bg-emerald-50/55 p-3 rounded-xl border border-emerald-150 text-[11px] text-emerald-850">
                              مخزون الدواء سليم وآمن للصرف. لا داعي للبدائل الطبية حالياً.
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 opacity-75 border border-dashed border-slate-200 rounded-xl" id="consultation-empty">
                      <Activity size={24} className="text-slate-400 mb-2 animate-pulse" />
                      <span className="text-[10px] text-slate-500 font-semibold font-sans">اختر دواء لتلقي الاستشارة الطبية الفورية هنا.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: The Active Draft Bill (4 cols wide) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -z-10" />
                  
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-450 border border-emerald-500/30">
                      فاتورة الصرف النشطة 🧾
                    </span>
                    <h3 className="font-bold text-slate-100 text-lg mt-1.5 flex items-center gap-2">
                      محتويات الفاتورة قيد البناء
                    </h3>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3" id="cart-empty-placeholder">
                      <div className="w-12 h-12 rounded-full border border-slate-850 flex items-center justify-center text-slate-500 bg-slate-950/45">
                         🛒
                      </div>
                      <span className="text-xs font-semibold text-slate-400">سلة الفاتورة فارغة حالياً</span>
                      <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                        قم باختيار الأدوية من العمود الأيمن وإضافتها لكي تظهر في هذه السلة لتأسيس الفاتورة وصرفها معاً.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4" id="cart-filled-view">
                      {/* Cart Items List */}
                      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                        {cartItems.map((item) => (
                          <div 
                            key={item.drugId} 
                            className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs transition-colors hover:bg-slate-950/70"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-xs">{item.drugName}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5 font-mono">الكمية: {item.quantity} وحدات</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.drugId)}
                              className="text-rose-450 hover:text-rose-350 font-sans font-bold cursor-pointer text-xs p-1"
                              title="إزالة من السلة"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleDispenseInvoiceSubmit} className="flex flex-col gap-4 border-t border-slate-800 pt-3">
                        <div className="flex flex-col gap-1.5 text-right font-sans">
                          <label className="text-[10px] tracking-wider uppercase font-bold text-slate-400">اسم المستلم أو المريض:</label>
                          <input
                            type="text"
                            placeholder="اكتب اسم المستحق الكامل هنا..."
                            value={invoiceRecipient}
                            onChange={(e) => setInvoiceRecipient(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-850 text-xs text-right focus:border-emerald-500 focus:outline-none bg-slate-950/60 text-white placeholder:text-slate-500 font-bold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5 text-right font-sans">
                          <label className="text-[10px] tracking-wider uppercase font-bold text-slate-400">ملاحظات الفاتورة الاختيارية:</label>
                          <textarea
                            placeholder="مثال: الجرعة أو السن أو ملاحظات الصيدلي..."
                            value={invoiceNotes}
                            onChange={(e) => setInvoiceNotes(e.target.value)}
                            rows={2}
                            className="w-full p-2.5 rounded-xl border border-slate-850 text-xs text-right focus:border-emerald-500 focus:outline-none bg-slate-950/60 text-white placeholder:text-slate-500"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleClearCart}
                            className="flex-1 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                          >
                            تصفير السلة 🗑️
                          </button>
                          
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer text-center"
                          >
                            صرف الفاتورة بالكامل 🚀
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Recent Invoices List (4 cols wide) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      📃
                      الفواتير الأخيرة المصروفة اليوم
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      كشف بالفواتير الممنوحة وتاريخها للطباعة وتصديرها كملف PDF.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1" id="invoice-history-list">
                    {invoices.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-75 border border-dashed border-slate-250 rounded-xl">
                        <span className="text-xs">لم يتم صرف أي فواتير اليوم حتى الآن.</span>
                      </div>
                    ) : (
                      invoices.map((invoice) => (
                        <div 
                          key={invoice.id} 
                          className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex flex-col gap-2 transition-all hover:border-indigo-200"
                        >
                          <div className="flex items-center justify-between text-[11px] font-sans">
                            <span className="font-bold text-indigo-750 bg-indigo-50 px-2 py-0.5 rounded font-mono text-[10px]">
                              {invoice.id}
                            </span>
                            <span className="text-[9px] text-slate-450 font-mono">
                              {invoice.dispensedAt}
                            </span>
                          </div>

                          <div className="text-xs">
                            <span className="text-slate-450 block text-[9px]">المستلم / المريض:</span>
                            <span className="font-bold text-slate-800">{invoice.recipientName}</span>
                            {invoice.createdBy && (
                              <span className="text-[10px] text-slate-400 font-normal block mt-1">
                                صُرفت بواسطة: {invoice.createdBy}
                              </span>
                            )}
                          </div>

                          <div className="border-t border-slate-200/50 my-0.5" />

                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-slate-450 font-bold block mb-0.5">تفصيل الأدوية:</span>
                            {invoice.items.map((item, idx) => (
                              <div key={`${invoice.id}-${item.drugId}-${idx}`} className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded border border-slate-100/80 font-sans">
                                <span className="text-slate-800 font-medium truncate max-w-[170px]" title={item.drugName}>
                                  {item.drugName}
                                </span>
                                <span className="font-mono text-indigo-600 font-bold shrink-0">
                                  {item.quantity} وحدات
                                </span>
                              </div>
                            ))}
                          </div>

                          {invoice.notes && (
                            <div className="bg-indigo-50/30 p-2 rounded text-[10px] text-slate-700 border border-indigo-100/40 mt-1 font-sans">
                              <strong>ملاحظات:</strong> {invoice.notes}
                            </div>
                          )}

                          <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-150/50">
                            <button
                              type="button"
                              onClick={() => setPrintSelectedInvoice(invoice)}
                              className="text-[10px] text-indigo-750 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-150/80 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                              title="طباعة تفاصيل الفاتورة وتصديرها كـ PDF"
                            >
                              <Printer size={12} />
                              <span>طباعة وتصدير PDF 🖨️</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: DISPENSING LOGS */}
          {activeTab === 'logs' && (
            <motion.div
              key="logs-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800 text-base font-sans">سجلات الصرف والتحركات اليومية</h3>
                  <p className="text-xs text-slate-550 mt-1 font-sans">
                    كشف تاريخي بكافة الأدوية الممنوحة مجاناً للمواطنين والمرضى اليوم لتصديرها لقوقل شيت.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerConfirm(
                        'تصفير السجل اليومي',
                        'هل أنت متأكد من تصفير سجل العمليات اليوم محلياً؟ (لن يؤثر ذلك على قوقل شيت).',
                        () => {
                          saveLogsToLocalStorage([]);
                        },
                        true
                      );
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-rose-600 rounded-xl transition-all text-xs font-semibold shrink-0 cursor-pointer text-center font-sans"
                  >
                    تصفير السجل اليومي
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="logs-table-container">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-bold font-sans">
                        <th className="p-4">رقم العملية</th>
                        <th className="p-4">اسم الدواء المصروف</th>
                        <th className="p-4">الكمية</th>
                        <th className="p-4">التكلفة</th>
                        <th className="p-4">توقيت الصرف</th>
                        <th className="p-4">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-xs md:text-sm">
                      {dispenseLogs.length > 0 ? (
                        dispenseLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors font-sans w-full">
                            <td className="p-4 font-mono text-slate-500 font-bold">{log.id}</td>
                            <td className="p-4 font-bold text-slate-850">
                              <div>{log.drugName}</div>
                              {log.createdBy && (
                                <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                                  بواسطة: {log.createdBy}
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg border border-emerald-100 font-mono">
                                {log.quantity} وحدات
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-500">
                              مجاني
                            </td>
                            <td className="p-4">
                              <div className="text-slate-800 font-semibold">{new Date(log.dispensedAt).toLocaleDateString('en-GB')}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(log.dispensedAt).toLocaleTimeString('en-GB')}</div>
                            </td>
                            <td className="p-4 text-slate-600 max-w-[120px] truncate" title={log.notes}>
                              {log.notes || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                            لا توجد سجلات صرف اليوم.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
          {/* TAB 4: REPORTS AND STATS */}
          {activeTab === 'reports' && (
            <motion.div
              key="reports-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-6"
            >
              {(() => {
                const topDrugs = Array.from(dispenseLogs.reduce((acc, log) => {
                  if (!acc.has(log.drugId)) {
                    acc.set(log.drugId, { name: log.drugName, qty: 0, active: drugs.find(i => i.id === log.drugId)?.activeIngredient || '-' });
                  }
                  acc.get(log.drugId)!.qty += log.quantity;
                  return acc;
                }, new Map<string, {name: string, qty: number, active: string}>()).values())
                .sort((a, b) => b.qty - a.qty);
                const topDispensers = Array.from(dispenseLogs.reduce((acc, log) => {
                  const name = log.createdBy || 'طاقم العيادة';
                  if (!acc.has(name)) acc.set(name, { name, qty: 0 });
                  acc.get(name)!.qty += 1;
                  return acc;
                }, new Map<string, {name: string, qty: number}>()).values())
                .sort((a, b) => b.qty - a.qty);
                const totalDispensedQty = dispenseLogs.reduce((sum, log) => sum + log.quantity, 0);
                const uniqueDrugsCount = new Set(dispenseLogs.map(log => log.drugId)).size;
                const alertingDrugs = drugs.filter(d => Number(d.quantity) <= Number(d.alertLimit));
                return (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-450 font-bold font-sans">الأصناف المصروفة الفريدة</span>
                          <span className="text-2xl font-black text-slate-850 mt-1">{uniqueDrugsCount}</span>
                          <span className="text-[10px] text-amber-600 font-sans mt-0.5 font-bold">صنف دوائي مستقل ونشط</span>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-bold shrink-0">
                          <ClipboardList size={22} />
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-450 font-bold font-sans">الأصناف لتنبيه النقص</span>
                          <span className="text-2xl font-black text-rose-600 mt-1">{alertingDrugs.length}</span>
                          <span className="text-[10px] text-rose-600 font-sans mt-0.5 font-bold">بحاجة لمقدار تغذية عاجل</span>
                        </div>
                        <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600 font-bold shrink-0">
                          <AlertTriangle size={22} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
                          <h4 className="text-sm font-bold text-slate-800 font-sans flex items-center gap-1.5">
                            <span>الأصناف الأكثر صرفاً واستهلاكاً 📈</span>
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-sans">
                                  <th className="pb-2">اسم الصنف</th>
                                  <th className="pb-2">الكمية المصروفة</th>
                                  <th className="pb-2 font-mono">المادة الفعالة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {topDrugs.slice(0, 5).map((drug, index) => (
                                  <tr key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-2.5 font-bold text-slate-800">{drug.name}</td>
                                    <td className="py-2.5 font-bold text-indigo-600 font-mono">{drug.qty} عبوة</td>
                                    <td className="py-2.5 text-slate-500">{drug.active}</td>
                                  </tr>
                                ))}
                                {topDrugs.length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="py-6 text-center text-slate-400 font-sans">لا توجد أدوية مصروفة في هذه الفترة.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
                          <h4 className="text-sm font-bold text-slate-800 font-sans">نشاط الصرف حسب الطاقم الطبي 🩺</h4>
                          <div className="flex flex-col gap-3 font-sans">
                            {topDispensers.map((disp, idx) => (
                              <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-2 text-xs last:border-0">
                                <span className="text-slate-700 font-medium flex items-center gap-1.5 font-sans">
                                  <User size={14} className="text-slate-400" />
                                  {disp.name}
                                </span>
                                <span className="font-mono font-bold bg-indigo-50 text-indigo-650 px-2.5 py-0.5 rounded-full">
                                  {disp.qty} عملية صرف
                                </span>
                              </div>
                            ))}
                            {topDispensers.length === 0 && (
                              <p className="text-xs text-slate-400 text-center py-6 font-sans">لم يتم تسجيل عمليات صرف بواسطة أي مستعمل بعد.</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
                          <h4 className="text-sm font-bold text-rose-600 flex items-center gap-1.5 flex-wrap font-sans">
                            <AlertTriangle size={16} />
                            الأصناف الحرجة (تحت حد التنبيه) ⚠️
                          </h4>
                          <div className="flex flex-col gap-3 font-sans">
                            {alertingDrugs.map((drug, index) => (
                              <div key={index} className="flex items-center justify-between border-b border-rose-50 pb-2 text-xs last:border-0">
                                <span className="text-slate-800 font-bold">{drug.name}</span>
                                <span className="text-rose-600 font-bold font-mono">باقي {drug.quantity} عبوة</span>
                              </div>
                            ))}
                            {alertingDrugs.length === 0 && (
                              <p className="text-xs text-emerald-600 text-center py-6 block font-sans">جميع الأصناف بمستوى آمن وفوق حد التنبيه! 👍</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-100 border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500" id="dashboard-footer">
        <p className="max-w-md mx-auto leading-relaxed px-4">
          جميع حقوق الاستخدام والتوزيع لبرمجية إدارة الأدوية محفوظة <a href="https://wa.me/970597396239" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-500 underline font-semibold transition-colors cursor-pointer">م.البراء محمود</a> © {new Date().getFullYear()}. تتوفر حماية الخصوصية للمخزن محلياً .
        </p>
      </footer>

      {/* DIALOG ADD MEDICINE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-550" id="add-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden focus:outline-none"
              id="add-modal-dialog"
            >
              {/* Modal header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-slate-900 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">{newDrugId}</span>
                  <h3 className="font-bold text-sm md:text-base">إدراج دواء جديد في مخزن الصيدلية</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal content body */}
              <form onSubmit={handleAddDrugSubmit} className="p-6 flex flex-col gap-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">اسم الدواء التجاري:</label>
                    <input
                      id="new-drug-name-input"
                      type="text"
                      required
                      placeholder="امثلة: بروفين 400 ملغ"
                      value={newDrugName}
                      onChange={(e) => setNewDrugName(e.target.value)}
                      className="p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-500 focus:outline-none text-right"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">المادة الفعالة (العلمية):</label>
                    <input
                      id="new-active-ingredient-input"
                      type="text"
                      placeholder="امثلة: أيبوبروفين"
                      value={newActiveIngredient}
                      onChange={(e) => setNewActiveIngredient(e.target.value)}
                      className="p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-500 focus:outline-none text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">الكمية المتوفرة حالياً:</label>
                    <input
                      id="new-quantity-input"
                      type="number"
                      min={0}
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(Number(e.target.value))}
                      className="p-2.5 rounded-xl border border-slate-200 text-xs text-right font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">حد التنبيه (Low stock alert):</label>
                    <input
                      id="new-alert-limit-input"
                      type="number"
                      min={1}
                      value={newAlertLimit}
                      onChange={(e) => setNewAlertLimit(Number(e.target.value))}
                      className="p-2.5 rounded-xl border border-slate-200 text-xs text-right font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 text-emerald-700 bg-emerald-50/50 p-1.5 rounded-xl border border-emerald-100">
                    <Sparkles size={14} className="text-emerald-600" />
                    <span>اسم الدواء البديل المقترح (في حال نفاذ هذا الدواء):</span>
                  </label>
                  <input
                    id="new-alternative-input"
                    type="text"
                    placeholder="امثلة: أدول أو مسكادول في حال نفاذ البندول"
                    value={newAlternative}
                    onChange={(e) => setNewAlternative(e.target.value)}
                    className="p-2.5 rounded-xl border border-emerald-200/85 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-right text-xs placeholder:text-slate-400"
                  />

                  {newAlternative.trim().length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-emerald-50/45 rounded-xl border border-emerald-150 flex flex-col gap-3 font-sans mt-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="add-alt-standalone-checkbox"
                          checked={addAlternativeAsStandalone}
                          onChange={(e) => setAddAlternativeAsStandalone(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                        />
                        <label htmlFor="add-alt-standalone-checkbox" className="text-xs font-bold text-emerald-800 cursor-pointer select-none">
                          تسجيل هذا البديل (&quot;{newAlternative.trim()}&quot;) كدواء مستقل في النظام أيضاً تلقائياً
                        </label>
                      </div>

                      {addAlternativeAsStandalone && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-200/50 text-right"
                        >
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-600">كمية الدواء البديل المتوفرة مسبقاً:</label>
                            <input
                              type="number"
                              min={0}
                              value={altQuantity}
                              onChange={(e) => setAltQuantity(Number(e.target.value))}
                              className="p-2 rounded-lg border border-slate-200 text-xs text-right font-mono focus:border-emerald-500 focus:outline-none bg-white text-slate-800"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-600">حد تنبيه البديل (Low stock limit):</label>
                            <input
                              type="number"
                              min={1}
                              value={altAlertLimit}
                              onChange={(e) => setAltAlertLimit(Number(e.target.value))}
                              className="p-2 rounded-lg border border-slate-200 text-xs text-right font-mono focus:border-emerald-500 focus:outline-none bg-white text-slate-800"
                            />
                          </div>

                          <div className="flex flex-col gap-1 sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-600">المادة الفعالة للبديل (اختياري - يترك فارغاً لنسخ مادة الدواء الأصلي):</label>
                            <input
                              type="text"
                              placeholder={newActiveIngredient ? `${newActiveIngredient} (تلقائي)` : "امثلة: باراسيتامول"}
                              value={altActiveIngredient}
                              onChange={(e) => setAltActiveIngredient(e.target.value)}
                              className="p-2 rounded-lg border border-slate-200 text-xs text-right focus:border-emerald-500 focus:outline-none bg-white text-slate-800"
                            />
                          </div>

                          <div className="flex flex-col gap-1 sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-600">ملاحظات خاصة بالدواء البديل (اختياري):</label>
                            <input
                              type="text"
                              placeholder="إرشادات طفيفة للدواء البديل..."
                              value={altNotes}
                              onChange={(e) => setAltNotes(e.target.value)}
                              className="p-2 rounded-lg border border-slate-200 text-xs text-right focus:border-emerald-500 focus:outline-none bg-white text-slate-800"
                            />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">ملاحظات وإرشادات حرة (اختياري):</label>
                  <textarea
                    id="new-notes-textarea"
                    placeholder="إرشادات طفيفة للدكتور أثناء الصرف..."
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-500 focus:outline-none text-right"
                  />
                </div>

                {/* Submit footer */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    id="modal-cancel-btn"
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl"
                  >
                    إلغاء التغييرات
                  </button>
                  <button
                    id="modal-submit-btn"
                    type="submit"
                    className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors"
                  >
                    حفظ وتسجيل في المخزن 💾
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]" id="confirm-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-[20px] border border-slate-200 shadow-2xl overflow-hidden focus:outline-none"
              id="confirm-modal-dialog"
            >
              <div className={`p-4 text-white font-bold text-sm ${confirmModal.isDanger ? 'bg-rose-600' : 'bg-slate-900'} flex items-center justify-between`}>
                <span>{confirmModal.title || 'تأكيد الإجراء'}</span>
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 text-center">
                {confirmModal.isDanger ? (
                  <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 border border-rose-100">
                    <AlertTriangle size={24} />
                  </div>
                ) : (
                  <div className="mx-auto w-12 h-12 bg-slate-50 text-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <FileCheck2 size={24} />
                  </div>
                )}
                <p className="text-slate-700 text-xs md:text-sm leading-relaxed whitespace-pre-line font-sans font-medium">
                  {confirmModal.message}
                </p>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex items-center justify-center gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-xl border border-slate-200 shadow-xs cursor-pointer transition-colors"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmModal.onConfirm) {
                      confirmModal.onConfirm();
                    }
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className={`px-6 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-colors cursor-pointer ${
                    confirmModal.isDanger
                      ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                  }`}
                >
                  تأكيد 👥
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PRINT-PREVIEW DIALOG MODAL (ONLY VISIBLE ON SCREEN) */}
        {printSelectedInvoice && (
          <div 
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] print:hidden" 
            id="print-preview-modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden focus:outline-none flex flex-col max-h-[90vh]"
              id="print-preview-modal-dialog"
            >
              {/* Modal Header */}
              <div className="bg-slate-950 text-white p-4.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-550 rounded-full animate-ping" />
                  <Printer size={18} className="text-indigo-400" />
                  <h3 className="font-bold text-sm md:text-sm">معاينة الفاتورة قبل الطباعة أو التصدير PDF</h3>
                </div>
                <button
                  onClick={() => setPrintSelectedInvoice(null)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* simulated paper sheet container */}
              <div className="p-6 md:p-8 bg-slate-800/50 flex-1 overflow-y-auto flex justify-center text-right font-sans">
                {/* Simulated A4/Receipt paper sheet */}
                <div 
                  className="bg-white text-slate-900 w-full rounded-2xl p-6 md:p-8 shadow-xl max-w-xl flex flex-col gap-5 border border-slate-200 relative selection:bg-indigo-100"
                  style={{ direction: 'rtl' }}
                >
                  {/* Decorative stamp/watermark */}
                  <div className="absolute top-6 left-6 opacity-5 font-bold text-slate-800 text-6xl select-none font-sans tracking-tighter">
                    APPROVED
                  </div>

                  {/* Document Header */}
                  <div className="text-center border-b-2 border-dashed border-slate-200 pb-5">
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                      <span className="text-2xl">🏬</span>
                      <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">نظام إدارة وصرف أدوية مجمع المركز الطبي</h4>
                    </div>
                    <p className="text-[10px] text-slate-500">صيدلية الرعاية العامة ومستودع مخزون الأدوية الخيرية</p>
                    <p className="text-xs font-bold text-indigo-700 bg-indigo-50/50 px-3 py-1 rounded-full border border-indigo-100 w-fit mx-auto mt-2.5">
                      فاتورة صرف أدوية رسمية وأرشيفية
                    </p>
                  </div>

                  {/* Metadata fields */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-slate-500 text-[10px]">بيانات المستخلص:</span>
                      <p className="flex items-center gap-1.5 justify-end">
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700 font-bold text-[10px] shadow-2xs">
                          {printSelectedInvoice.id}
                        </span>
                        <span className="text-slate-650 font-bold">:رقم الفاتورة</span>
                      </p>
                      <p className="flex justify-end gap-1 text-right">
                        <span className="font-mono text-slate-800 text-[10px]">{printSelectedInvoice.dispensedAt}</span>
                        <span className="text-slate-650 font-semibold">:تاريخ ووقت الصرف</span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 border-r border-slate-200/55 pr-4 text-right">
                      <span className="text-slate-500 text-[10px]">بيانات المتلقي:</span>
                      <p>
                        <span className="text-slate-605 font-semibold">اسم المريض/المستلم:</span>{' '}
                        <span className="font-bold text-slate-800">{printSelectedInvoice.recipientName}</span>
                      </p>
                      <p>
                        <span className="text-slate-605 font-semibold">حالة التكلفة:</span>{' '}
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] border border-emerald-100">مُعفى بالكامل (مجاني)</span>
                      </p>
                    </div>
                  </div>

                  {/* Items List Table */}
                  <div className="flex flex-col gap-2">
                    <span className="text-slate-655 font-bold text-xs pl-2">قائمة الأدوية المعتمدة المصروفة:</span>
                    <div className="border border-slate-250 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-705 font-semibold">
                            <th className="p-2.5 text-center w-12 border-l border-slate-200">#</th>
                            <th className="p-2.5 border-l border-slate-200">اسم الصنف المصروف</th>
                            <th className="p-2.5 text-center w-28">الكمية المقررة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {printSelectedInvoice.items.map((item, idx) => (
                            <tr key={`${printSelectedInvoice.id}-${item.drugId}-${idx}`} className="text-slate-800">
                              <td className="p-2.5 text-center font-mono opacity-60 text-[11px] border-l border-slate-150">{idx + 1}</td>
                              <td className="p-2.5 border-l border-slate-150">
                                <span className="font-bold">{item.drugName}</span>
                                <span className="block text-[8px] text-slate-450 font-mono">مفتاح الصنف: {item.drugId}</span>
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-indigo-700 text-[11px]">
                                {item.quantity} وحدات
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes space if present */}
                  {printSelectedInvoice.notes && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans text-right">
                      <span className="font-bold text-slate-700 block mb-1 text-[10px]">ملاحظات وتوجيهات الاستخدام الطبية:</span>
                      <p className="text-slate-600 text-[11px] font-medium">{printSelectedInvoice.notes}</p>
                    </div>
                  )}

                  {/* Verification & signatures placeholders */}
                  <div className="grid grid-cols-2 gap-6 text-center text-[10px] text-slate-500 pt-6 mt-4 border-t border-dashed border-slate-300">
                    <div>
                      <p className="mb-14">إمضاء وختم الصيدلاني المعتمد:</p>
                      <div className="w-32 mx-auto border-b border-slate-300 border-dashed" />
                    </div>
                    <div>
                      <p className="mb-14">توقيع المريض أو مستلم الدفعة:</p>
                      <div className="w-32 mx-auto border-b border-slate-300 border-dashed" />
                    </div>
                  </div>

                  {/* Print footer notice */}
                  <div className="text-center text-[9px] text-slate-400 mt-2 pt-3 border-t border-slate-100">
                    وثيقة إدارية مؤرشفة في النظام وصالحة للتدقيق والمطابقة مع ملفات الإكسل وسجل قوقل شيت.
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPrintSelectedInvoice(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 rounded-xl transition-all cursor-pointer border border-slate-800"
                >
                  إغلاق المعاينة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.focus();
                    window.print();
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Printer size={13} />
                  <span>تأكيد الطباعة وحفظ كـ PDF 💾</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* HIDDEN IN DOCUMENT - SHOWN ONLY ON PRINT MEDIA */}
        {printSelectedInvoice && (
          <div 
            id="invoice-print-area" 
            className="hidden print:block printable-area w-full max-w-2xl mx-auto bg-white text-slate-900 p-8 rounded-2xl flex-col gap-6"
            style={{ direction: 'rtl', textRendering: 'optimizeLegibility' }}
          >
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-5 mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center justify-center gap-2">
                <span>🏬</span>
                <span>نظام إدارة وصرف أدوية مجمع المركز الطبي</span>
              </h2>
              <p className="text-[10px] text-slate-500">صيدلية الرعاية العامة ومستودع مخزون الأدوية الخيرية</p>
              <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-800 w-fit mx-auto mt-3">
                فاتورة صرف أدوية رسمية ومعتمدة
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6" style={{ direction: 'rtl' }}>
              <div className="flex flex-col gap-1.5 text-right">
                <p><strong>رقم المستند / الفاتورة:</strong> <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 font-bold">{printSelectedInvoice.id}</span></p>
                <p><strong>تاريخ ووقت الصرف:</strong> <span className="font-mono">{printSelectedInvoice.dispensedAt}</span></p>
                <p><strong>الجهة المانحة:</strong> <span>التخزين والمخزون المركزي</span></p>
              </div>
              <div className="flex flex-col gap-1.5 border-r border-slate-200 pr-4 text-right">
                <p><strong>اسم المريض / المتلقي:</strong> <span className="font-bold text-base text-slate-800">{printSelectedInvoice.recipientName}</span></p>
                <p><strong>حالة التكلفة:</strong> <span className="font-bold text-slate-800">صُرِفت مجاناً بالكامل (مُعفى)</span></p>
                <p><strong>طريقة الاستلام:</strong> <span>حضور شخصي مباشر</span></p>
              </div>
            </div>

            {/* Items table */}
            <div className="mb-6 flex flex-col gap-2 text-right">
              <h3 className="font-bold text-xs text-slate-700">الأصناف الدوائية المصروفة:</h3>
              <table className="w-full border-collapse border border-slate-300 text-xs text-right">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold">
                    <th className="border border-slate-300 p-2.5 text-center w-12">#</th>
                    <th className="border border-slate-300 p-2.5">اسم وتفاصيل الصنف الدوائي</th>
                    <th className="border border-slate-300 p-2.5">رمز الصنف</th>
                    <th className="border border-slate-300 p-2.5 text-center w-32">الكمية المقررة المصروفة</th>
                  </tr>
                </thead>
                <tbody>
                  {printSelectedInvoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-slate-300 text-slate-800">
                      <td className="border border-slate-300 p-2.5 text-center font-mono">{index + 1}</td>
                      <td className="border border-slate-300 p-2.5 font-bold">{item.drugName}</td>
                      <td className="border border-slate-300 p-2.5 font-mono text-slate-500">{item.drugId}</td>
                      <td className="border border-slate-300 p-2.5 text-center font-bold text-sm text-indigo-700">{item.quantity} وحدات</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes if found */}
            {printSelectedInvoice.notes && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs mb-6 font-sans text-right">
                <strong>ملاحظات وتوجيهات الاستخدام الطبية:</strong>
                <p className="text-slate-700 mt-1.5 leading-relaxed">{printSelectedInvoice.notes}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs mt-12 pt-12 border-t border-dashed border-slate-300">
              <div>
                <p className="text-slate-500 mb-16 font-semibold">اسم وتوقيع الصيدلاني المعتمد:</p>
                <div className="w-48 mx-auto border-b border-slate-400" />
              </div>
              <div>
                <p className="text-slate-500 mb-16 font-semibold">توقيع أو بصمة المريض (المستلم):</p>
                <div className="w-48 mx-auto border-b border-slate-400" />
              </div>
            </div>

            {/* Print logs */}
            <div className="text-center mt-14 pt-6 border-t border-slate-200 text-[10px] text-slate-400">
              <p>تم طباعة الفاتورة آليا من نظام الصيدلية.</p>
              <p>مجمّع الفواتير الإلكتروني والتحكّم بالمخزون الصيدلاني.</p>
            </div>
          </div>
        )}

        {/* INLINE CUSTOM STYLE INJECTION FOR PERFECT A4 PRINTING AND ARABIC CONNECTION SHAPES */}
        {printSelectedInvoice && (
          <style>{`
            @media print {
              html, body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
                direction: rtl !important;
              }
              body > *:not(#invoice-print-area) {
                display: none !important;
                visibility: hidden !important;
              }
              #invoice-print-area, #invoice-print-area * {
                visibility: visible !important;
                display: flex !important;
              }
              #invoice-print-area table {
                display: table !important;
              }
              #invoice-print-area table tr {
                display: table-row !important;
              }
              #invoice-print-area table td, #invoice-print-area table th {
                display: table-cell !important;
                border: 1px solid #cbd5e1 !important;
              }
              #invoice-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                display: block !important;
                background: white !important;
                color: black !important;
                padding: 1cm !important;
                direction: rtl !important;
              }
            }
          `}</style>
        )}
      </AnimatePresence>
    </div>
  );
}
