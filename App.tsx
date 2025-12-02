import React, { useState, useRef, useEffect } from 'react';
import { Expense, ExpenseDraft, UserID, Category, AppSettings } from './types';
import { analyzeReceipt } from './services/geminiService';
import SummaryHeader from './components/SummaryHeader';
import EditExpenseModal from './components/EditExpenseModal';
import SettingsModal from './components/SettingsModal';
import { CameraIcon, getCategoryIcon, UserIcon, PlusIcon, CogIcon } from './components/Icons';

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
  const listEndRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Header Summary */}
      <SummaryHeader 
        expenses={expenses} 
        currentMonth={new Date()} 
        userAName={settings.userAName}
        userBName={settings.userBName}
      />

      {/* Settings Trigger (Absolute) */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="absolute top-4 right-4 z-20 text-white/80 hover:text-white p-2 bg-black/10 backdrop-blur-md rounded-full"
      >
        <CogIcon className="w-5 h-5" />
      </button>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 no-scrollbar space-y-6">
        {sortedDates.map(date => (
          <div key={date} className="animate-in slide-in-from-bottom-2 duration-500">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {groupedExpenses[date].map((expense, idx) => (
                <div 
                    key={expense.id} 
                    className={`flex items-center p-4 hover:bg-slate-50 transition-colors ${idx !== groupedExpenses[date].length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl mr-4 shrink-0">
                    {getCategoryIcon(expense.category)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-semibold text-slate-800 truncate">{expense.item}</p>
                    <p className="text-xs text-slate-400">{expense.category}</p>
                  </div>

                  {/* Amount & Payer */}
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-slate-900">¥{expense.amount.toFixed(2)}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          expense.payer === UserID.A 
                          ? 'bg-purple-100 text-userA' 
                          : 'bg-rose-100 text-userB'
                      }`}>
                        {expense.payer === UserID.A ? settings.userAName : settings.userBName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={listEndRef} />
        
        {/* Empty State */}
        {expenses.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <div className="text-6xl mb-4">💸</div>
            <p>No expenses yet. Start tracking!</p>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-40">
        
        {/* Hidden File Input */}
        <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
        />

        {/* Scan Button */}
        <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="group relative flex items-center justify-center w-16 h-16 bg-brand-600 rounded-full shadow-lg shadow-brand-500/40 text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-70 disabled:scale-100"
        >
            {isAnalyzing ? (
                 <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                <CameraIcon className="w-7 h-7" />
            )}
             <span className="absolute -top-10 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Scan Receipt
            </span>
        </button>

         {/* Manual Add Button */}
         <button
            onClick={handleManualAdd}
            className="group relative flex items-center justify-center w-12 h-12 bg-white text-brand-600 border border-brand-100 rounded-full shadow-md text-white transition-all hover:bg-slate-50 hover:scale-110 active:scale-95"
        >
            <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
          <p className="text-brand-800 font-medium animate-pulse">Analyzing Receipt...</p>
        </div>
      )}

      {/* Edit/Add Modal */}
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

      {/* Settings Modal */}
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
