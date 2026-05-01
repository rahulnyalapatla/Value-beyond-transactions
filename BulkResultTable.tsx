import React from 'react';
import { BulkPredictionResult } from '../types';

interface BulkResultTableProps {
  data: BulkPredictionResult;
}

const BulkResultTable: React.FC<BulkResultTableProps> = ({ data }) => {
  
  const handleDownloadCSV = () => {
    if (!data.details || data.details.length === 0) return;

    const headers = [
      'Customer ID', 
      'Age', 
      'Gender', 
      'Location', 
      'Income Level', 
      'Purchase Frequency', 
      'Avg Order Value', 
      'Recency (Days)', 
      'Tenure (Days)', 
      'Churn Status', 
      'Predicted CLV', 
      'Segment'
    ];

    const csvRows = [headers.join(',')];

    data.details.forEach(row => {
      const values = [
        row.id,
        row.age,
        row.gender,
        row.location,
        row.incomeLevel,
        row.purchaseFrequency.toFixed(2),
        row.avgOrderValue.toFixed(2),
        row.recencyDays,
        row.tenureDays,
        row.churned === 1 ? 'Churned' : 'Active',
        row.predictedCLV.toFixed(2),
        row.segment
      ];
      // Simple CSV escaping for string fields if necessary, though current enums are safe
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `clv_predictions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
           <h3 className="text-lg font-semibold text-slate-800">Bulk Analysis Results</h3>
           <p className="text-sm text-slate-500">Categorized list of {data.summary.totalCustomers} customers</p>
        </div>
        <button 
          onClick={handleDownloadCSV}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download CSV
        </button>
      </div>
      
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 shadow-sm z-10">
            <tr>
              <th className="px-6 py-3">Customer ID</th>
              <th className="px-6 py-3">Segment</th>
              <th className="px-6 py-3">Projected CLV Score</th>
              <th className="px-6 py-3">Income</th>
              <th className="px-6 py-3">Frequency</th>
              <th className="px-6 py-3">AOV</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.details.sort((a,b) => b.predictedCLV - a.predictedCLV).map((customer) => (
              <tr key={customer.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{customer.id}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${customer.segment === 'High' ? 'bg-emerald-100 text-emerald-700' :
                      customer.segment === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                      'bg-slate-100 text-slate-600'}
                  `}>
                    {customer.segment} Value
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-800">
                  ${customer.predictedCLV.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
                <td className="px-6 py-4">{customer.incomeLevel}</td>
                <td className="px-6 py-4">{customer.purchaseFrequency.toFixed(1)}</td>
                <td className="px-6 py-4">${customer.avgOrderValue.toFixed(0)}</td>
                <td className="px-6 py-4">
                    {customer.churned === 1 ? 
                        <span className="text-red-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>Churned</span> : 
                        <span className="text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Active</span>
                    }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkResultTable;