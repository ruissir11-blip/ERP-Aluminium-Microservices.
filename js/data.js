// Financial Mockup Demo Data

// Chart.js configuration
const CHART_COLORS = {
    primary: '#1e3a5f',
    secondary: '#4a6fa5',
    accent: '#d4a84b',
    success: '#2ecc71',
    danger: '#e74c3c',
    warning: '#f39c12',
    background: '#f5f7fa',
    cardBackground: '#ffffff',
    textPrimary: '#2c3e50',
    textSecondary: '#7f8c8d'
};

// Account types
const ACCOUNT_TYPES = {
    ASSET: 'Asset',
    LIABILITY: 'Liability',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expense'
};

// Chart instances for cleanup
let revenueChart = null;
let expenseChart = null;
let costCenterChart = null;

// Accounts data
const accounts = [
    { code: 1000, name: 'Cash', type: ACCOUNT_TYPES.ASSET, balance: 150000 },
    { code: 1100, name: 'Accounts Receivable', type: ACCOUNT_TYPES.ASSET, balance: 45000 },
    { code: 1200, name: 'Inventory', type: ACCOUNT_TYPES.ASSET, balance: 85000 },
    { code: 1300, name: 'Prepaid Expenses', type: ACCOUNT_TYPES.ASSET, balance: 12000 },
    { code: 1500, name: 'Equipment', type: ACCOUNT_TYPES.ASSET, balance: 200000 },
    { code: 1600, name: 'Accumulated Depreciation', type: ACCOUNT_TYPES.ASSET, balance: -45000 },
    { code: 2000, name: 'Accounts Payable', type: ACCOUNT_TYPES.LIABILITY, balance: 25000 },
    { code: 2100, name: 'Accrued Expenses', type: ACCOUNT_TYPES.LIABILITY, balance: 15000 },
    { code: 2200, name: 'Notes Payable', type: ACCOUNT_TYPES.LIABILITY, balance: 50000 },
    { code: 2300, name: 'Deferred Revenue', type: ACCOUNT_TYPES.LIABILITY, balance: 8000 },
    { code: 3000, name: 'Common Stock', type: ACCOUNT_TYPES.EQUITY, balance: 150000 },
    { code: 3100, name: 'Retained Earnings', type: ACCOUNT_TYPES.EQUITY, balance: 180000 },
    { code: 3200, name: 'Additional Paid-in Capital', type: ACCOUNT_TYPES.EQUITY, balance: 75000 },
    { code: 4000, name: 'Sales Revenue', type: ACCOUNT_TYPES.REVENUE, balance: 450000 },
    { code: 4100, name: 'Service Revenue', type: ACCOUNT_TYPES.REVENUE, balance: 65000 },
    { code: 4200, name: 'Interest Revenue', type: ACCOUNT_TYPES.REVENUE, balance: 5000 },
    { code: 5000, name: 'Cost of Goods Sold', type: ACCOUNT_TYPES.EXPENSE, balance: 180000 },
    { code: 5100, name: 'Salaries & Wages', type: ACCOUNT_TYPES.EXPENSE, balance: 95000 },
    { code: 5200, name: 'Rent Expense', type: ACCOUNT_TYPES.EXPENSE, balance: 24000 },
    { code: 5300, name: 'Utilities', type: ACCOUNT_TYPES.EXPENSE, balance: 8000 },
    { code: 5400, name: 'Depreciation Expense', type: ACCOUNT_TYPES.EXPENSE, balance: 15000 },
    { code: 5500, name: 'Marketing Expense', type: ACCOUNT_TYPES.EXPENSE, balance: 18000 },
    { code: 5600, name: 'Insurance Expense', type: ACCOUNT_TYPES.EXPENSE, balance: 6000 },
    { code: 5700, name: 'Supplies Expense', type: ACCOUNT_TYPES.EXPENSE, balance: 4000 },
    { code: 5800, name: 'Professional Fees', type: ACCOUNT_TYPES.EXPENSE, balance: 7000 }
];

// Sample transactions
const transactions = [
    { id: 1, date: '2026-03-08', description: 'Product Sale - Order #1024', category: 'Revenue', amount: 15000, status: 'Completed' },
    { id: 2, date: '2026-03-07', description: 'Raw Material Purchase', category: 'Expense', amount: -8500, status: 'Completed' },
    { id: 3, date: '2026-03-07', description: 'Service Revenue - Consulting', category: 'Revenue', amount: 5500, status: 'Completed' },
    { id: 4, date: '2026-03-06', description: 'Employee Salaries', category: 'Payroll', amount: -12000, status: 'Completed' },
    { id: 5, date: '2026-03-05', description: 'Equipment Maintenance', category: 'Maintenance', amount: -2500, status: 'Pending' },
    { id: 6, date: '2026-03-05', description: 'Product Sale - Order #1023', category: 'Revenue', amount: 22500, status: 'Completed' },
    { id: 7, date: '2026-03-04', description: 'Office Supplies', category: 'Expense', amount: -850, status: 'Completed' },
    { id: 8, date: '2026-03-04', description: 'Marketing Campaign', category: 'Marketing', amount: -3500, status: 'Completed' },
    { id: 9, date: '2026-03-03', description: 'Utility Bill Payment', category: 'Utilities', amount: -1200, status: 'Completed' },
    { id: 10, date: '2026-03-03', description: 'Customer Payment Received', category: 'Revenue', amount: 18000, status: 'Completed' }
];

// KPIs data
const kpis = {
    revenue: { value: 450000, trend: 12.5 },
    expenses: { value: 280000, trend: -5.2 },
    profit: { value: 170000, percentage: 37.8 },
    cashFlow: { value: 45000, status: 'Positive' }
};

// Revenue data for line chart (12 months)
const revenueData = {
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    values: [320000, 345000, 380000, 365000, 390000, 420000, 410000, 435000, 460000, 425000, 440000, 450000]
};

// Expense breakdown for doughnut chart
const expenseData = {
    labels: ['COGS', 'Payroll', 'Rent', 'Marketing', 'Utilities', 'Other'],
    values: [180000, 95000, 24000, 18000, 8000, 15000]
};

// Cost centers for cost analysis
const costCenters = {
    labels: ['Production', 'Administration', 'Sales', 'R&D'],
    currentPeriod: [145000, 42000, 38000, 28000],
    previousPeriod: [138000, 45000, 35000, 22000],
    budget: [150000, 45000, 40000, 30000]
};

// Budget vs Actual data
const budgetVsActual = [
    { category: 'Production', budget: 150000, actual: 145000, variance: 5000 },
    { category: 'Administration', budget: 45000, actual: 42000, variance: 3000 },
    { category: 'Sales', budget: 40000, actual: 38000, variance: 2000 },
    { category: 'R&D', budget: 30000, actual: 28000, variance: 2000 }
];

// Profitability by product/category
const profitabilityData = [
    { product: 'Aluminum Profiles', revenue: 280000, cost: 165000, profit: 115000, margin: 41.1 },
    { product: 'Custom Fabrications', revenue: 95000, cost: 62000, profit: 33000, margin: 34.7 },
    { product: 'Installation Services', revenue: 65000, cost: 38000, profit: 27000, margin: 41.5 },
    { product: 'Consulting', revenue: 35000, cost: 12000, profit: 23000, margin: 65.7 }
];

// Report data generators
function generateIncomeStatement(startDate, endDate) {
    return {
        revenue: {
            'Sales Revenue': 450000,
            'Service Revenue': 65000,
            'Interest Revenue': 5000,
            total: 520000
        },
        expenses: {
            'Cost of Goods Sold': 180000,
            'Salaries & Wages': 95000,
            'Rent Expense': 24000,
            'Utilities': 8000,
            'Depreciation Expense': 15000,
            'Marketing Expense': 18000,
            'Insurance Expense': 6000,
            'Supplies Expense': 4000,
            'Professional Fees': 7000,
            total: 356000
        },
        netIncome: 164000
    };
}

function generateBalanceSheet() {
    const assets = {
        current: {
            'Cash': 150000,
            'Accounts Receivable': 45000,
            'Inventory': 85000,
            'Prepaid Expenses': 12000,
            total: 292000
        },
        fixed: {
            'Equipment': 200000,
            'Accumulated Depreciation': -45000,
            total: 155000
        },
        totalAssets: 447000
    };

    const liabilities = {
        current: {
            'Accounts Payable': 25000,
            'Accrued Expenses': 15000,
            'Deferred Revenue': 8000,
            total: 48000
        },
        longTerm: {
            'Notes Payable': 50000,
            total: 50000
        },
        totalLiabilities: 98000
    };

    const equity = {
        'Common Stock': 150000,
        'Additional Paid-in Capital': 75000,
        'Retained Earnings': 180000,
        total: 405000
    };

    return { assets, liabilities, equity };
}

function generateCashFlowStatement() {
    return {
        operating: {
            'Net Income': 164000,
            'Depreciation': 15000,
            'Changes in AR': -5000,
            'Changes in Inventory': 8000,
            'Changes in AP': 3000,
            total: 185000
        },
        investing: {
            'Equipment Purchase': -25000,
            total: -25000
        },
        financing: {
            'Debt Repayment': -10000,
            'Dividends Paid': -15000,
            total: -25000
        },
        netChange: 135000,
        beginningCash: 15000,
        endingCash: 150000
    };
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format percentage
function formatPercentage(value) {
    return value.toFixed(1) + '%';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Export all data for CSV
function exportToCSV(data, filename) {
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// LocalStorage helpers
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Initialize demo data if not exists
function initializeDemoData() {
    if (!loadFromLocalStorage('finmock_accounts')) {
        saveToLocalStorage('finmock_accounts', accounts);
    }
    if (!loadFromLocalStorage('finmock_transactions')) {
        saveToLocalStorage('finmock_transactions', transactions);
    }
    if (!loadFromLocalStorage('finmock_kpis')) {
        saveToLocalStorage('finmock_kpis', kpis);
    }
}

// Get accounts (from localStorage or default)
function getAccounts() {
    return loadFromLocalStorage('finmock_accounts') || accounts;
}

// Get transactions (from localStorage or default)
function getTransactions() {
    return loadFromLocalStorage('finmock_transactions') || transactions;
}

// Get KPIs (from localStorage or default)
function getKPIs() {
    return loadFromLocalStorage('finmock_kpis') || kpis;
}

// Add new transaction
function addTransaction(transaction) {
    const transactions = getTransactions();
    const newTransaction = {
        id: transactions.length + 1,
        ...transaction,
        status: 'Completed'
    };
    transactions.unshift(newTransaction);
    saveToLocalStorage('finmock_transactions', transactions);
    return newTransaction;
}

// Update KPIs after transaction
function updateKPIs() {
    const trans = getTransactions();
    let revenue = 0;
    let expenses = 0;

    trans.forEach(t => {
        if (t.amount > 0) revenue += t.amount;
        else expenses += Math.abs(t.amount);
    });

    const kpis = {
        revenue: { value: revenue + 420000, trend: 12.5 },
        expenses: { value: expenses + 265000, trend: -5.2 },
        profit: { value: (revenue + 420000) - (expenses + 265000), percentage: 37.8 },
        cashFlow: { value: 45000, status: 'Positive' }
    };

    saveToLocalStorage('finmock_kpis', kpis);
    return kpis;
}
