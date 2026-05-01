import { CustomerData, PredictionResult, BulkPredictionResult, TrainingMetrics, Gender, LocationType, IncomeLevel, SegmentationThresholds } from '../types';

// Simulate a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_THRESHOLDS: SegmentationThresholds = {
  medium: 500,
  high: 2000
};

// --- DATA CLEANING UTILITIES ---

const cleanNumber = (val: string | undefined, def: number): number => {
  if (!val) return def;
  const cleaned = val.replace(/[^0-9.-]/g, ''); // Remove currency symbols, commas, text
  const num = parseFloat(cleaned);
  return isNaN(num) ? def : num;
};

const inferGender = (val: string | undefined): Gender => {
  if (!val) return Gender.Female; // Default
  const v = val.toLowerCase();
  if (v.startsWith('m')) return Gender.Male;
  return Gender.Female;
};

const inferLocation = (val: string | undefined): LocationType => {
  if (!val) return LocationType.Suburban;
  const v = val.toLowerCase();
  if (v.includes('urb') || v.includes('city')) return LocationType.Urban;
  if (v.includes('rur') || v.includes('country')) return LocationType.Rural;
  return LocationType.Suburban;
};

const inferIncome = (val: string | undefined): IncomeLevel => {
  if (!val) return IncomeLevel.Medium;
  const v = val.toLowerCase();
  if (v.includes('hi')) return IncomeLevel.High;
  if (v.includes('lo')) return IncomeLevel.Low;
  return IncomeLevel.Medium;
};

export const parseAndCleanCSV = (csvText: string): { data: CustomerData[], errors: string[] } => {
  const errors: string[] = [];
  const lines = csvText.split(/\r?\n/);
  
  if (lines.length < 2) {
    return { data: [], errors: ["File is empty or contains only headers."] };
  }

  // 1. Identify Headers
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  // Helper to find column index loosely
  const findIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

  const map = {
    id: findIdx(['id', 'cust', 'ref']),
    age: findIdx(['age', 'year', 'birth']),
    gender: findIdx(['gen', 'sex']),
    loc: findIdx(['loc', 'city', 'region', 'area']),
    inc: findIdx(['inc', 'sal', 'brack']),
    freq: findIdx(['freq', 'ord', 'pur']),
    aov: findIdx(['aov', 'avg', 'val']),
    rec: findIdx(['rec', 'last', 'since']),
    ten: findIdx(['ten', 'dur', 'mem']),
    churn: findIdx(['chu', 'sta', 'act'])
  };

  // Validation: Check critical headers
  if (map.freq === -1) errors.push("Missing critical column: 'Purchase Frequency' (keywords: freq, ord, pur)");
  if (map.aov === -1) errors.push("Missing critical column: 'Avg Order Value' (keywords: aov, avg, val)");
  if (map.ten === -1) errors.push("Missing critical column: 'Tenure' (keywords: ten, dur, mem)");

  // 2. Parse Rows
  const cleanData: CustomerData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map(c => c.trim());
    
    // Skip empty rows or extremely malformed ones
    if (cols.length < 2) {
       // Only report if it looks like data was attempted (length check prevents empty newlines being errors)
       if (line.length > 5) errors.push(`Row ${i + 1}: Skipped (too few columns)`);
       continue;
    }

    // specific field validation before cleaning
    if (map.age > -1) {
        const val = parseFloat(cols[map.age]);
        if (isNaN(val) || val < 0 || val > 120) errors.push(`Row ${i + 1}: Invalid Age value '${cols[map.age]}'`);
    }
    
    if (map.freq > -1) {
        const val = parseFloat(cols[map.freq]);
        if (isNaN(val)) errors.push(`Row ${i + 1}: Invalid Frequency value '${cols[map.freq]}'`);
    }

    const rowData: CustomerData = {
      id: map.id > -1 ? cols[map.id] : `UNK-${i}`,
      age: cleanNumber(map.age > -1 ? cols[map.age] : undefined, 35),
      gender: inferGender(map.gender > -1 ? cols[map.gender] : undefined),
      location: inferLocation(map.loc > -1 ? cols[map.loc] : undefined),
      incomeLevel: inferIncome(map.inc > -1 ? cols[map.inc] : undefined),
      
      // Critical Metrics (Defaults provided to prevent math errors)
      purchaseFrequency: cleanNumber(map.freq > -1 ? cols[map.freq] : undefined, 1),
      avgOrderValue: cleanNumber(map.aov > -1 ? cols[map.aov] : undefined, 50),
      recencyDays: cleanNumber(map.rec > -1 ? cols[map.rec] : undefined, 30),
      tenureDays: cleanNumber(map.ten > -1 ? cols[map.ten] : undefined, 365),
      
      // Logic for Churn: accepts 1/0, true/false, yes/no
      churned: (() => {
        if (map.churn === -1) return 0;
        const raw = cols[map.churn]?.toLowerCase() || '';
        if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'churned') return 1;
        return 0;
      })()
    };

    cleanData.push(rowData);
  }

  return { data: cleanData, errors };
};

// --- PREDICTION LOGIC ---

export const trainModel = async (): Promise<TrainingMetrics> => {
  await delay(2500); // Simulate training time
  return {
    r2Score: 0.87,
    mae: 45.20,
    rmse: 62.15,
    samplesProcessed: 10000
  };
};

export const predictCLV = async (data: CustomerData, thresholds: SegmentationThresholds = DEFAULT_THRESHOLDS): Promise<PredictionResult> => {
  // Simulate inference time
  await delay(100); 

  // Equation: CLV = PurchaseFrequency * AvgOrderValue * (TenureDays / 365) * (1 - 0.5 * Churned)
  const tenureYears = data.tenureDays / 365;
  const churnFactor = 1 - (0.5 * data.churned);
  
  const calculatedScore = data.purchaseFrequency * data.avgOrderValue * tenureYears * churnFactor;
  const finalCLV = Math.max(0, calculatedScore);

  let segment: 'High' | 'Medium' | 'Low' = 'Low';
  
  if (finalCLV >= thresholds.high) {
    segment = 'High';
  } else if (finalCLV >= thresholds.medium) {
    segment = 'Medium';
  }

  return {
    clv: finalCLV,
    segment,
    confidence: 0.85 + (Math.random() * 0.10),
    inputData: data
  };
};

export const predictBulk = async (customers: CustomerData[], thresholds: SegmentationThresholds = DEFAULT_THRESHOLDS): Promise<BulkPredictionResult> => {
  await delay(1500); // Simulate processing time for batch
  
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let totalCLV = 0;

  const details = customers.map(customer => {
    const tenureYears = customer.tenureDays / 365;
    const churnFactor = 1 - (0.5 * customer.churned);
    const calculatedScore = customer.purchaseFrequency * customer.avgOrderValue * tenureYears * churnFactor;
    const predictedCLV = Math.max(0, calculatedScore);

    let segment: 'High' | 'Medium' | 'Low' = 'Low';
    if (predictedCLV >= thresholds.high) {
      segment = 'High';
      highCount++;
    } else if (predictedCLV >= thresholds.medium) {
      segment = 'Medium';
      mediumCount++;
    } else {
      lowCount++;
    }
    
    totalCLV += predictedCLV;

    return {
      ...customer,
      predictedCLV,
      segment
    };
  });

  return {
    summary: {
      totalCustomers: customers.length,
      avgCLV: customers.length > 0 ? totalCLV / customers.length : 0,
      highCount,
      mediumCount,
      lowCount
    },
    details
  };
};

export const generateMockDataset = (count: number): CustomerData[] => {
  return Array.from({ length: count }).map((_, index) => {
    const isHighValue = Math.random() > 0.7;
    
    return {
      id: `CUST-${1000 + index}`,
      age: 18 + Math.floor(Math.random() * 60),
      gender: Math.random() > 0.5 ? Gender.Male : Gender.Female,
      location: Object.values(LocationType)[Math.floor(Math.random() * 3)],
      incomeLevel: Object.values(IncomeLevel)[Math.floor(Math.random() * 3)],
      purchaseFrequency: isHighValue ? 5 + Math.random() * 10 : 1 + Math.random() * 5,
      avgOrderValue: isHighValue ? 150 + Math.random() * 300 : 20 + Math.random() * 100,
      recencyDays: Math.floor(Math.random() * 90),
      tenureDays: 30 + Math.floor(Math.random() * 1000),
      churned: Math.random() > 0.9 ? 1 : 0
    };
  });
};