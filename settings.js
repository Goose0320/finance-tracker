// settings.js - Gestione delle impostazioni dell'applicazione

// Inizializzazione del modulo impostazioni
document.addEventListener('DOMContentLoaded', function() {
    // Elementi UI
    const syncStatusEl = document.getElementById('sync-status');
    const syncNowBtn = document.getElementById('sync-now-btn');
    const exportAllDataBtn = document.getElementById('export-all-data-btn');
    const importDataBtn = document.getElementById('import-data-btn');
    const importDataFile = document.getElementById('import-data-file');
    const clearDataBtn = document.getElementById('clear-data-btn');

    // Stato iniziale - Sincronizzazione sempre attiva
    let settings = {
        syncEnabled: true,
        lastSync: null
    };

    // Carica le impostazioni salvate
    loadSettings();

    // Inizializza gli event listener
    initEventListeners();

    /**
     * Carica le impostazioni dal localStorage
     */
    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem('financeTrackerSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // Forza syncEnabled a true indipendentemente dal valore salvato
                parsedSettings.syncEnabled = true;
                settings = parsedSettings;
                updateUIFromSettings();
            }
        } catch (error) {
            console.error('Errore nel caricamento delle impostazioni:', error);
            window.showNotification('Errore nel caricamento delle impostazioni', 'error');
        }
    }

    /**
     * Salva le impostazioni nel localStorage
     */
    function saveSettings() {
        try {
            // Forza sempre la sincronizzazione prima di salvare
            settings.syncEnabled = true;
            localStorage.setItem('financeTrackerSettings', JSON.stringify(settings));
            window.showNotification('Impostazioni salvate con successo', 'success');
        } catch (error) {
            console.error('Errore nel salvataggio delle impostazioni:', error);
            window.showNotification('Errore nel salvataggio delle impostazioni', 'error');
        }
    }

    /**
     * Aggiorna l'interfaccia in base alle impostazioni
     */
    function updateUIFromSettings() {
        // Rimuove il toggle della sincronizzazione dall'UI se presente
        const syncToggle = document.getElementById('sync-toggle');
        if (syncToggle) {
            syncToggle.checked = true;
            syncToggle.disabled = true; // Disabilita il toggle per impedirne la modifica
        }

        // Aggiorna lo stato di sincronizzazione
        updateSyncStatus();
    }

    /**
     * Aggiorna lo stato di sincronizzazione
     */
    function updateSyncStatus() {
        if (syncStatusEl) {
            const lastSyncText = settings.lastSync 
                ? `Ultima sincronizzazione: ${formatDate(new Date(settings.lastSync))}` 
                : 'Mai sincronizzato';
            syncStatusEl.textContent = lastSyncText;
            syncNowBtn.disabled = false;
        }
    }

    /**
     * Inizializza tutti gli event listener
     */
    function initEventListeners() {
        // Rimuoviamo il listener per il toggle di sincronizzazione perché non è più necessario

        // Pulsante sincronizza ora
        if (syncNowBtn) {
            syncNowBtn.addEventListener('click', function() {
                syncData();
            });
        }

        // Esporta tutti i dati
        if (exportAllDataBtn) {
            exportAllDataBtn.addEventListener('click', function() {
                exportAllData();
            });
        }

        // Importa dati
        if (importDataBtn && importDataFile) {
            importDataBtn.addEventListener('click', function() {
                importDataFile.click();
            });

            importDataFile.addEventListener('change', function() {
                importData(this.files[0]);
            });
        }

        // Cancella tutti i dati
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', function() {
                if (confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione è irreversibile.')) {
                    clearAllData();
                }
            });
        }
    }

    /**
     * Sincronizza i dati con il server
     * @param {boolean} silent - Se true, non mostra notifiche
     * @returns {Promise} - Promise della sincronizzazione
     */
    function syncData(silent = false) {
        return new Promise((resolve, reject) => {
            if (!silent) {
                window.showNotification('Sincronizzazione in corso...', 'info');
            }
            
            // Verifica che il client Supabase sia inizializzato
            if (!window.supabase || !window.userId) {
                const error = new Error('Connessione al database non disponibile');
                console.error(error);
                if (!silent) {
                    window.showNotification('Errore: Connessione al database non disponibile', 'error');
                }
                reject(error);
                return;
            }
            
            // Ottieni i dati locali
            const localMovements = JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]');
            const now = new Date();
            
            // Prima ottieni i dati dal server
            window.supabase
                .from('users')
                .select('*')
                .eq('user_id', window.userId)
                .single()
                .then(({ data, error }) => {
                    if (error && error.code !== 'PGRST116') { // PGRST116 = record not found
                        throw error;
                    }
                    
                    // Dati dal server se esistono
                    let serverMovements = [];
                    if (data && data.movements) {
                        serverMovements = data.movements;
                    }
                    
                    // Fusione dei movimenti
                    const mergedMovements = mergeMovements(localMovements, serverMovements);
                    
                    // Salva i movimenti combinati in locale
                    localStorage.setItem('financeTrackerMovements', JSON.stringify(mergedMovements));
                    
                    // Aggiorna l'interfaccia
                    if (typeof window.updateMovementsList === 'function') {
                        window.updateMovementsList();
                    }
                    
                    // Salva sul server
                    return window.supabase
                        .from('users')
                        .upsert({
                            user_id: window.userId,
                            movements: mergedMovements,
                            lastSynced: now.toISOString(),
                            device: navigator.userAgent,
                            timestamp: now.toISOString()
                        }, { 
                            onConflict: 'user_id'
                        });
                })
                .then(({ error }) => {
                    if (error) throw error;
                    
                    // Aggiorna timestamp dell'ultima sincronizzazione
                    settings.lastSync = Date.now();
                    saveSettings();
                    updateSyncStatus();
                    
                    if (!silent) {
                        window.showNotification('Sincronizzazione completata con successo!', 'success');
                    }
                    console.log("Sincronizzazione completata con successo");
                    resolve();
                })
                .catch((error) => {
                    console.error("Errore durante la sincronizzazione:", error);
                    if (!silent) {
                        window.showNotification('Errore durante la sincronizzazione: ' + error.message, 'error');
                    }
                    reject(error);
                });
        });
    }
    
    /**
     * Combina i movimenti locali e quelli dal server
     * @param {Array} localMovements - Movimenti locali
     * @param {Array} serverMovements - Movimenti dal server
     * @returns {Array} - Movimenti combinati
     */
    function mergeMovements(localMovements, serverMovements) {
        // Se uno dei due array è vuoto, ritorna l'altro
        if (!localMovements.length) return [...serverMovements];
        if (!serverMovements.length) return [...localMovements];
        
        // Crea un oggetto Map per trovare facilmente i movimenti per ID
        const movementsMap = new Map();
        
        // Aggiungi prima i movimenti dal server
        serverMovements.forEach(movement => {
            if (movement.id) {
                movementsMap.set(movement.id, movement);
            }
        });
        
        // Sostituisci o aggiungi i movimenti locali
        localMovements.forEach(movement => {
            // Genera un ID se non esiste
            if (!movement.id) {
                movement.id = generateId();
            }
            
            const existingMovement = movementsMap.get(movement.id);
            
            // Se esiste già, mantieni la versione più recente
            if (existingMovement) {
                const existingDate = existingMovement.lastModified ? new Date(existingMovement.lastModified) : new Date(0);
                const currentDate = movement.lastModified ? new Date(movement.lastModified) : new Date(0);
                
                if (currentDate >= existingDate) {
                    movementsMap.set(movement.id, movement);
                }
            } else {
                // Se non esiste, aggiungilo
                movementsMap.set(movement.id, movement);
            }
        });
        
        // Converti nuovamente in array e ordina per data
        return Array.from(movementsMap.values())
            .sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA; // Ordine decrescente
            });
    }
    
    /**
     * Genera un ID univoco
     * @returns {string} - ID generato
     */
    function generateId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return timestamp + randomStr;
    }

    // Esponi le funzioni globalmente
    window.syncData = syncData;
    window.mergeMovements = mergeMovements;
    
    /**
     * Carica i dati dal server
     * @param {boolean} silent - Se true, non mostra notifiche
     * @returns {Promise} - Promise del caricamento
     */
    window.loadDataFromServer = function(silent = false) {
        // Semplicemente chiama syncData che ora gestisce già il merge bidirezionale
        return syncData(silent);
    };

    /**
     * Esporta tutti i dati dell'applicazione
     */
    function exportAllData() {
        try {
            // Raccogli tutti i dati dell'applicazione
            const data = {
                movements: JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]'),
                settings: settings,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            // Crea un blob per il download
            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            
            // Crea un link per il download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Nome file con data corrente
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            link.download = `finance_tracker_backup_${dateStr}.json`;
            
            // Simula il click sul link per scaricare
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.showNotification('Dati esportati con successo', 'success');
        } catch (error) {
            console.error('Errore nell\'esportazione dei dati:', error);
            window.showNotification('Errore nell\'esportazione dei dati', 'error');
        }
    }

    /**
     * Importa i dati da un file JSON
     * @param {File} file - File JSON da importare
     */
    function importData(file) {
        if (!file) return;
        
        // Verifica che il file sia JSON
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            window.showNotification('Formato file non valido. Seleziona un file JSON.', 'error');
            return;
        }
        
        // Leggi il file
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validazione base dei dati
                if (!data.movements || !Array.isArray(data.movements)) {
                    throw new Error('Formato dati non valido');
                }
                
                // Conferma dall'utente
                if (confirm(`Importare ${data.movements.length} movimenti? I dati esistenti verranno sovrascritti.`)) {
                    // Salva i movimenti
                    localStorage.setItem('financeTrackerMovements', JSON.stringify(data.movements));
                    
                    // Salva le impostazioni se presenti
                    if (data.settings) {
                        settings = { ...settings, ...data.settings };
                        saveSettings();
                        updateUIFromSettings();
                    }
                    
                    window.showNotification('Dati importati con successo', 'success');
                    
                    // Ricarica la pagina per aggiornare tutti i dati
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } catch (error) {
                console.error('Errore nell\'importazione dei dati:', error);
                window.showNotification('Errore nell\'importazione dei dati: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * Cancella tutti i dati dell'applicazione
     */
    function clearAllData() {
        try {
            // Rimuovi i movimenti
            localStorage.removeItem('financeTrackerMovements');
            
            // Resetta le impostazioni
            settings = {
                syncEnabled: true,
                lastSync: null
            };
            saveSettings();
            
            window.showNotification('Tutti i dati sono stati cancellati', 'success');
            
            // Ricarica la pagina
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Errore nella cancellazione dei dati:', error);
            window.showNotification('Errore nella cancellazione dei dati', 'error');
        }
    }

    /**
     * Formatta una data
     * @param {Date} date - Data da formattare
     * @returns {string} - Data formattata
     */
    function formatDate(date) {
        if (!date) return '';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }
}); 