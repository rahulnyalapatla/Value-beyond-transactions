import React, { useState, useRef } from 'react';
import { CustomerData, Gender, LocationType, IncomeLevel, PredictionResult, BulkPredictionResult, Industry, SegmentationThresholds } from '../types';
import { predictCLV, predictBulk, parseAndCleanCSV } from '../services/mlService';
import { FileSpreadsheet, User, UploadCloud, Settings, Sliders, ChevronDown, AlertCircle, FileText, CheckCircle, AlertTriangle, Loader2, XCircle } from 'lucide-react';

interface PredictionFormProps {
  onSingleResult: (result: PredictionResult) => void;
  onBulkResult: (result: BulkPredictionResult) => void;
  isEnabled: boolean;
}

const PRESETS: Record<Industry, SegmentationThresholds> = {
  'Generic': { medium: 500, high: 2000 },
  'Fashion': { medium: 300, high: 1000 },     // High freq, lower value items
  'Electronics': { medium: 800, high: 2500 }, // Low freq, high value items
  'SaaS': { medium: 1000, high: 5000 }        // Recurring revenue focus
};

const PredictionForm: React.FC<PredictionFormProps> = ({ onSingleResult, onBulkResult, isEnabled }) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration State
  const [industry, setIndustry] = useState<Industry>('Generic');
  const [thresholds, setThresholds] = useState<SegmentationThresholds>(PRESETS['Generic']);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Single Form State
  const [formData, setFormData] = useState<CustomerData>({
    id: 'NEW-001',
    age: 30,
    gender: Gender.Female,
    location: LocationType.Urban,
    incomeLevel: IncomeLevel.Medium,
    purchaseFrequency: 5.0,
    avgOrderValue: 120.0,
    recencyDays: 10,
    tenureDays: 365,
    churned: 0
  });
  
  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Bulk Form State
  const [bulkFile, setBulkFile] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>(''); 
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndustry = e.target.value as Industry;
    setIndustry(newIndustry);
    setThresholds(PRESETS[newIndustry]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear global error on interaction
    if (submitError) setSubmitError(null);

    // Clear field error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setFormData(prev => {
      let newValue: any = value;
      if (name === 'age' || name === 'recencyDays' || name === 'tenureDays' || name === 'churned') {
        newValue = value === '' ? NaN : parseInt(value);
      } else if (name === 'purchaseFrequency' || name === 'avgOrderValue') {
        newValue = value === '' ? NaN : parseFloat(value);
      }
      return {
        ...prev,
        [name]: newValue
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBulkFile(file.name);
      setSelectedFileObj(file);
      setCsvErrors([]);
      setSubmitError(null);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Numerical Validations
    if (formData.age === undefined || isNaN(formData.age)) {
      newErrors.age = "Age is required";
    } else if (formData.age < 18 || formData.age > 120) {
      newErrors.age = "Age must be 18-120";
    }

    if (formData.purchaseFrequency === undefined || isNaN(formData.purchaseFrequency)) {
      newErrors.purchaseFrequency = "Frequency is required";
    } else if (formData.purchaseFrequency < 0) {
      newErrors.purchaseFrequency = "Must be ≥ 0";
    } else if (formData.purchaseFrequency > 300) {
      newErrors.purchaseFrequency = "Value seems too high (>300)";
    }

    if (formData.avgOrderValue === undefined || isNaN(formData.avgOrderValue)) {
      newErrors.avgOrderValue = "AOV is required";
    } else if (formData.avgOrderValue < 0) {
      newErrors.avgOrderValue = "Must be ≥ 0";
    }

    if (formData.recencyDays === undefined || isNaN(formData.recencyDays)) {
      newErrors.recencyDays = "Recency is required";
    } else if (formData.recencyDays < 0) {
      newErrors.recencyDays = "Must be ≥ 0";
    }

    if (formData.tenureDays === undefined || isNaN(formData.tenureDays)) {
      newErrors.tenureDays = "Tenure is required";
    } else if (formData.tenureDays < 0) {
      newErrors.tenureDays = "Must be ≥ 0";
    }

    // Categorical Validations
    if (!Object.values(Gender).includes(formData.gender)) {
        newErrors.gender = "Invalid gender selection";
    }
    if (!Object.values(LocationType).includes(formData.location)) {
        newErrors.location = "Invalid location selection";
    }
    if (!Object.values(IncomeLevel).includes(formData.incomeLevel)) {
        newErrors.incomeLevel = "Invalid income selection";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnabled) return;
    
    setSubmitError(null);
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const result = await predictCLV(formData, thresholds);
      onSingleResult(result);
    } catch (error) {
      console.error("Single prediction error:", error);
      setSubmitError("Failed to generate prediction. Please verify inputs and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!isEnabled || !selectedFileObj) return;
    
    setIsLoading(true);
    setCsvErrors([]);
    setSubmitError(null);
    setUploadProgress(0);
    setUploadStatus('Initializing upload...');

    try {
      // 1. Read File with fake progress
      setUploadProgress(10);
      setUploadStatus('Reading file content...');
      await new Promise(r => setTimeout(r, 400));
      
      const text = await selectedFileObj.text();
      setUploadProgress(30);
      setUploadStatus('Parsing CSV structure...');
      await new Promise(r => setTimeout(r, 400));
      
      // 2. Parse & Auto-Clean
      const { data: cleanedData, errors: parseErrors } = parseAndCleanCSV(text);
      setUploadProgress(60);

      // 3. Handle Errors
      if (parseErrors.length > 0) {
        setCsvErrors(parseErrors);
        // If we have no data at all, fail. If we have some data, we might proceed with warning, 
        // but for now let's stop if there are errors to let user review.
        if (cleanedData.length === 0 || parseErrors.some(e => e.includes('Missing critical'))) {
            setUploadStatus('Validation Failed');
            setUploadProgress(0);
            setIsLoading(false);
            return;
        }
      }

      if (cleanedData.length === 0) {
        setSubmitError("Could not extract valid data from the CSV file.");
        setIsLoading(false);
        setUploadStatus('');
        return;
      }

      // 4. Predict
      setUploadStatus(`Analyzing ${cleanedData.length} records...`);
      setUploadProgress(80);
      const result = await predictBulk(cleanedData, thresholds);
      
      setUploadProgress(100);
      setUploadStatus('Processing complete!');
      await new Promise(r => setTimeout(r, 300));
      
      onBulkResult(result);
    } catch (error) {
      console.error("Bulk processing failed", error);
      setUploadStatus('Process Failed');
      setSubmitError("An unexpected error occurred while processing the file. Please check your network or file format.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClass = (fieldName: string) => `w-full border rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
    errors[fieldName] 
      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
      : 'border-slate-300 bg-slate-50 focus:ring-indigo-500'
  }`;
  
  const labelClass = "block text-xs font-medium text-slate-700 mb-1";

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-opacity ${!isEnabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-slate-800">2. Prediction Pipeline</h2>
        <p className="text-sm text-slate-500 mt-1">
          Select input method to project Customer Lifetime Value Score.
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="mb-6 bg-slate-50 rounded-lg border border-slate-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-700">Segmentation Logic</span>
          </div>
          <button onClick={() => setIsConfigOpen(!isConfigOpen)} className="text-xs text-indigo-600 font-medium hover:text-indigo-800 hover:underline flex items-center gap-1 transition-colors">
            {isConfigOpen ? 'Hide Controls' : 'Customize'} <Sliders size={12}/>
          </button>
        </div>

        <div className="mt-3">
          {!isConfigOpen && (
             <div className="flex justify-between items-center text-xs text-slate-500">
               <div className="flex items-center gap-2">
                 <span className="font-medium text-slate-700">{industry} Mode:</span>
                 <span>Medium &gt; ${thresholds.medium}</span>
                 <span>High &gt; ${thresholds.high}</span>
               </div>
             </div>
          )}

          <div className={`space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${isConfigOpen ? 'max-h-96 opacity-100 mt-4 pt-4 border-t border-slate-200' : 'max-h-0 opacity-0'}`}>
             <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Industry Context (Applies Presets)</label>
                <div className="relative">
                  <select 
                    value={industry} 
                    onChange={handleIndustryChange} 
                    className="w-full text-sm border border-slate-300 rounded-md shadow-sm px-3 py-2 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                    {Object.keys(PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="font-medium text-slate-600">Medium Value Threshold</label>
                    <span className="font-bold text-amber-600">${thresholds.medium}</span>
                  </div>
                  <input type="range" min="0" max={thresholds.high} step="50" 
                      value={thresholds.medium}
                      onChange={(e) => setThresholds(prev => ({...prev, medium: Number(e.target.value)}))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Customers with CLV above ${thresholds.medium} are marked Medium.</p>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="font-medium text-slate-600">High Value Threshold</label>
                    <span className="font-bold text-emerald-600">${thresholds.high}</span>
                  </div>
                  <input type="range" min={thresholds.medium} max="10000" step="100" 
                      value={thresholds.high}
                      onChange={(e) => setThresholds(prev => ({...prev, high: Number(e.target.value)}))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                   <p className="text-[10px] text-slate-400 mt-1">Customers with CLV above ${thresholds.high} are marked High.</p>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Mode Toggles */}
      <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
        <button
          onClick={() => {
              setMode('single');
              setSubmitError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all
            ${mode === 'single' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <User size={16} /> Single Customer
        </button>
        <button
          onClick={() => {
              setMode('bulk');
              setSubmitError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all
            ${mode === 'bulk' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileSpreadsheet size={16} /> Bulk Upload
        </button>
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleSubmit} className="space-y-6">
           {/* Demographics */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Demographics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Age</label>
              <input 
                type="number" 
                name="age" 
                value={isNaN(formData.age) ? '' : formData.age}
                onChange={handleChange} 
                className={getInputClass('age')}
                placeholder="18-120"
              />
              {errors.age && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.age}</p>}
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={getInputClass('gender')}>
                {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.gender}</p>}
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <select name="location" value={formData.location} onChange={handleChange} className={getInputClass('location')}>
                {Object.values(LocationType).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.location && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.location}</p>}
            </div>
            <div>
              <label className={labelClass}>Income Level</label>
              <select name="incomeLevel" value={formData.incomeLevel} onChange={handleChange} className={getInputClass('incomeLevel')}>
                {Object.values(IncomeLevel).map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              {errors.incomeLevel && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.incomeLevel}</p>}
            </div>
          </div>
        </div>

        {/* Behavior */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Behavioral Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className={labelClass}>Purchase Freq (orders/month)</label>
              <input 
                type="number" 
                step="0.1" 
                name="purchaseFrequency" 
                value={isNaN(formData.purchaseFrequency) ? '' : formData.purchaseFrequency}
                onChange={handleChange} 
                className={getInputClass('purchaseFrequency')}
                placeholder="e.g. 5.0"
              />
              {errors.purchaseFrequency && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.purchaseFrequency}</p>}
            </div>
            <div>
              <label className={labelClass}>Avg Order Value ($)</label>
              <input 
                type="number" 
                step="0.01" 
                name="avgOrderValue" 
                value={isNaN(formData.avgOrderValue) ? '' : formData.avgOrderValue}
                onChange={handleChange} 
                className={getInputClass('avgOrderValue')}
                placeholder="e.g. 120.00"
              />
              {errors.avgOrderValue && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.avgOrderValue}</p>}
            </div>
            <div>
              <label className={labelClass}>Recency (days ago)</label>
              <input 
                type="number" 
                name="recencyDays" 
                value={isNaN(formData.recencyDays) ? '' : formData.recencyDays}
                onChange={handleChange} 
                className={getInputClass('recencyDays')}
                placeholder="Days since last order"
              />
              {errors.recencyDays && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.recencyDays}</p>}
            </div>
            <div>
              <label className={labelClass}>Tenure (days)</label>
              <input 
                type="number" 
                name="tenureDays" 
                value={isNaN(formData.tenureDays) ? '' : formData.tenureDays}
                onChange={handleChange} 
                className={getInputClass('tenureDays')}
                placeholder="Total days as customer"
              />
              {errors.tenureDays && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.tenureDays}</p>}
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Churn Status</label>
              <select name="churned" value={formData.churned} onChange={handleChange} className={getInputClass('churned')}>
                <option value={0}>Active</option>
                <option value={1}>Churned</option>
              </select>
            </div>
          </div>
        </div>

          {/* Submission Error Alert */}
          {submitError && (
             <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{submitError}</p>
             </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading || !isEnabled}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin h-5 w-5" />}
            {isLoading ? 'Predicting CLV...' : 'Run Single Prediction'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer group relative overflow-hidden
              ${bulkFile ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
            `}
            onClick={() => !isLoading && fileInputRef.current?.click()}
          >
            {/* Progress Overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-slate-600 uppercase">
                            <span>{uploadStatus}</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {bulkFile ? (
               <div className="flex flex-col items-center">
                 <FileText className="w-10 h-10 text-indigo-600 mb-2" />
                 <p className="text-sm font-medium text-indigo-800 break-all">{bulkFile}</p>
                 <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={12}/> Ready to process
                 </p>
               </div>
            ) : (
               <>
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2 group-hover:text-indigo-500 transition-colors" />
                <p className="text-sm font-medium text-slate-600">
                   Click to Upload CSV
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports raw .csv (Auto-clean enabled)</p>
               </>
            )}
          </div>

          {/* Validation Error Report */}
          {csvErrors.length > 0 && (
             <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                 <div className="flex items-start gap-2 text-red-700 mb-2">
                     <AlertTriangle className="w-5 h-5 shrink-0" />
                     <h4 className="text-sm font-semibold">CSV Validation Issues</h4>
                 </div>
                 <ul className="text-xs text-red-600 space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
                     {csvErrors.map((err, idx) => (
                         <li key={idx}>{err}</li>
                     ))}
                 </ul>
                 <p className="text-[10px] text-red-500 mt-2 italic">*Please fix these issues to proceed with accurate predictions.</p>
             </div>
          )}

           {/* Submission Error Alert */}
           {submitError && (
             <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{submitError}</p>
             </div>
          )}

          <button 
            onClick={handleBulkUpload}
            disabled={isLoading || !isEnabled || !bulkFile}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
          >
             {isLoading && <Loader2 className="animate-spin h-5 w-5" />}
             {isLoading ? 'Processing...' : 'Run Bulk Prediction'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;