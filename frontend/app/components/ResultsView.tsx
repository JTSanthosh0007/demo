'use client'

import React, { useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { AnalysisResult, View } from '../types/analysis';
import type { Transaction } from '../types/analysis';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

interface ResultsViewProps {
  analysisResults: AnalysisResult;
  setCurrentView: (view: View) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ analysisResults, setCurrentView }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const { summary, transactions, detailedCategoryBreakdown, pageCount } = analysisResults;
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const dateRange = useMemo(() => {
    if (transactions.length === 0) return null;
    const dates = transactions.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return {
      start: minDate.toLocaleDateString('en-GB', options),
      end: maxDate.toLocaleDateString('en-GB', options),
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const labels = detailedCategoryBreakdown.map(item => item.category);
    const data = detailedCategoryBreakdown.map(item => item.amount);
    const coolColors = ['#2dd4bf', '#38bdf8', '#facc15', '#fb923c', '#c084fc', '#f472b6', '#818cf8', '#a3e635', '#22d3ee', '#f87171'];

    return {
      labels,
      datasets: [{
        label: 'Amount Spent',
        data,
        backgroundColor: coolColors,
        borderColor: '#18181b',
        borderWidth: 4,
        hoverOffset: 15,
        cutout: '60%',
      }],
    };
  }, [detailedCategoryBreakdown]);
  
  const chartOptions: any = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'right', labels: { color: '#a1a1aa', padding: 25, boxWidth: 15, font: { size: 14 }, usePointStyle: true } },
      tooltip: {
        enabled: true, backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: '#ffffff', bodyColor: '#d4d4d8', padding: 15, cornerRadius: 10, borderColor: '#3f3f46', borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) { label += ': '; }
            if (context.parsed !== null) { label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.raw); }
            return label;
          }
        }
      }
    }
  };

  const barChartOptions = { ...chartOptions, scales: { y: { beginAtZero: true, grid: { color: '#27272a' }, ticks: { color: '#a1a1aa' } }, x: { grid: { display: false }, ticks: { color: '#a1a1aa' } } }, plugins: { ...chartOptions.plugins, legend: { display: false } } };

  const categoryColors: { [key: string]: string } = {
    bills: 'bg-blue-500', entertainment: 'bg-red-500', food: 'bg-green-500', shopping: 'bg-pink-500', travel: 'bg-blue-400', transfer: 'bg-orange-500', health: 'bg-yellow-500', education: 'bg-indigo-500', default: 'bg-gray-500'
  };

  const toggleCategory = (category: string) => setExpandedCategory(expandedCategory === category ? null : category);

  return (
    <div className="p-4 bg-black text-white min-h-screen">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Analysis Results</h2>
        {dateRange && <p className="text-sm text-zinc-400">Statement from {dateRange.start} to {dateRange.end}</p>}
        {pageCount && pageCount > 0 && <p className="text-xs text-zinc-500 mt-1">Based on {pageCount} page(s) in the PDF</p>}
      </div>

      <div className="bg-zinc-900/80 rounded-2xl p-6 mb-6 border border-zinc-800/50">
        <h3 className="text-lg font-semibold text-white mb-4">Transaction Summary</h3>
        <div className="space-y-4">
            <SummaryRow icon={ArrowTrendingUpIcon} iconColor="text-green-400" bgColor="bg-green-500/20" title="Total Money In" count={summary.creditCount} amount={summary.totalReceived} isCredit={true} />
            <SummaryRow icon={ArrowTrendingDownIcon} iconColor="text-red-400" bgColor="bg-red-500/20" title="Total Money Out" count={summary.debitCount} amount={summary.totalSpent} isCredit={false} />
            <div className="grid grid-cols-2 gap-4 pt-2">
                <HighestTransaction type="Credit" amount={summary.highestCredit} />
                <HighestTransaction type="Debit" amount={summary.highestDebit} />
            </div>
            <hr className="border-zinc-700/50 !my-6" />
            <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-white">Net Balance</p>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{summary.balance.toLocaleString('en-IN')}</p>
            </div>
        </div>
      </div>

      <div className="bg-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Spending Analysis</h3>
            <div className="flex space-x-2 bg-zinc-900 p-1 rounded-lg">
                <ChartToggleButton type="pie" active={chartType} setActive={setChartType} />
                <ChartToggleButton type="bar" active={chartType} setActive={setChartType} />
            </div>
        </div>
        <div className="h-72 flex justify-center items-center p-2">
          {chartType === 'pie' ? <Pie data={chartData} options={chartOptions} /> : <Bar data={chartData} options={barChartOptions} />}
        </div>
      </div>

      <div className="bg-zinc-800 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Category Breakdown</h3>
        <div className="space-y-3">
          {detailedCategoryBreakdown.map((item) => <CategoryItem key={item.category} item={item} expandedCategory={expandedCategory} toggleCategory={toggleCategory} categoryColors={categoryColors} />)}
        </div>
      </div>

      <div className="bg-zinc-800 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map((t, i) => <TransactionRow key={i} transaction={t} />)}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const SummaryRow = ({ icon: Icon, iconColor, bgColor, title, count, amount, isCredit }: any) => (
    <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className={`${bgColor} p-2 rounded-full`}><Icon className={`h-5 w-5 ${iconColor}`} /></div>
            <div>
                <p className="text-white">{title}</p>
                <p className="text-xs text-zinc-400">{count} transactions</p>
            </div>
        </div>
        <p className={`${isCredit ? 'text-green-400' : 'text-red-400'} font-semibold text-lg`}>
            {isCredit ? '+' : '-'} ₹{Math.abs(amount).toLocaleString('en-IN')}
        </p>
    </div>
);

