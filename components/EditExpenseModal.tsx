import React, { useState, useEffect } from 'react';
import { Category, ExpenseDraft, UserID } from '../types';
import { getCategoryIcon, CheckIcon, XIcon } from './Icons';

interface EditExpenseModalProps {
  draft: ExpenseDraft | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExpenseDraft & { payer: UserID }) => void;
  isProcessing: boolean;
  userAName: string;
  userBName: string;
  defaultPayer: UserID;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ 
    draft, isOpen, onClose, onSave, isProcessing, 
    userAName, userBName, defaultPayer 
}) => {
  const [data, setData] = useState<ExpenseDraft & { payer: UserID }>({
    date: '',
    item: '',
    amount: 0,
    category: Category.OTHER,
    payer: defaultPayer, 
  });

  useEffect(() => {
    if (draft) {
      setData({ ...draft, payer: defaultPayer });
    }
  }, [draft, defaultPayer]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          
          {/* Header */}
          <div className="bg-brand-50 p-4 border-b border-brand-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-brand-900">Review Expense</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
            
            {/* Amount & Date Row */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={data.amount}
                    onChange={(e) => setData({ ...data, amount: parseFloat(e.target.value) })}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border-none rounded-xl text-2xl font-bold text-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
              <div className="w-1/3">
                 <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                 <input
                    type="date"
                    required
                    value={data.date}
                    onChange={(e) => setData({ ...data, date: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-50 border-none rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
              </div>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Item Description</label>
              <input
                type="text"
                required
                value={data.item}
                onChange={(e) => setData({ ...data, item: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-base font-medium text-gray-800 focus:ring-2 focus:ring-brand-500 outline-none placeholder:text-gray-300"
                placeholder="What did you buy?"
              />
            </div>

            {/* Category Grid */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(Category).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setData({ ...data, category: cat })}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      data.category === cat
                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                        : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl mb-1">{getCategoryIcon(cat)}</span>
                    <span className="text-[10px] font-medium truncate w-full text-center">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payer Toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Who Paid?</label>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setData({ ...data, payer: UserID.A })}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    data.payer === UserID.A
                      ? 'bg-white text-userA shadow-sm'
                      : 'text-gray-400'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-userA`} />
                  {userAName}
                </button>
                <button
                  type="button"
                  onClick={() => setData({ ...data, payer: UserID.B })}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    data.payer === UserID.B
                      ? 'bg-white text-userB shadow-sm'
                      : 'text-gray-400'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-userB`} />
                  {userBName}
                </button>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-gray-100 mt-auto">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-brand-700 active:scale-[0.98] transition-all shadow-lg shadow-brand-200"
            >
              {isProcessing ? 'Saving...' : (
                <>
                  <CheckIcon className="w-6 h-6" />
                  Confirm Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;