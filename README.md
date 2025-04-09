# FinanceTracker - Monitoraggio Finanziario Personale

FinanceTracker è un'applicazione web per il monitoraggio dei movimenti finanziari personali, con funzionalità avanzate di reportistica, categorizzazione e analisi dei dati.

## Funzionalità Implementate

### Gestione Movimenti ✅
- ✅ Registrazione di ingressi e uscite di denaro
- ✅ Categorizzazione dei movimenti (alimentari, bollette, trasporti, ecc.)
- ✅ Aggiunta di tag personalizzati
- ✅ Modifica e cancellazione dei movimenti
- ✅ Filtri per categoria, tipo, data
- ✅ Ricerca testuale nei movimenti
- ✅ Paginazione dei risultati

### Reportistica Avanzata ✅
- ✅ Report giornaliero, settimanale, mensile e annuale
- ✅ Periodo personalizzato con selezione date
- ✅ Riepilogo con entrate, uscite, saldo e media giornaliera
- ✅ Grafici interattivi:
  - ✅ Entrate vs Uscite
  - ✅ Distribuzione per categoria
  - ✅ Andamento nel tempo
  - ✅ Top 5 spese
  - ✅ Comparazione con periodo precedente
- ✅ Filtri per categoria, tag e tipo di movimento

### Esportazione Dati ✅
- ✅ Esportazione in formato CSV
- ✅ Stampa dei report
- ⏳ Generazione di report in PDF (implementazione parziale)

### Accessibilità e Sicurezza (Da implementare)
- Autenticazione con Google
- Sincronizzazione dei dati su cloud

## Tecnologie Utilizzate

- **Frontend**: HTML5, CSS3, JavaScript
- **Grafici**: Chart.js
- **Persistenza dati**: LocalStorage (attualmente), API REST (futura implementazione)
- **Autenticazione**: Google OAuth2 (da implementare)

## Come utilizzare l'applicazione

### Inserimento di un nuovo movimento
1. Compila il form "Nuovo Movimento" con le informazioni richieste:
   - Tipo (ingresso o uscita)
   - Categoria
   - Importo
   - Data
   - Descrizione
   - Tag (opzionali, separati da virgola)
2. Clicca su "Salva" per registrare il movimento

### Visualizzazione e filtro dei movimenti
1. I movimenti sono elencati nella tabella sotto il form
2. Utilizza i filtri disponibili per cercare movimenti specifici:
   - Ricerca testuale
   - Filtro per categoria
   - Filtro per tipo (ingresso/uscita)
   - Intervallo di date

### Modifica e cancellazione
1. Per ogni movimento nella lista sono disponibili i pulsanti "Modifica" e "Elimina"
2. Cliccando su "Modifica", il form viene compilato con i dati del movimento selezionato
3. Cliccando su "Elimina", viene richiesta conferma prima di procedere alla cancellazione

### Visualizzazione dei report
1. Naviga alla scheda "Report"
2. Seleziona il periodo desiderato (giornaliero, settimanale, mensile, annuale o personalizzato)
3. Utilizza i filtri per raffinare i dati visualizzati
4. Esplora i diversi grafici per analizzare le tue finanze
5. Esporta i dati in formato CSV o stampa il report

## Installazione

1. Clona il repository:
```
git clone https://github.com/username/finance-tracker.git
```

2. Apri il file `index.html` in un browser moderno.

## Architettura del Sistema

L'applicazione è strutturata in modo modulare:

- `index.html`: Struttura principale dell'applicazione
- `styles.css`: Foglio di stile
- `app.js`: Logica dell'applicazione e gestione dell'interfaccia utente
- `api.js`: Modulo per la gestione delle chiamate API (attualmente mock)
- `report.js`: Gestione dei report e dei grafici

### Struttura Dati

I movimenti sono memorizzati con la seguente struttura:

```javascript
{
    id: Number,
    type: String, // 'ingresso' o 'uscita'
    category: String,
    amount: Number,
    date: String, // formato YYYY-MM-DD
    description: String,
    tags: Array<String>,
    createdAt: String, // timestamp ISO
    updatedAt: String // timestamp ISO (opzionale)
}
```

## Prossimi Sviluppi

- Implementazione completa dell'esportazione PDF
- Aggiunta di grafici più dettagliati e analisi avanzate
- Implementazione backend con Node.js/Express
- Database PostgreSQL/MongoDB
- Autenticazione completa con Google
- App mobile (PWA)

## Licenza

MIT

---

Sviluppato come parte del progetto di gestione finanziaria personale. 