const HighestTransaction = ({ type, amount }: { type: string, amount?: number }) => (
    <div className="text-center bg-zinc-800/50 rounded-lg p-2">
        <p className="text-xs text-zinc-400">Highest {type}</p>
        <p className="text-white font-medium">₹{amount ? Math.abs(amount).toLocaleString('en-IN') : 'N/A'}</p>
    </div>
);

const ChartToggleButton = ({ type, active, setActive }: { type: 'pie' | 'bar', active: string, setActive: (type: 'pie' | 'bar') => void }) => (
    <button onClick={() => setActive(type)} className={`px-3 py-1 text-sm rounded-md capitalize ${active === type ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}>
        {type}
    </button>
);

const CategoryItem = ({ item, expandedCategory, toggleCategory, categoryColors }: any) => (
    <div className="bg-zinc-900 rounded-lg p-3">
        <div onClick={() => toggleCategory(item.category)} className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${categoryColors[item.category.toLowerCase()] || categoryColors.default}`}></span>
                <p className="font-semibold">{item.category}</p>
            </div>
            <div className="flex items-center gap-4">
                <p className="font-bold">₹{item.amount.toLocaleString('en-IN')}</p>
                {expandedCategory === item.category ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </div>
        </div>
        {expandedCategory === item.category && (
            <>
                <div className="text-sm text-zinc-400 mt-2">
                    <p>Portion of spending: {item.percentage}%</p>
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                        <div className={`${categoryColors[item.category.toLowerCase()] || categoryColors.default} h-1.5 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <p className="mt-1">{item.count} transactions</p>
                </div>
                <div className="mt-4 space-y-2">
                    {item.transactions.map((t: Transaction, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm border-t border-zinc-700 pt-2">
                            <div>
                                <p className="font-medium text-white">{t.description}</p>
                                <p className="text-xs text-zinc-500">{new Date(t.date).toLocaleDateString('en-GB')}</p>
                            </div>
                            <p className="font-semibold text-red-500">₹{Math.abs(t.amount).toLocaleString('en-IN')}</p>
                        </div>
                    ))}
                </div>
            </>
        )}
    </div>
);

const TransactionRow = ({ transaction }: { transaction: Transaction }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-white">{transaction.description}</p>
            <p className="text-xs text-zinc-400">{new Date(transaction.date).toLocaleDateString('en-GB')}</p>
        </div>
        <p className={`text-sm font-semibold ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {transaction.amount >= 0 ? `+₹${transaction.amount.toLocaleString('en-IN')}` : `-₹${Math.abs(transaction.amount).toLocaleString('en-IN')}`}
        </p>
    </div>
); 