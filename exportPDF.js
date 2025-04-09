// exportPDF.js - Funzionalità per l'esportazione di report in formato PDF

// Funzione principale per l'esportazione del report in PDF
window.exportReportToPDF = function() {
    console.log('Avvio esportazione PDF');
    
    try {
        // Verifica la disponibilità di jspdf
        if (typeof jspdf === 'undefined') {
            alert('Errore: La libreria jsPDF non è caricata correttamente');
            return;
        }
        
        // Usa jsPDF dalla variabile globale
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        // Recupera i dati dal localStorage
        const movements = JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]');
        
        // Titolo del documento
        doc.setFontSize(22);
        doc.text('Report Finanziario', 105, 20, { align: 'center' });
        
        // Data di generazione
        const oggi = new Date();
        doc.setFontSize(12);
        doc.text(`Generato il ${oggi.toLocaleDateString('it-IT')}`, 105, 30, { align: 'center' });
        
        // Calcola totali
        const entrate = movements
            .filter(m => m.type === 'ingresso')
            .reduce((sum, m) => sum + m.amount, 0);
            
        const uscite = movements
            .filter(m => m.type === 'uscita')
            .reduce((sum, m) => sum + m.amount, 0);
            
        const saldo = entrate - uscite;
        
        // Formatta i valori monetari
        function formatValuta(valore) {
            return '€ ' + valore.toFixed(2);
        }
        
        // Aggiungi il riepilogo
        doc.setFontSize(16);
        doc.text('Riepilogo Finanziario', 20, 45);
        
        doc.setFontSize(12);
        doc.text(`Entrate totali: ${formatValuta(entrate)}`, 20, 55);
        doc.text(`Uscite totali: ${formatValuta(uscite)}`, 20, 65);
        doc.text(`Saldo: ${formatValuta(saldo)}`, 20, 75);
        
        // Intestazione tabella movimenti
        doc.setFontSize(16);
        doc.text('Elenco Movimenti', 20, 90);
        
        // Intestazioni tabella
        doc.setFontSize(10);
        doc.text('Data', 20, 100);
        doc.text('Tipo', 45, 100);
        doc.text('Categoria', 70, 100);
        doc.text('Descrizione', 110, 100);
        doc.text('Importo', 175, 100);
        
        // Linea separatrice
        doc.line(20, 103, 190, 103);
        
        // Movimenti (massimo 20)
        const movimentiRecenti = [...movements]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20);
        
        let y = 110;
        
        movimentiRecenti.forEach(movimento => {
            // Formatta i dati
            const data = new Date(movimento.date).toLocaleDateString('it-IT');
            const tipo = movimento.type === 'ingresso' ? 'Entrata' : 'Uscita';
            
            // Tronca la descrizione se troppo lunga
            let descrizione = movimento.description;
            if (descrizione.length > 25) {
                descrizione = descrizione.substring(0, 22) + '...';
            }
            
            // Formatta l'importo in base al tipo
            const importo = movimento.type === 'ingresso' 
                ? formatValuta(movimento.amount) 
                : '-' + formatValuta(movimento.amount);
            
            // Aggiungi riga alla tabella
            doc.text(data, 20, y);
            doc.text(tipo, 45, y);
            doc.text(movimento.category, 70, y);
            doc.text(descrizione, 110, y);
            doc.text(importo, 175, y, { align: 'right' });
            
            y += 8;
            
            // Nuova pagina se necessario
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        });
        
        // Salva il PDF
        doc.save('report-finanziario.pdf');
        
        // Notifica di successo
        alert('Report PDF generato con successo!');
    }
    catch (errore) {
        console.error('Errore durante la generazione del PDF:', errore);
        alert('Errore durante la generazione del PDF: ' + errore.message);
    }
}; 