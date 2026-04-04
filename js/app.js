// ============================================
// ERP Aluminium - Financial Mockup Application
// ============================================

// Application State
const AppState = {
    isLoggedIn: false,
    currentPage: 'login',
    demoMode: false
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoData();
    checkSession();
    setupEventListeners();
    initCharts();
});

// Check for existing session
function checkSession() {
    const isLoggedIn = loadFromLocalStorage('finmock_isLoggedIn');
    const demoMode = loadFromLocalStorage('finmock_demoMode');
    
    if (isLoggedIn || demoMode) {
        AppState.isLoggedIn = true;
        AppState.demoMode = demoMode || false;
        showPage('dashboard');
        updateUserInfo();
    } else {
        showPage('login');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Demo mode link
    const demoLink = document.getElementById('demoLink');
    if (demoLink) {
        demoLink.addEventListener('click', handleDemoLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Quick action buttons
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => openModal('expenseModal'));
    }
    
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => showPage('reports'));
    }
    
    const viewInvoicesBtn = document.getElementById('viewInvoicesBtn');
    if (viewInvoicesBtn) {
        viewInvoicesBtn.addEventListener('click', () => showPage('accounting'));
    }
    
    // Modal close buttons
    const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-footer .btn-outline');
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Transaction form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
    
    // Search inputs
    const searchInput = document.getElementById('accountSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterAccounts);
    }
    
    // Report type selection
    const reportTypeSelect = document.getElementById('reportType');
    if (reportTypeSelect) {
        reportTypeSelect.addEventListener('change', generateReport);
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReport);
    }
    
    // Date inputs for reports
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    if (dateFrom && dateTo) {
        dateFrom.addEventListener('change', generateReport);
        dateTo.addEventListener('change', generateReport);
    }
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Basic validation
    if (!username || !password) {
        showError('Please enter username and password');
        return;
    }
    
    // Simulate authentication (in real app, this would call an API)
    if (username === 'admin' && password === 'admin') {
        AppState.isLoggedIn = true;
        AppState.demoMode = false;
        saveToLocalStorage('finmock_isLoggedIn', true);
        saveToLocalStorage('finmock_demoMode', false);
        saveToLocalStorage('finmock_username', username);
        
        updateUserInfo();
        showPage('dashboard');
        errorMessage.classList.remove('visible');
    } else {
        showError('Invalid username or password');
    }
}

// Handle demo mode login
function handleDemoLogin(e) {
    e.preventDefault();
    
    AppState.isLoggedIn = true;
    AppState.demoMode = true;
    saveToLocalStorage('finmock_isLoggedIn', true);
    saveToLocalStorage('finmock_demoMode', true);
    saveToLocalStorage('finmock_username', 'Demo User');
    
    updateUserInfo();
    showPage('dashboard');
}

// Handle logout
function handleLogout() {
    AppState.isLoggedIn = false;
    AppState.demoMode = false;
    localStorage.removeItem('finmock_isLoggedIn');
    localStorage.removeItem('finmock_demoMode');
    localStorage.removeItem('finmock_username');
    
    showPage('login');
    
    // Reset charts
    if (revenueChart) revenueChart.destroy();
    if (expenseChart) expenseChart.destroy();
    if (costCenterChart) costCenterChart.destroy();
    initCharts();
}

// Show error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
    }
}

// Update user info in header
function updateUserInfo() {
    const username = loadFromLocalStorage('finmock_username') || (AppState.demoMode ? 'Demo User' : 'Admin');
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    
    if (userNameEl) {
        userNameEl.textContent = username;
    }
    if (userRoleEl) {
        userRoleEl.textContent = AppState.demoMode ? 'Demo Mode' : 'Administrator';
    }
}

// Show/hide pages
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        AppState.currentPage = pageId;
        
        // Initialize page-specific content
        if (pageId === 'dashboard') {
            renderDashboard();
        } else if (pageId === 'accounting') {
            renderAccounting();
        } else if (pageId === 'costAnalysis') {
            renderCostAnalysis();
        } else if (pageId === 'reports') {
            renderReports();
        }
    }
    
    // Update navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });
    
    // Update header title
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) {
        const titles = {
            'dashboard': 'Financial Dashboard',
            'accounting': 'Accounting',
            'costAnalysis': 'Cost Analysis',
            'reports': 'Reports'
        };
        headerTitle.textContent = titles[pageId] || 'Financial Dashboard';
    }
}

// Handle navigation clicks
function handleNavigation(e) {
    const page = e.currentTarget.dataset.page;
    if (page) {
        showPage(page);
    }
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// Initialize charts
function initCharts() {
    // Wait for Chart.js to load
    if (typeof Chart === 'undefined') {
        setTimeout(initCharts, 100);
        return;
    }
    
    // Destroy existing charts
    if (revenueChart) revenueChart.destroy();
    if (expenseChart) expenseChart.destroy();
    if (costCenterChart) costCenterChart.destroy();
    
    // Revenue Line Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        revenueChart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: revenueData.labels,
                datasets: [{
                    label: 'Revenue',
                    data: revenueData.values,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2ecc71',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
    
    // Expense Doughnut Chart
    const expenseCtx = document.getElementById('expenseChart');
    if (expenseCtx) {
        expenseChart = new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: expenseData.labels,
                datasets: [{
                    data: expenseData.values,
                    backgroundColor: [
                        '#1e3a5f',
                        '#4a6fa5',
                        '#d4a84b',
                        '#2ecc71',
                        '#e74c3c',
                        '#7f8c8d'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
}

// Render dashboard
function renderDashboard() {
    renderKPICards();
    renderTransactionsTable();
    initCharts();
}

// Render KPI cards
function renderKPICards() {
    const kpis = getKPIs();
    
    // Revenue card
    const revenueValue = document.getElementById('revenueValue');
    const revenueTrend = document.getElementById('revenueTrend');
    if (revenueValue) {
        revenueValue.textContent = formatCurrency(kpis.revenue.value);
    }
    if (revenueTrend) {
        const trendEl = revenueTrend.parentElement;
        trendEl.className = 'kpi-trend ' + (kpis.revenue.trend >= 0 ? 'up' : 'down');
        revenueTrend.innerHTML = kpis.revenue.trend >= 0 
            ? '<i class="fas fa-arrow-up"></i> ' + kpis.revenue.trend + '%'
            : '<i class="fas fa-arrow-down"></i> ' + Math.abs(kpis.revenue.trend) + '%';
    }
    
    // Expenses card
    const expensesValue = document.getElementById('expensesValue');
    const expensesTrend = document.getElementById('expensesTrend');
    if (expensesValue) {
        expensesValue.textContent = formatCurrency(kpis.expenses.value);
    }
    if (expensesTrend) {
        const trendEl = expensesTrend.parentElement;
        trendEl.className = 'kpi-trend ' + (kpis.expenses.trend >= 0 ? 'up' : 'down');
        expensesTrend.innerHTML = kpis.expenses.trend >= 0 
            ? '<i class="fas fa-arrow-up"></i> ' + kpis.expenses.trend + '%'
            : '<i class="fas fa-arrow-down"></i> ' + Math.abs(kpis.expenses.trend) + '%';
    }
    
    // Profit card
    const profitValue = document.getElementById('profitValue');
    const profitPercent = document.getElementById('profitPercent');
    if (profitValue) {
        profitValue.textContent = formatCurrency(kpis.profit.value);
    }
    if (profitPercent) {
        profitPercent.textContent = kpis.profit.percentage + '%';
        const statusEl = profitPercent.parentElement;
        statusEl.className = 'kpi-status ' + (kpis.profit.percentage >= 0 ? 'positive' : 'negative');
    }
    
    // Cash Flow card
    const cashFlowValue = document.getElementById('cashFlowValue');
    const cashFlowStatus = document.getElementById('cashFlowStatus');
    if (cashFlowValue) {
        cashFlowValue.textContent = formatCurrency(kpis.cashFlow.value);
    }
    if (cashFlowStatus) {
        cashFlowStatus.textContent = kpis.cashFlow.status;
        cashFlowStatus.className = 'kpi-status ' + (kpis.cashFlow.status === 'Positive' ? 'positive' : 'negative');
    }
}

// Render transactions table
function renderTransactionsTable() {
    const tbody = document.getElementById('transactionsBody');
    if (!tbody) return;
    
    const transactions = getTransactions();
    const recentTransactions = transactions.slice(0, 10);
    
    tbody.innerHTML = recentTransactions.map(t => {
        const isPositive = t.amount >= 0;
        return `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.description}</td>
            <td>${t.category}</td>
            <td class="amount ${isPositive ? 'positive' : 'negative'}">
                ${formatCurrency(Math.abs(t.amount))}
            </td>
            <td><span class="status-badge ${t.status.toLowerCase()}">${t.status}</span></td>
        </tr>
    `}).join('');
}

// Render accounting page
function renderAccounting() {
    renderAccountList();
    populateAccountDropdowns();
    calculateTrialBalance();
}

// Render account list
function renderAccountList() {
    const accountList = document.getElementById('accountList');
    if (!accountList) return;
    
    const accounts = getAccounts();
    const groupedAccounts = {
        'Asset': accounts.filter(a => a.type === 'Asset'),
        'Liability': accounts.filter(a => a.type === 'Liability'),
        'Equity': accounts.filter(a => a.type === 'Equity'),
        'Revenue': accounts.filter(a => a.type === 'Revenue'),
        'Expense': accounts.filter(a => a.type === 'Expense')
    };
    
    let html = '';
    for (const [type, typeAccounts] of Object.entries(groupedAccounts)) {
        if (typeAccounts.length > 0) {
            html += '<div class="account-type-header">' + type + '</div>';
            typeAccounts.forEach(account => {
                html += '<div class="trial-balance-row">';
                html += '<span>' + account.code + ' - ' + account.name + '</span>';
                html += '<span class="font-mono">' + formatCurrency(account.balance) + '</span>';
                html += '</div>';
            });
        }
    }
    
    accountList.innerHTML = html;
}

// Populate account dropdowns
function populateAccountDropdowns() {
    const accounts = getAccounts();
    const debitSelect = document.getElementById('debitAccount');
    const creditSelect = document.getElementById('creditAccount');
    
    const options = '<option value="">Select Account</option>' + 
        accounts.map(a => '<option value="' + a.code + '">' + a.code + ' - ' + a.name + '</option>').join('');
    
    if (debitSelect) debitSelect.innerHTML = options;
    if (creditSelect) creditSelect.innerHTML = options;
}

// Calculate trial balance
function calculateTrialBalance() {
    const accounts = getAccounts();
    
    let totalDebits = 0;
    let totalCredits = 0;
    
    accounts.forEach(account => {
        if (account.type === 'Asset' || account.type === 'Expense') {
            if (account.balance > 0) {
                totalDebits += account.balance;
            } else {
                totalCredits += Math.abs(account.balance);
            }
        } else {
            if (account.balance > 0) {
                totalCredits += account.balance;
            } else {
                totalDebits += Math.abs(account.balance);
            }
        }
    });
    
    const debitTotal = document.getElementById('debitTotal');
    const creditTotal = document.getElementById('creditTotal');
    
    if (debitTotal) debitTotal.textContent = formatCurrency(totalDebits);
    if (creditTotal) creditTotal.textContent = formatCurrency(totalCredits);
}

// Filter accounts
function filterAccounts() {
    const searchTerm = document.getElementById('accountSearch').value.toLowerCase();
    const accounts = getAccounts();
    
    const filtered = accounts.filter(a => 
        a.name.toLowerCase().includes(searchTerm) || 
        a.code.toString().includes(searchTerm)
    );
    
    // Re-render with filtered accounts (simplified for demo)
    renderAccountList();
}

// Handle transaction form submit
function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const date = document.getElementById('transactionDate').value;
    const description = document.getElementById('transactionDescription').value;
    const debitAccount = document.getElementById('debitAccount').value;
    const creditAccount = document.getElementById('creditAccount').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    
    if (!date || !description || !debitAccount || !creditAccount || !amount) {
        alert('Please fill in all fields');
        return;
    }
    
    // Add transaction
    const transaction = {
        date: date,
        description: description,
        category: 'Journal Entry',
        amount: -amount,
        status: 'Completed'
    };
    
    addTransaction(transaction);
    updateKPIs();
    
    // Close modal and refresh
    closeAllModals();
    renderTransactionsTable();
    renderKPICards();
    
    // Reset form
    e.target.reset();
}

// Render cost analysis page
function renderCostAnalysis() {
    renderCostCenterChart();
    renderBudgetVsActual();
    renderProfitability();
}

// Render cost center chart
function renderCostCenterChart() {
    if (typeof Chart === 'undefined') return;
    
    const ctx = document.getElementById('costCenterChart');
    if (!ctx) return;
    
    if (costCenterChart) costCenterChart.destroy();
    
    costCenterChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: costCenters.labels,
            datasets: [
                {
                    label: 'Current Period',
                    data: costCenters.currentPeriod,
                    backgroundColor: '#1e3a5f'
                },
                {
                    label: 'Previous Period',
                    data: costCenters.previousPeriod,
                    backgroundColor: '#4a6fa5'
                },
                {
                    label: 'Budget',
                    data: costCenters.budget,
                    backgroundColor: '#d4a84b'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Render budget vs actual table
function renderBudgetVsActual() {
    const tbody = document.getElementById('budgetTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = budgetVsActual.map(item => {
        const varianceClass = item.variance >= 0 ? 'variance-positive' : 'variance-negative';
        return '<tr>' +
            '<td>' + item.category + '</td>' +
            '<td class="font-mono">' + formatCurrency(item.budget) + '</td>' +
            '<td class="font-mono">' + formatCurrency(item.actual) + '</td>' +
            '<td class="font-mono ' + varianceClass + '">' + 
            (item.variance >= 0 ? '+' : '') + formatCurrency(item.variance) +
            '</td>' +
        '</tr>';
    }).join('');
}

// Render profitability table
function renderProfitability() {
    const tbody = document.getElementById('profitabilityTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = profitabilityData.map(item => {
        return '<tr>' +
            '<td>' + item.product + '</td>' +
            '<td class="font-mono">' + formatCurrency(item.revenue) + '</td>' +
            '<td class="font-mono">' + formatCurrency(item.cost) + '</td>' +
            '<td class="font-mono">' + formatCurrency(item.profit) + '</td>' +
            '<td>' + item.margin.toFixed(1) + '%' +
                '<div class="margin-bar">' +
                    '<div class="margin-fill" style="width: ' + item.margin + '%"></div>' +
                '</div>' +
            '</td>' +
        '</tr>';
    }).join('');
}

// Render reports page
function renderReports() {
    // Set default dates
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (dateFrom && !dateFrom.value) {
        dateFrom.value = '2026-01-01';
    }
    if (dateTo && !dateTo.value) {
        dateTo.value = getCurrentDate();
    }
    
    generateReport();
}

// Generate report based on selection
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportContainer = document.getElementById('reportContainer');
    
    if (!reportContainer) return;
    
    let html = '';
    
    if (reportType === 'income') {
        html = generateIncomeStatementHTML();
    } else if (reportType === 'balance') {
        html = generateBalanceSheetHTML();
    } else if (reportType === 'cashflow') {
        html = generateCashFlowHTML();
    }
    
    reportContainer.innerHTML = html;
}

// Generate income statement HTML
function generateIncomeStatementHTML() {
    const data = generateIncomeStatement();
    
    let html = '<div class="report-section">' +
        '<h3 class="report-section-title">Income Statement (Profit & Loss)</h3>' +
        '<div class="report-section">' +
        '<h4>Revenue</h4>';
    
    for (const [key, value] of Object.entries(data.revenue)) {
        if (key !== 'total') {
            html += '<div class="report-line indent"><span>' + key + '</span><span class="font-mono">' + formatCurrency(value) + '</span></div>';
        }
    }
    
    html += '<div class="report-line total"><span>Total Revenue</span><span class="font-mono">' + formatCurrency(data.revenue.total) + '</span></div>' +
        '</div><div class="report-section"><h4>Expenses</h4>';
    
    for (const [key, value] of Object.entries(data.expenses)) {
        if (key !== 'total') {
            html += '<div class="report-line indent"><span>' + key + '</span><span class="font-mono">' + formatCurrency(value) + '</span></div>';
        }
    }
    
    const netIncomeColor = data.netIncome >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
    
    html += '<div class="report-line total"><span>Total Expenses</span><span class="font-mono">' + formatCurrency(data.expenses.total) + '</span></div>' +
        '</div><div class="report-line grand-total" style="color: ' + netIncomeColor + '">' +
        '<span>Net Income</span><span class="font-mono">' + formatCurrency(data.netIncome) + '</span></div></div>';
    
    return html;
}

// Generate balance sheet HTML
function generateBalanceSheetHTML() {
    const data = generateBalanceSheet();
    
    let html = '<div class="report-section"><h3 class="report-section-title">Balance Sheet</h3>';
    
    // Assets
    html += '<div class="report-section"><h4>Assets</h4>';
    html += '<div class="report-line indent"><span><strong>Current Assets</strong></span></div>';
    
    for (const [key, value] of Object.entries(data.assets.current)) {
        if (key !== 'total') {
            html += '<div class="report-line indent" style="padding-left: 32px;"><span>' + key + '</span><span class="font-mono">' + formatCurrency(value) + '</span></div>';
        }
    }
    
    html += '<div class="report-line total" style="padding-left: 16px;"><span>Total Current Assets</span><span class="font-mono">' + formatCurrency(data.assets.current.total) + '</span></div>';
    html += '<div class="report-line indent"><span><strong>Fixed Assets</strong></span></div>';
    
    for (const [key, value] of Object.entries(data.assets.fixed)) {
        if (key !== 'total') {
            html += '<div class="report-line indent" style="padding-left: 32px;"><span>' + key + '</span><span class="font-mono">' + formatCurrency(value) + '</span></div>';
        }
    }
    
    html += '<div class="report-line total" style="padding-left: 16px;"><span>Total Fixed Assets</span><span class="font-mono">' + formatCurrency(data.assets.fixed.total) + '</span></div>';
    html += '<div class="report-line grand-total"><span>Total Assets</span><span class="font-mono">' + formatCurrency(data.assets.totalAssets) + '</span></div></div>';
    
    // Liabilities
    html += '<div class="report-section"><h4>Liabilities</h4>';
    
    for (const [key, value] of Object.entries(data.liabilities.current)) {
        if (key !== 'total') {
            html += '<div class="report-line indent"><span>' + key + '</span><span class="font-mono">' + formatCurrency(value) + '</span></div>';
        }
    }
    
    html += '<div class="report-line total"><span>Total Current Liabilities</span><span class="font-mono">' + formatCurrency(data.liabilities.current.total) + '</span></div>';
    
    for (const [key, value] of Object.entries(data.liabilities.longTerm)) {
        if (key !== 'total') {
            html += '<div class="report-line indent"><span>' + key + '</span><span class="font-mono">' + formatCurrency(value) + '</span></div>';
        }
    }
    
    html += '<div class="report-line total"><span>Total Long-Term Liabilities</span><span class="font-mono">' + formatCurrency(data.liabilities.longTerm.total) + '</span></div>';
    html += '<div class="report-line grand-total"><span>Total Liabilities</span><span class="font-mono">' + formatCurrency(data.liabilities.totalLiabilities) + '</span></div></div>';
    
    // Equity
    html += '<div class="report-section"><h4>Equity</h4>';
    
    for (const [key, value] of Object.entries(data.equity)) {
        if (key !== 'total') {
            html += '<div class="report-line indent"><span>' + key + '</span><span class="font-mono">' + formatCurrency(value) + '</span></div>';
        }
    }
    
    html += '<div class="report-line grand-total"><span>Total Equity</span><span class="font-mono">' + formatCurrency(data.equity.total) + '</span></div></div>';
    html += '<div class="report-line grand-total"><span>Total Liabilities & Equity</span><span class="font-mono">' + formatCurrency(data.liabilities.totalLiabilities + data.equity.total) + '</span></div></div>';
    
    return html;
}

// Generate cash flow statement HTML
function generateCashFlowHTML() {
    const data = generateCashFlowStatement();
    
    let html = '<div class="report-section"><h3 class="report-section-title">Cash Flow Statement</h3>';
    
    // Operating Activities
    html += '<div class="report-section"><h4>Operating Activities</h4>';
    for (const [key, value] of Object.entries(data.operating)) {
        if (key !== 'total') {
            html += '<div class="report-line indent"><span>' + key + '</span><span class="font-mono">' + formatCurrency(value) + '</span></div>';
        }
    }
    html += '<div class="report-line total"><span>Net Cash from Operating</span><span class="font-mono">' + formatCurrency(data.operating.total) + '</span></div></div>';
    
    // Investing Activities
    html += '<div class="report-section"><h4>Investing Activities</h4>';
    for (const [key, value] of Object.entries(data.investing)) {
        if (key !== 'total') {
            html += '<div class="report-line indent"><span>' + key + '</span><span class="font-mono">' + formatCurrency(value) + '</span></div>';
        }
    }
    html += '<div class="report-line total"><span>Net Cash from Investing</span><span class="font-mono">' + formatCurrency(data.investing.total) + '</span></div></div>';
    
    // Financing Activities
    html += '<div class="report-section"><h4>Financing Activities</h4>';
    for (const [key, value] of Object.entries(data.financing)) {
        if (key !== 'total') {
            html += '<div class="report-line indent"><span>' + key + '</span><span class="font-mono">' + formatCurrency(value) + '</span></div>';
        }
    }
    html += '<div class="report-line total"><span>Net Cash from Financing</span><span class="font-mono">' + formatCurrency(data.financing.total) + '</span></div></div>';
    
    html += '<div class="report-line"><span>Net Change in Cash</span><span class="font-mono">' + formatCurrency(data.netChange) + '</span></div>';
    html += '<div class="report-line"><span>Beginning Cash</span><span class="font-mono">' + formatCurrency(data.beginningCash) + '</span></div>';
    html += '<div class="report-line grand-total"><span>Ending Cash</span><span class="font-mono">' + formatCurrency(data.endingCash) + '</span></div></div>';
    
    return html;
}

// Export report to CSV
function exportReport() {
    const reportType = document.getElementById('reportType').value;
    let data = [];
    let filename = '';
    
    if (reportType === 'income') {
        const income = generateIncomeStatement();
        data = [
            { category: 'Revenue', item: 'Sales Revenue', amount: income.revenue['Sales Revenue'] },
            { category: 'Revenue', item: 'Service Revenue', amount: income.revenue['Service Revenue'] },
            { category: 'Revenue', item: 'Interest Revenue', amount: income.revenue['Interest Revenue'] },
            { category: 'Revenue', item: 'Total Revenue', amount: income.revenue.total },
            { category: 'Expenses', item: 'Cost of Goods Sold', amount: income.expenses['Cost of Goods Sold'] },
            { category: 'Expenses', item: 'Salaries & Wages', amount: income.expenses['Salaries & Wages'] },
            { category: 'Expenses', item: 'Rent Expense', amount: income.expenses['Rent Expense'] },
            { category: 'Expenses', item: 'Total Expenses', amount: income.expenses.total },
            { category: '', item: 'Net Income', amount: income.netIncome }
        ];
        filename = 'income_statement.csv';
    } else if (reportType === 'balance') {
        const bs = generateBalanceSheet();
        data = [
            { category: 'Assets', item: 'Cash', amount: bs.assets.current['Cash'] },
            { category: 'Assets', item: 'Accounts Receivable', amount: bs.assets.current['Accounts Receivable'] },
            { category: 'Assets', item: 'Inventory', amount: bs.assets.current['Inventory'] },
            { category: 'Assets', item: 'Total Assets', amount: bs.assets.totalAssets },
            { category: 'Liabilities', item: 'Accounts Payable', amount: bs.liabilities.current['Accounts Payable'] },
            { category: 'Liabilities', item: 'Total Liabilities', amount: bs.liabilities.totalLiabilities },
            { category: 'Equity', item: 'Common Stock', amount: bs.equity['Common Stock'] },
            { category: 'Equity', item: 'Retained Earnings', amount: bs.equity['Retained Earnings'] },
            { category: 'Equity', item: 'Total Equity', amount: bs.equity.total }
        ];
        filename = 'balance_sheet.csv';
    } else if (reportType === 'cashflow') {
        const cf = generateCashFlowStatement();
        data = [
            { category: 'Operating', item: 'Net Income', amount: cf.operating['Net Income'] },
            { category: 'Operating', item: 'Total', amount: cf.operating.total },
            { category: 'Investing', item: 'Equipment Purchase', amount: cf.investing['Equipment Purchase'] },
            { category: 'Investing', item: 'Total', amount: cf.investing.total },
            { category: 'Financing', item: 'Debt Repayment', amount: cf.financing['Debt Repayment'] },
            { category: 'Financing', item: 'Total', amount: cf.financing.total },
            { category: '', item: 'Net Change in Cash', amount: cf.netChange },
            { category: '', item: 'Ending Cash', amount: cf.endingCash }
        ];
        filename = 'cash_flow_statement.csv';
    }
    
    exportToCSV(data, filename);
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
}
