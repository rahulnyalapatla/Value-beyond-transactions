import { useState } from 'react';
import TrainingPanel from './components/TrainingPanel';
import PredictionForm from './components/PredictionForm';
import BulkResultTable from './components/BulkResultTable';
import EcommerceApp from './components/EcommerceApp';
import { PredictionResult, BulkPredictionResult } from './types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

function App() {
  const [activeSystem, setActiveSystem] = useState<'analytics' | 'ecommerce'>('analytics');
  
  // Model starts as 'trained' since we are using a pre-trained model now
  const [isModelTrained, setIsModelTrained] = useState(true);
  const [singlePrediction, setSinglePrediction] = useState<PredictionResult | null>(null);
  const [bulkPrediction, setBulkPrediction] = useState<BulkPredictionResult | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single');

  const handleSingleResult = (result: PredictionResult) => {
    setSinglePrediction(result);
    setViewMode('single');
  };

  const handleBulkResult = (result: BulkPredictionResult) => {
    setBulkPrediction(result);
    setViewMode('bulk');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 font-inter">
      {/* Header with System Switcher */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
             {/* ShopSmart Logo Construction */}
             <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                {/* Growth Arrow Overlay */}
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 border border-slate-100 shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                   </svg>
                </div>
             </div>
             <h1 className="text-xl font-bold tracking-tight text-slate-900">
                <span className="text-orange-600">Shop</span><span className="text-green-600">Smart</span>
             </h1>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => setActiveSystem('ecommerce')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeSystem === 'ecommerce' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
                {/* SVG for Shopping Cart */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                E-Commerce Store
             </button>
             <button 
                onClick={() => setActiveSystem('analytics')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeSystem === 'analytics' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
                {/* SVG for Charts */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="13" rx="1"/><rect width="7" height="5" x="14" y="17" rx="1"/><rect width="7" height="13" x="14" y="3" rx="1"/><rect width="7" height="9" x="3" y="3" rx="1"/></svg>
                CLV Analytics
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {activeSystem === 'ecommerce' ? (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                <h2 className="text-lg font-semibold text-slate-800">Operational Data Layer</h2>
                <p className="text-slate-600 text-sm mt-1">
                  This system handles Customer Registration, Product Browsing, and Order Processing (OLTP). 
                  Use the <strong>Admin Panel</strong> to export transaction data for the CLV System.
                </p>
              </section>
              <EcommerceApp />
           </div>
        ) : (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             {/* Intro Section - Project Overview Only */}
             <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800 mb-2">CLV Analytical Layer</h2>
                        <p className="text-slate-600 leading-relaxed text-sm">
                        This dashboard ingests data from the E-Commerce system to predict long-term customer value.
                        Upload the CSV exported from the E-Commerce Admin panel to generate predictions.
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Pipeline & Inputs */}
                <div className="lg:col-span-7 space-y-8">
                    <TrainingPanel onTrainingComplete={() => setIsModelTrained(true)} />
                    <PredictionForm 
                        isEnabled={isModelTrained} 
                        onSingleResult={handleSingleResult} 
                        onBulkResult={handleBulkResult}
                    />
                </div>

                {/* Right Column: Results & Visualization */}
                <div className="lg:col-span-5 space-y-8">
                    
                    {/* Single Result Card */}
                    {viewMode === 'single' && (
                        <div className={`bg-white p-8 rounded-xl shadow-lg border border-indigo-100 transition-all duration-500 sticky top-24
                        ${singlePrediction ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                        
                        {singlePrediction && (
                            <>
                            <div className="text-center mb-8">
                                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 inline-block w-full">
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-2">CLV Score</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                        {singlePrediction.clv.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-600">Customer Segment</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold 
                                    ${singlePrediction.segment === 'High' ? 'bg-emerald-100 text-emerald-700' : 
                                    singlePrediction.segment === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {singlePrediction.segment} Value
                                </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-600">Model Confidence</span>
                                <span className="font-mono text-slate-800">{(singlePrediction.confidence * 100).toFixed(1)}%</span>
                                </div>

                                <div className="pt-4">
                                <p className="text-xs font-semibold text-slate-500 mb-4 uppercase">Projected CLV Score Breakdown (12M)</p>
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                        { month: 'Q1', val: singlePrediction.clv * 0.2 },
                                        { month: 'Q2', val: singlePrediction.clv * 0.25 },
                                        { month: 'Q3', val: singlePrediction.clv * 0.3 },
                                        { month: 'Q4', val: singlePrediction.clv * 0.25 },
                                        ]}>
                                        <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                                            {[0,1,2,3].map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#818cf8', '#6366f1', '#4f46e5', '#4338ca'][index]} />
                                            ))}
                                        </Bar>
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                        <Tooltip 
                                            cursor={{fill: 'transparent'}}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: number) => [`${value.toFixed(2)}`, 'CLV Score']}
                                        />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                </div>
                            </div>
                            </>
                        )}
                        </div>
                    )}

                    {/* Bulk Result Summary Card */}
                    {viewMode === 'bulk' && bulkPrediction && (
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 sticky top-24">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Batch Summary</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-slate-500">Total Customers</p>
                                    <p className="text-2xl font-bold text-slate-900">{bulkPrediction.summary.totalCustomers}</p>
                                </div>
                                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-indigo-500">Avg CLV Score</p>
                                    <p className="text-2xl font-bold text-indigo-700">${bulkPrediction.summary.avgCLV.toFixed(0)}</p>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'High Value', value: bulkPrediction.summary.highCount, fill: '#10b981' },
                                                { name: 'Medium Value', value: bulkPrediction.summary.mediumCount, fill: '#f59e0b' },
                                                { name: 'Low Value', value: bulkPrediction.summary.lowCount, fill: '#64748b' },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell key="cell-high" fill="#10b981" />
                                            <Cell key="cell-med" fill="#f59e0b" />
                                            <Cell key="cell-low" fill="#64748b" />
                                        </Pie>
                                        <Legend verticalAlign="bottom" height={36}/>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Placeholders */}
                    {!singlePrediction && !bulkPrediction && isModelTrained && (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                        <p>Choose Single or Bulk mode to generate predictions.</p>
                    </div>
                    )}
                </div>
            </div>

            {/* Bulk Table Section (Full Width) */}
            {viewMode === 'bulk' && bulkPrediction && (
                <div className="w-full">
                    <BulkResultTable data={bulkPrediction} />
                </div>
            )}
           </div>
        )}

      </main>
    </div>
  );
}

export default App;