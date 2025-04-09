// csv.js - Funzionalità di esportazione dati in formato CSV

/**
 * Funzione principale per esportare i movimenti in formato CSV
 * @param {Array} movements - Array di movimenti da esportare
 * @param {Object} options - Opzioni di esportazione
 */
function exportMovementsToCSV(movements = null, options = {}) {
    try {
        // Mostra notifica di esportazione in corso
        showNotification('Esportazione CSV in corso...', 'info');
        
        // Se i movimenti non sono forniti, recuperali dal localStorage
        if (!movements) {
            movements = JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]');
        }
        
        // Filtri opzionali
        if (options.dateFrom && options.dateTo) {
            const fromDate = new Date(options.dateFrom);
            const toDate = new Date(options.dateTo);
            toDate.setHours(23, 59, 59, 999); // Fine della giornata
            
            movements = movements.filter(m => {
                const date = new Date(m.date);
                return date >= fromDate && date <= toDate;
            });
        }
        
        if (options.category) {
            movements = movements.filter(m => m.category === options.category);
        }
        
        if (options.type) {
            movements = movements.filter(m => m.type === options.type);
        }
        
        if (options.tag) {
            movements = movements.filter(m => 
                m.tags && m.tags.some(tag => 
                    tag.toLowerCase().includes(options.tag.toLowerCase())
                )
            );
        }
        
        // Nessun movimento trovato
        if (movements.length === 0) {
            showNotification('Nessun movimento da esportare.', 'warning');
            return;
        }
        
        // Definizione delle intestazioni del CSV
        const headers = [
            'ID', 
            'Tipo', 
            'Categoria', 
            'Importo', 
            'Data', 
            'Descrizione', 
            'Tags', 
            'Data creazione'
        ];
        
        // Creazione delle righe del CSV
        let csvContent = headers.join(',') + '\n';
        
        movements.forEach(movement => {
            // Formatta i valori per evitare problemi con le virgole
            const row = [
                formatCSVField(movement.id),
                formatCSVField(formatType(movement.type)),
                formatCSVField(formatCategory(movement.category)),
                formatCSVField(movement.amount),
                formatCSVField(formatDate(movement.date)),
                formatCSVField(movement.description || ''),
                formatCSVField(movement.tags ? movement.tags.join(';') : ''),
                formatCSVField(formatDate(movement.createdAt))
            ];
            
            csvContent += row.join(',') + '\n';
        });
        
        // Crea un Blob con il contenuto CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Genera un nome file basato sulla data corrente
        const date = new Date();
        const fileName = `movimenti_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.csv`;
        
        // Crea un link per scaricare il file
        if (window.navigator.msSaveOrOpenBlob) {
            // Per Internet Explorer
            window.navigator.msSaveBlob(blob, fileName);
        } else {
            // Per altri browser
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // Mostra notifica di successo
        showNotification('Esportazione CSV completata!', 'success');
    } catch (error) {
        console.error('Errore durante l\'esportazione CSV:', error);
        showNotification('Errore durante l\'esportazione CSV: ' + error.message, 'error');
    }
}

/**
 * Esporta i movimenti filtrati dal report in formato CSV
 */
function exportReportToCSV() {
    // Ottiene i movimenti filtrati dal modulo report
    const reportMovements = window.reportState?.filteredData;
    
    if (!reportMovements || reportMovements.length === 0) {
        showNotification('Nessun dato disponibile per l\'esportazione.', 'warning');
        return;
    }
    
    // Esporta i movimenti filtrati
    exportMovementsToCSV(reportMovements);
}

/**
 * Formatta un campo per l'inclusione nel CSV (gestisce virgole e virgolette)
 * @param {*} value - Valore da formattare
 * @returns {string} Valore formattato
 */
function formatCSVField(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    const stringValue = String(value);
    
    // Se contiene virgole, virgolette o nuove linee, racchiudi tra virgolette
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        // Raddoppia eventuali virgolette presenti
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
}

/**
 * Formatta la categoria per la visualizzazione
 * @param {string} category - Categoria da formattare
 * @returns {string} Categoria formattata
 */
function formatCategory(category) {
    const categoryMap = {
        'stipendio': 'Stipendio',
        'bonus': 'Bonus',
        'investimenti': 'Investimenti',
        'vendite': 'Vendite',
        'regali': 'Regali ricevuti',
        'altro_entrate': 'Altre entrate',
        'cibo': 'Cibo e spesa',
        'trasporti': 'Trasporti',
        'casa': 'Casa e utenze',
        'divertimento': 'Divertimento',
        'salute': 'Salute',
        'abbigliamento': 'Abbigliamento',
        'viaggi': 'Viaggi',
        'istruzione': 'Istruzione',
        'altro_uscite': 'Altre uscite'
    };
    
    return categoryMap[category] || category;
}

/**
 * Formatta il tipo di movimento
 * @param {string} type - Tipo di movimento
 * @returns {string} Tipo formattato
 */
function formatType(type) {
    return type === 'ingresso' ? 'Entrata' : 'Uscita';
}

/**
 * Formatta la data in formato italiano (GG/MM/AAAA)
 * @param {string} dateString - Data in formato ISO
 * @returns {string} Data formattata
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

/**
 * Mostra una notifica a schermo
 * @param {string} message - Messaggio da mostrare
 * @param {string} type - Tipo di notifica: success, error, info, warning
 */
function showNotification(message, type = 'info') {
    // Verifica se esiste già una funzione per le notifiche
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Fallback: mostra un alert
        alert(message);
    }
} 