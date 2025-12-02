import React, { useState, useRef, useEffect } from 'react';
import { Expense, ExpenseDraft, UserID, Category, AppSettings } from './types';
import { analyzeReceipt } from './services/geminiService';
import SummaryHeader from './components/SummaryHeader';
import EditExpenseModal from './components/EditExpenseModal';
import SettingsModal from './components/SettingsModal';
import { CameraIcon, getCategoryIcon, UserIcon, PlusIcon, CogIcon, WalletIcon } from './components/Icons';

// Mock initial data
const INITIAL_EXPENSES: Expense[] = [
  { id: '1', date: new Date().toISOString().split('T')[0], item: 'Grocery Run', amount: 156.50, category: Category.GROCERIES, payer: UserID.A, createdAt: Date.now() },
  { id: '2', date: new Date().toISOString().split('T')[0], item: 'Dinner Date', amount: 320.00, category: Category.FOOD, payer: UserID.B, createdAt: Date.now() - 1000 },
];

const DEFAULT_SETTINGS: AppSettings = {
    userAName: 'You',
    userBName: 'Partner',
    currentUserId: UserID.A // Defaults to User A
};

function App() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draftExpense, setDraftExpense] = useState<ExpenseDraft | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  // Handle File Upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const result = await analyzeReceipt(base64String);
        setDraftExpense(result);
        setIsModalOpen(true);
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file", error);
      setIsAnalyzing(false);
      alert("Failed to process image. Please try again.");
    } finally {
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save New Expense
  const handleSaveExpense = (finalData: ExpenseDraft & { payer: UserID }) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      ...finalData,
      createdAt: Date.now(),
    };

    setExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsModalOpen(false);
    setDraftExpense(null);
  };

  const handleImportData = (jsonString: string) => {
    try {
        const importedData = JSON.parse(jsonString);
        if (Array.isArray(importedData)) {
            // Merge logic: Filter out duplicates by ID, then combine
            const currentIds = new Set(expenses.map(e => e.id));
            const newItems = importedData.filter((e: Expense) => !currentIds.has(e.id));
            
            setExpenses(prev => [...newItems, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            alert(`Successfully imported ${newItems.length} new expenses.`);
        } else {
            alert("Invalid data format.");
        }
    } catch (e) {
        alert("Failed to parse data. Make sure the code is correct.");
    }
  };

  // Group Expenses by Date for the list
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = expense.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const handleManualAdd = () => {
    setDraftExpense({
        date: new Date().toISOString().split('T')[0],
        item: '',
        amount: 0,
        category: Category.OTHER
    });
    setIsModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-brand-600 p-2 rounded-xl text-white">
                <WalletIcon className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">CoSpend</span>
            </div>
            <div className="flex items-center">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                title="Settings"
              >
                <CogIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Summary & Desktop Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <SummaryHeader 
              expenses={expenses} 
              currentMonth={new Date()} 
              userAName={settings.userAName}
              userBName={settings.userBName}
            />

            {/* Desktop Action Buttons (Visible on LG screens) */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-200 transition-all group"
              >
                <div className={`p-3 rounded-full mb-3 transition-colors ${isAnalyzing ? 'bg-brand-50' : 'bg-brand-100 text-brand-600 group-hover:bg-brand-600 group-hover:text-white'}`}>
                  {isAnalyzing ? (
                     <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                  ) : (
                    <CameraIcon className="w-6 h-6" />
                  )}
                </div>
                <span className="font-bold text-slate-700 group-hover:text-brand-700">Scan Receipt</span>
              </button>
              
              <button
                onClick={handleManualAdd}
                className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-200 transition-all group"
              >
                <div className="p-3 bg-slate-100 text-slate-500 rounded-full mb-3 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <PlusIcon className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-brand-700">Manual Add</span>
              </button>
            </div>
          </div>

          {/* Right Column: Expense List (8 cols) */}
          <div className="lg:col-span-8 space-y-8 pb-24 lg:pb-0">
            {sortedDates.map(date => (
              <div key={date} className="animate-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-4 mb-3">
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  {groupedExpenses[date].map((expense, idx) => (
                    <div 
                        key={expense.id} 
                        className={`flex items-center p-4 sm:p-5 hover:bg-slate-50 transition-colors ${idx !== groupedExpenses[date].length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mr-4 shrink-0">
                        {getCategoryIcon(expense.category)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-slate-800 truncate text-base">{expense.item}</p>
                        </div>
                        <p className="text-xs font-medium text-slate-400">{expense.category}</p>
                      </div>

                      {/* Amount & Payer */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-slate-900 text-lg">¥{expense.amount.toFixed(2)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            expense.payer === UserID.A 
                            ? 'bg-purple-100 text-userA' 
                            : 'bg-rose-100 text-userB'
                        }`}>
                          {expense.payer === UserID.A ? settings.userAName : settings.userBName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Empty State */}
            {expenses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="text-7xl mb-6 opacity-80">💸</div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No expenses yet</h3>
                <p className="text-slate-400 max-w-xs text-center">Start tracking your shared expenses by scanning a receipt or adding one manually.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button (Mobile Only) */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40 flex flex-col gap-4">
         <button
            onClick={handleManualAdd}
            className="flex items-center justify-center w-12 h-12 bg-white text-brand-600 border border-brand-100 rounded-full shadow-lg transition-transform active:scale-95"
        >
            <PlusIcon className="w-6 h-6" />
        </button>

        <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="relative flex items-center justify-center w-16 h-16 bg-brand-600 rounded-full shadow-xl shadow-brand-500/40 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:scale-100"
        >
            {isAnalyzing ? (
                 <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                <CameraIcon className="w-7 h-7" />
            )}
        </button>
      </div>

      {/* Hidden File Input (Shared) */}
      <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
      />

      {/* Loading Overlay (Global) */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
          <p className="text-brand-800 font-medium animate-pulse">Analyzing Receipt...</p>
        </div>
      )}

      {/* Modals */}
      <EditExpenseModal
        isOpen={isModalOpen}
        draft={draftExpense}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        isProcessing={false}
        userAName={settings.userAName}
        userBName={settings.userBName}
        defaultPayer={settings.currentUserId}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onImportData={handleImportData}
        currentDataJSON={JSON.stringify(expenses)}
      />
    </div>
  );
}

export default App;