import React from 'react';
import { Expense, UserID } from '../types';

interface SummaryHeaderProps {
  expenses: Expense[];
  currentMonth: Date;
  userAName: string;
  userBName: string;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ expenses, currentMonth, userAName, userBName }) => {
  // Filter expenses for the current month
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalA = monthExpenses.filter(e => e.payer === UserID.A).reduce((sum, e) => sum + e.amount, 0);
  const totalB = monthExpenses.filter(e => e.payer === UserID.B).reduce((sum, e) => sum + e.amount, 0);

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white rounded-3xl shadow-xl p-6 md:p-8 z-10 transition-all duration-300">
      
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-40 h-40 rounded-full bg-brand-500/20 blur-xl"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="text-brand-100 text-sm font-medium mb-1 tracking-wide uppercase opacity-80">{monthName}</div>
        <h1 className="text-5xl font-bold tracking-tight mb-8">
          <span className="text-3xl align-top opacity-70 mr-1">¥</span>
          {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>

        {/* Breakdown Card */}
        <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 flex justify-between border border-white/10">
          <div className="flex flex-col items-center w-1/2 border-r border-white/10 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-userA"></div>
              <span className="text-xs text-brand-100 font-medium truncate max-w-[80px]">{userAName}</span>
            </div>
            <span className="text-lg font-bold">¥{totalA.toFixed(0)}</span>
          </div>
          <div className="flex flex-col items-center w-1/2">
             <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-userB"></div>
              <span className="text-xs text-brand-100 font-medium truncate max-w-[80px]">{userBName}</span>
            </div>
            <span className="text-lg font-bold">¥{totalB.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryHeader;