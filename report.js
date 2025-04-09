// report.js - Gestione della reportistica e dei grafici

// Assicura che jsPDF sia disponibile globalmente
if (typeof window.jspdf !== 'undefined') {
    window.jsPDF = window.jspdf.jsPDF;
    console.log('jsPDF inizializzato correttamente');
} else {
    console.error('Errore: jspdf non è disponibile');
}

// Funzione di notifica (disponibile globalmente)
window.showNotification = function(message, type = 'info') {
    console.log('Notifica:', message, type);  // Debug
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
};

// Stato interno del modulo report (reso accessibile globalmente)
window.reportState = {
    // Periodo corrente
    period: 'day', // ['day', 'week', 'month', 'year', 'custom']
    customDateFrom: null,
    customDateTo: null,
    
    // Filtri
    filters: {
        category: '',
        tag: '',
        type: ''
    },
    
    // Dati filtrati per i report
    filteredData: [],
    
    // Grafici
    charts: {
        incomeExpense: null,
        category: null,
        trend: null,
        topExpenses: null,
        comparison: null
    }
};

// Inizializzazione del modulo report
document.addEventListener('DOMContentLoaded', function() {
    // Verifica che Chart.js sia caricato
    if (typeof Chart === 'undefined') {
        console.error('Chart.js non è caricato. I grafici non funzioneranno correttamente.');
        return;
    }

    // Verifica che jsPDF sia caricato
    if (typeof window.jsPDF === 'undefined') {
        console.error('jsPDF non è caricato correttamente. L\'esportazione PDF non funzionerà.');
        return;
    }

    // Colori per i grafici
    const chartColors = {
        income: 'rgba(46, 204, 113, 0.7)',       // Verde
        expense: 'rgba(231, 76, 60, 0.7)',       // Rosso
        balance: 'rgba(52, 152, 219, 0.7)',      // Blu
        border: {
            income: 'rgb(39, 174, 96)',
            expense: 'rgb(192, 57, 43)',
            balance: 'rgb(41, 128, 185)'
        },
        categories: [
            'rgba(52, 152, 219, 0.7)',  // Blu
            'rgba(155, 89, 182, 0.7)',  // Viola
            'rgba(52, 73, 94, 0.7)',    // Blu scuro
            'rgba(241, 196, 15, 0.7)',  // Giallo
            'rgba(230, 126, 34, 0.7)',  // Arancione
            'rgba(231, 76, 60, 0.7)',   // Rosso
            'rgba(46, 204, 113, 0.7)',  // Verde
            'rgba(26, 188, 156, 0.7)'   // Turchese
        ]
    };

    // Inizializza i componenti
    initReportComponents();
    
    // Carica i dati iniziali
    loadReportData();

    // Funzione per inizializzare i componenti del report
    function initReportComponents() {
        // Inizializza selettori di periodo
        initPeriodSelectors();
        
        // Inizializza filtri report
        initReportFilters();
        
        // Inizializza pulsanti di esportazione
        initExportButtons();
        
        // Inizializza l'evento di cambio tab per aggiornare i report quando si entra nella tab
        initTabChangeEvent();
    }
    
    // Inizializza i selettori di periodo
    function initPeriodSelectors() {
        // Selettori di periodo
        const periodButtons = document.querySelectorAll('.period-btn');
        
        // Custom period elements
        const customPeriodSelector = document.getElementById('custom-period-selector');
        const reportDateFrom = document.getElementById('report-date-from');
        const reportDateTo = document.getElementById('report-date-to');
        const applyCustomPeriodBtn = document.getElementById('apply-custom-period');
        
        // Imposta la data odierna come default per il periodo personalizzato
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (reportDateTo) {
            reportDateTo.value = todayStr;
        }
        
        // Imposta la data di 30 giorni fa come default per "Da"
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
        
        if (reportDateFrom) {
            reportDateFrom.value = thirtyDaysAgoStr;
        }
        
        // Event listener per i pulsanti di periodo
        periodButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Rimuovi la classe active da tutti i pulsanti
                periodButtons.forEach(btn => btn.classList.remove('active'));
                
                // Aggiungi la classe active a questo pulsante
                this.classList.add('active');
                
                // Ottieni il periodo dal pulsante
                const periodType = this.id.split('-')[1]; // period-day -> day
                window.reportState.period = periodType;
                
                // Mostra/nascondi il selettore di periodo personalizzato
                if (periodType === 'custom' && customPeriodSelector) {
                    customPeriodSelector.style.display = 'block';
                } else if (customPeriodSelector) {
                    customPeriodSelector.style.display = 'none';
                    
                    // Se non è custom, carica i dati immediatamente
                    loadReportData();
                }
            });
        });
        
        // Event listener per il pulsante Applica periodo personalizzato
        if (applyCustomPeriodBtn) {
            applyCustomPeriodBtn.addEventListener('click', function() {
                if (reportDateFrom && reportDateTo) {
                    window.reportState.customDateFrom = reportDateFrom.value;
                    window.reportState.customDateTo = reportDateTo.value;
                    
                    // Carica i dati con il periodo personalizzato
                    loadReportData();
                }
            });
        }
    }
    
    // Inizializza i filtri dei report
    function initReportFilters() {
        const categoryFilter = document.getElementById('report-category-filter');
        const tagFilter = document.getElementById('report-tag-filter');
        const typeFilter = document.getElementById('report-type-filter');
        const applyFiltersBtn = document.getElementById('apply-report-filters');
        const resetFiltersBtn = document.getElementById('reset-report-filters');
        
        // Event listener per il pulsante Applica filtri
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                // Aggiorna lo stato dei filtri
                if (categoryFilter) window.reportState.filters.category = categoryFilter.value;
                if (tagFilter) window.reportState.filters.tag = tagFilter.value.toLowerCase();
                if (typeFilter) window.reportState.filters.type = typeFilter.value;
                
                // Ricarica i dati con i nuovi filtri
                loadReportData();
            });
        }
        
        // Event listener per il pulsante Reset filtri
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                // Resetta i filtri nell'UI
                if (categoryFilter) categoryFilter.value = '';
                if (tagFilter) tagFilter.value = '';
                if (typeFilter) typeFilter.value = '';
                
                // Resetta i filtri nello stato
                window.reportState.filters.category = '';
                window.reportState.filters.tag = '';
                window.reportState.filters.type = '';
                
                // Ricarica i dati con i filtri resettati
                loadReportData();
            });
        }
    }
    
    // Inizializza i pulsanti di esportazione
    function initExportButtons() {
        const exportCsvBtn = document.getElementById('export-csv');
        const exportPdfBtn = document.getElementById('export-pdf');
        const printReportBtn = document.getElementById('print-report');
        
        // Export CSV
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function() {
                exportReportToCSV();
            });
        }
        
        // Export PDF
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', function() {
                window.exportReportToPDF();
            });
        }
        
        // Print Report
        if (printReportBtn) {
            printReportBtn.addEventListener('click', function() {
                printReport();
            });
        }
    }
    
    // Inizializza l'evento di cambio tab
    function initTabChangeEvent() {
        // Selettore delle tab
        const reportTab = document.querySelector('nav a[href="#reports"]');
        
        if (reportTab) {
            reportTab.addEventListener('click', function() {
                // Carica i dati freschi quando si entra nella tab report
                setTimeout(() => {
                    loadReportData();
                }, 100);
            });
        }
    }
    
    // Carica i dati per i report in base al periodo e ai filtri selezionati
    function loadReportData() {
        // Recupera i movimenti dal localStorage
        const movements = JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]');
        
        // Filtra i dati in base al periodo selezionato
        let filteredByPeriod = filterMovementsByPeriod(movements, window.reportState.period);
        
        // Filtra ulteriormente in base ai filtri utente
        window.reportState.filteredData = filterMovementsByUserFilters(filteredByPeriod, window.reportState.filters);
        
        // Aggiorna il riepilogo
        updateSummary(window.reportState.filteredData);
        
        // Aggiorna tutti i grafici
        updateAllCharts(window.reportState.filteredData);
    }
    
    // Filtra i movimenti in base al periodo selezionato
    function filterMovementsByPeriod(movements, period) {
        const today = new Date();
        let startDate;
        
        switch (period) {
            case 'day':
                // Solo oggi
                startDate = new Date(today);
                startDate.setHours(0, 0, 0, 0);
                return movements.filter(m => new Date(m.date) >= startDate);
                
            case 'week':
                // Ultimi 7 giorni
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                return movements.filter(m => new Date(m.date) >= startDate);
                
            case 'month':
                // Ultimi 30 giorni
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 30);
                return movements.filter(m => new Date(m.date) >= startDate);
                
            case 'year':
                // Ultimi 365 giorni
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 1);
                return movements.filter(m => new Date(m.date) >= startDate);
                
            case 'custom':
                // Periodo personalizzato
                if (window.reportState.customDateFrom && window.reportState.customDateTo) {
                    const fromDate = new Date(window.reportState.customDateFrom);
                    const toDate = new Date(window.reportState.customDateTo);
                    toDate.setHours(23, 59, 59, 999); // Fine della giornata
                    return movements.filter(m => {
                        const date = new Date(m.date);
                        return date >= fromDate && date <= toDate;
                    });
                }
                return movements;
                
            default:
                return movements;
        }
    }
    
    // Filtra i movimenti in base ai filtri utente
    function filterMovementsByUserFilters(movements, filters) {
        return movements.filter(movement => {
            // Filtro categoria
            const matchesCategory = !filters.category || movement.category === filters.category;
            
            // Filtro tag
            const matchesTag = !filters.tag || (
                movement.tags && 
                movement.tags.some(tag => tag.toLowerCase().includes(filters.tag.toLowerCase()))
            );
            
            // Filtro tipo
            const matchesType = !filters.type || movement.type === filters.type;
            
            return matchesCategory && matchesTag && matchesType;
        });
    }
    
    // Aggiorna il riepilogo con i dati filtrati
    function updateSummary(filteredData) {
        // Calcola i totali
        const totalIncome = filteredData
            .filter(m => m.type === 'ingresso')
            .reduce((sum, m) => sum + m.amount, 0);
            
        const totalExpenses = filteredData
            .filter(m => m.type === 'uscita')
            .reduce((sum, m) => sum + m.amount, 0);
            
        const balance = totalIncome - totalExpenses;
        
        // Calcola la media giornaliera
        let dailyAverage = 0;
        
        // Determina il numero di giorni nel periodo
        let days = 1; // Default a 1 per evitare divisione per zero
        
        if (window.reportState.period === 'custom' && window.reportState.customDateFrom && window.reportState.customDateTo) {
            const fromDate = new Date(window.reportState.customDateFrom);
            const toDate = new Date(window.reportState.customDateTo);
            days = Math.max(1, Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1);
        } else if (window.reportState.period === 'day') {
            days = 1;
        } else if (window.reportState.period === 'week') {
            days = 7;
        } else if (window.reportState.period === 'month') {
            days = 30;
        } else if (window.reportState.period === 'year') {
            days = 365;
        }
        
        // Calcola la media giornaliera delle spese
        dailyAverage = totalExpenses / days;
        
        // Aggiorna l'interfaccia utente
        document.getElementById('total-income').textContent = formatCurrency(totalIncome);
        document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
        document.getElementById('total-balance').textContent = formatCurrency(balance);
        document.getElementById('daily-average').textContent = formatCurrency(dailyAverage);
    }
    
    // Aggiorna tutti i grafici
    function updateAllCharts(data) {
        createIncomeExpenseChart(data);
        createCategoryChart(data);
        createTrendChart(data);
        createTopExpensesChart(data);
        createComparisonChart(data);
    }
    
    // Crea il grafico di confronto tra entrate e uscite
    function createIncomeExpenseChart(data) {
        const ctx = document.getElementById('income-expense-chart');
        if (!ctx) return;
        
        // Se il grafico esiste già, distruggilo
        if (window.reportState.charts.incomeExpense) {
            window.reportState.charts.incomeExpense.destroy();
        }
        
        // Calcola i totali
        const totalIncome = data
            .filter(m => m.type === 'ingresso')
            .reduce((sum, m) => sum + m.amount, 0);
            
        const totalExpenses = data
            .filter(m => m.type === 'uscita')
            .reduce((sum, m) => sum + m.amount, 0);
        
        // Configura il grafico
        window.reportState.charts.incomeExpense = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Entrate vs Uscite'],
                datasets: [
                    {
                        label: 'Entrate',
                        data: [totalIncome],
                        backgroundColor: chartColors.income,
                        borderColor: chartColors.border.income,
                        borderWidth: 1
                    },
                    {
                        label: 'Uscite',
                        data: [totalExpenses],
                        backgroundColor: chartColors.expense,
                        borderColor: chartColors.border.expense,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Crea il grafico di distribuzione per categoria
    function createCategoryChart(data) {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;
        
        // Se il grafico esiste già, distruggilo
        if (window.reportState.charts.category) {
            window.reportState.charts.category.destroy();
        }
        
        // Filtra solo le uscite
        const expenses = data.filter(m => m.type === 'uscita');
        
        // Raggruppa per categoria
        const categoriesMap = {};
        expenses.forEach(expense => {
            if (!categoriesMap[expense.category]) {
                categoriesMap[expense.category] = 0;
            }
            categoriesMap[expense.category] += expense.amount;
        });
        
        // Converti in array per il grafico
        const categories = Object.keys(categoriesMap);
        const amounts = Object.values(categoriesMap);
        
        // Configura il grafico
        window.reportState.charts.category = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories.map(cat => capitalizeFirstLetter(cat)),
                datasets: [{
                    data: amounts,
                    backgroundColor: chartColors.categories.slice(0, categories.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = Math.round((value / total) * 100);
                                return label + ': ' + formatCurrency(value) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Crea il grafico di andamento nel tempo
    function createTrendChart(data) {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;
        
        // Se il grafico esiste già, distruggilo
        if (window.reportState.charts.trend) {
            window.reportState.charts.trend.destroy();
        }
        
        // Ordina i dati per data
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Raggruppa i dati per data
        const dateMap = {};
        sortedData.forEach(movement => {
            if (!dateMap[movement.date]) {
                dateMap[movement.date] = {
                    income: 0,
                    expense: 0
                };
            }
            
            if (movement.type === 'ingresso') {
                dateMap[movement.date].income += movement.amount;
            } else {
                dateMap[movement.date].expense += movement.amount;
            }
        });
        
        // Converti in array per il grafico
        const dates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));
        const incomes = dates.map(date => dateMap[date].income);
        const expenses = dates.map(date => dateMap[date].expense);
        
        // Calcola il saldo cumulativo
        let cumulativeBalance = 0;
        const balances = dates.map((date, index) => {
            cumulativeBalance += (incomes[index] - expenses[index]);
            return cumulativeBalance;
        });
        
        // Formatta le date per la visualizzazione
        const formattedDates = dates.map(date => formatDate(date));
        
        // Configura il grafico
        window.reportState.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedDates,
                datasets: [
                    {
                        label: 'Entrate',
                        data: incomes,
                        backgroundColor: chartColors.income,
                        borderColor: chartColors.border.income,
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Uscite',
                        data: expenses,
                        backgroundColor: chartColors.expense,
                        borderColor: chartColors.border.expense,
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Saldo',
                        data: balances,
                        backgroundColor: chartColors.balance,
                        borderColor: chartColors.border.balance,
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Crea il grafico delle top spese
    function createTopExpensesChart(data) {
        const ctx = document.getElementById('top-expenses-chart');
        if (!ctx) return;
        
        // Se il grafico esiste già, distruggilo
        if (window.reportState.charts.topExpenses) {
            window.reportState.charts.topExpenses.destroy();
        }
        
        // Filtra solo le uscite
        const expenses = data.filter(m => m.type === 'uscita');
        
        // Ordina per importo decrescente e prendi le prime 5
        const topExpenses = [...expenses]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
        
        // Configura il grafico
        window.reportState.charts.topExpenses = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topExpenses.map(e => e.description),
                datasets: [{
                    label: 'Importo',
                    data: topExpenses.map(e => e.amount),
                    backgroundColor: chartColors.expense,
                    borderColor: chartColors.border.expense,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.raw) + ' - ' + 
                                       capitalizeFirstLetter(topExpenses[context.dataIndex].category);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Crea il grafico di comparazione con il periodo precedente
    function createComparisonChart(data) {
        const ctx = document.getElementById('comparison-chart');
        if (!ctx) return;
        
        // Se il grafico esiste già, distruggilo
        if (window.reportState.charts.comparison) {
            window.reportState.charts.comparison.destroy();
        }
        
        // Determina periodo corrente e precedente
        let currentStartDate;
        let previousStartDate;
        let previousEndDate;
        const today = new Date();
        
        switch (window.reportState.period) {
            case 'day':
                currentStartDate = new Date(today);
                currentStartDate.setHours(0, 0, 0, 0);
                
                previousStartDate = new Date(currentStartDate);
                previousStartDate.setDate(previousStartDate.getDate() - 1);
                previousEndDate = new Date(currentStartDate);
                previousEndDate.setMilliseconds(-1);
                break;
                
            case 'week':
                currentStartDate = new Date(today);
                currentStartDate.setDate(today.getDate() - 7);
                
                previousStartDate = new Date(currentStartDate);
                previousStartDate.setDate(previousStartDate.getDate() - 7);
                previousEndDate = new Date(currentStartDate);
                previousEndDate.setMilliseconds(-1);
                break;
                
            case 'month':
                currentStartDate = new Date(today);
                currentStartDate.setDate(today.getDate() - 30);
                
                previousStartDate = new Date(currentStartDate);
                previousStartDate.setDate(previousStartDate.getDate() - 30);
                previousEndDate = new Date(currentStartDate);
                previousEndDate.setMilliseconds(-1);
                break;
                
            case 'year':
                currentStartDate = new Date(today);
                currentStartDate.setFullYear(today.getFullYear() - 1);
                
                previousStartDate = new Date(currentStartDate);
                previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
                previousEndDate = new Date(currentStartDate);
                previousEndDate.setMilliseconds(-1);
                break;
                
            case 'custom':
                if (window.reportState.customDateFrom && window.reportState.customDateTo) {
                    currentStartDate = new Date(window.reportState.customDateFrom);
                    const currentEndDate = new Date(window.reportState.customDateTo);
                    const dayDiff = Math.round((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24));
                    
                    previousEndDate = new Date(currentStartDate);
                    previousEndDate.setMilliseconds(-1);
                    previousStartDate = new Date(previousEndDate);
                    previousStartDate.setDate(previousStartDate.getDate() - dayDiff);
                } else {
                    // Se non ci sono date personalizzate valide, usa il mese come default
                    currentStartDate = new Date(today);
                    currentStartDate.setDate(today.getDate() - 30);
                    
                    previousStartDate = new Date(currentStartDate);
                    previousStartDate.setDate(previousStartDate.getDate() - 30);
                    previousEndDate = new Date(currentStartDate);
                    previousEndDate.setMilliseconds(-1);
                }
                break;
                
            default:
                // Usa il mese come default
                currentStartDate = new Date(today);
                currentStartDate.setDate(today.getDate() - 30);
                
                previousStartDate = new Date(currentStartDate);
                previousStartDate.setDate(previousStartDate.getDate() - 30);
                previousEndDate = new Date(currentStartDate);
                previousEndDate.setMilliseconds(-1);
        }
        
        // Recupera tutti i movimenti
        const allMovements = JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]');
        
        // Filtra per il periodo precedente
        const previousPeriodData = allMovements.filter(m => {
            const date = new Date(m.date);
            return date >= previousStartDate && date <= previousEndDate;
        });
        
        // Calcola i totali per il periodo corrente
        const currentIncomeTotal = data
            .filter(m => m.type === 'ingresso')
            .reduce((sum, m) => sum + m.amount, 0);
            
        const currentExpenseTotal = data
            .filter(m => m.type === 'uscita')
            .reduce((sum, m) => sum + m.amount, 0);
        
        // Calcola i totali per il periodo precedente
        const previousIncomeTotal = previousPeriodData
            .filter(m => m.type === 'ingresso')
            .reduce((sum, m) => sum + m.amount, 0);
            
        const previousExpenseTotal = previousPeriodData
            .filter(m => m.type === 'uscita')
            .reduce((sum, m) => sum + m.amount, 0);
        
        // Configura il grafico
        window.reportState.charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Entrate', 'Uscite'],
                datasets: [
                    {
                        label: 'Periodo corrente',
                        data: [currentIncomeTotal, currentExpenseTotal],
                        backgroundColor: [chartColors.income, chartColors.expense],
                        borderColor: [chartColors.border.income, chartColors.border.expense],
                        borderWidth: 1
                    },
                    {
                        label: 'Periodo precedente',
                        data: [previousIncomeTotal, previousExpenseTotal],
                        backgroundColor: [
                            'rgba(46, 204, 113, 0.3)', // Verde trasparente
                            'rgba(231, 76, 60, 0.3)'   // Rosso trasparente
                        ],
                        borderColor: [chartColors.border.income, chartColors.border.expense],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Esporta il report in formato CSV
    function exportReportToCSV() {
        // Crea una stringa CSV
        let csv = 'Data,Tipo,Categoria,Descrizione,Importo,Tag\n';
        
        // Aggiungi i dati filtrati
        window.reportState.filteredData.forEach(movement => {
            const tags = movement.tags ? movement.tags.join('; ') : '';
            csv += `${movement.date},${movement.type},${movement.category},"${movement.description}",${movement.amount},"${tags}"\n`;
        });
        
        // Crea un blob per il download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Crea un link per il download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'finance-report.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Report esportato in CSV con successo!', 'success');
    }
    
    // Stampa il report
    function printReport() {
        window.print();
    }
    
    // Funzioni di utilità
    
    // Formatta la valuta
    function formatCurrency(amount) {
        return new Intl.NumberFormat('it-IT', { 
            style: 'currency', 
            currency: 'EUR' 
        }).format(amount);
    }
    
    // Formatta la data
    function formatDate(dateString) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('it-IT', options);
    }
    
    // Formatta capitalizzando la prima lettera
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}); 

// Rendi disponibile la funzione di esportazione PDF globalmente
window.exportReportToPDF = function() {
    console.log('Funzione exportReportToPDF chiamata');
    
    try {
        // Verifica che jsPDF sia disponibile nel contesto globale attraverso window.jspdf
        if (typeof window.jspdf === 'undefined') {
            alert('Errore: La libreria jsPDF non è disponibile');
            return;
        }
        
        // Inizializza jsPDF in modo sicuro
        const { jsPDF } = window.jspdf;
        
        // Crea un nuovo documento PDF
        const doc = new jsPDF();
        
        // Aggiungi titolo
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text('Report Finanziario', 105, 20, { align: 'center' });
        
        // Aggiungi data del report
        const today = new Date();
        const dateStr = today.toLocaleDateString('it-IT');
        doc.setFontSize(12);
        doc.text(`Generato il: ${dateStr}`, 105, 30, { align: 'center' });
        
        // Aggiungi riepilogo finanziario
        doc.setFontSize(16);
        doc.text('Riepilogo Finanziario', 20, 45);
        
        // Recupera i dati finanziari
        const totalIncome = window.reportState.filteredData
            .filter(m => m.type === 'ingresso')
            .reduce((sum, m) => sum + m.amount, 0);
            
        const totalExpenses = window.reportState.filteredData
            .filter(m => m.type === 'uscita')
            .reduce((sum, m) => sum + m.amount, 0);
            
        const balance = totalIncome - totalExpenses;
        
        // Formatta come valuta
        const formatCurrency = value => `€ ${value.toFixed(2)}`;
        
        // Aggiungi i dati al PDF
        doc.setFontSize(12);
        doc.text(`Entrate Totali: ${formatCurrency(totalIncome)}`, 20, 55);
        doc.text(`Uscite Totali: ${formatCurrency(totalExpenses)}`, 20, 65);
        doc.text(`Saldo: ${formatCurrency(balance)}`, 20, 75);
        
        // Aggiungi intestazione per i movimenti
        doc.setFontSize(16);
        doc.text('Movimenti Recenti', 20, 90);
        
        // Righe della tabella
        let yPos = 100;
        doc.setFontSize(10);
        
        // Intestazioni
        doc.text('Data', 20, yPos);
        doc.text('Descrizione', 45, yPos);
        doc.text('Categoria', 120, yPos);
        doc.text('Importo', 170, yPos);
        yPos += 5;
        
        // Linea separatrice
        doc.line(20, yPos, 190, yPos);
        yPos += 7;
        
        // Ordina i movimenti per data (dal più recente)
        const sortedMovements = [...window.reportState.filteredData]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 15); // Limita a 15 movimenti
        
        // Aggiungi movimenti
        sortedMovements.forEach(m => {
            const date = new Date(m.date).toLocaleDateString('it-IT');
            const amount = m.type === 'ingresso' ? 
                formatCurrency(m.amount) : 
                `- ${formatCurrency(m.amount)}`;
            
            doc.text(date, 20, yPos);
            
            // Limita la lunghezza della descrizione
            const desc = m.description.length > 30 ? 
                m.description.substring(0, 30) + '...' : 
                m.description;
            doc.text(desc, 45, yPos);
            
            doc.text(m.category, 120, yPos);
            doc.text(amount, 170, yPos);
            
            yPos += 7;
            
            // Nuova pagina se necessario
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
        });
        
        // Salva il PDF
        doc.save('Report_Finanziario.pdf');
        
        // Mostra notifica di successo
        if (typeof window.showNotification === 'function') {
            window.showNotification('Report PDF generato con successo!', 'success');
        } else {
            alert('Report PDF generato con successo!');
        }
    } catch (error) {
        console.error('Errore nella generazione del PDF:', error);
        alert('Errore nella generazione del PDF: ' + error.message);
    }
}; 

// Esponi la funzione di aggiornamento a livello globale per la sincronizzazione
window.updateReportData = function() {
    if (typeof window.reportState !== 'undefined') {
        // Ricarica i dati
        const movements = JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]');
        
        // Applica i filtri correnti
        const filteredData = filterMovementsByPeriod(movements, window.reportState.period);
        const filteredByUserData = filterMovementsByUserFilters(filteredData, window.reportState.filters);
        
        // Aggiorna i grafici e il riepilogo
        updateSummary(filteredByUserData);
        updateAllCharts(filteredByUserData);
        
        console.log("Report aggiornati con i nuovi dati sincronizzati");
    }
}; 