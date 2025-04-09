// API.js - Client API per la sincronizzazione con backend
// Simulazione di un sistema API RESTful con crittografia

// Configurazione API
const API_CONFIG = {
    API_URL: 'https://api.financetracker-demo.com/v1',
    ENCRYPTION_ENABLED: true,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // ms
    TIMEOUT: 10000 // ms
};

// Stato API
let API_STATE = {
    initialized: false,
    isOnline: true,
    retryCount: 0,
    authToken: null,
    userId: null,
    encryptionKey: null,
    pendingSync: []
};

/**
 * Inizializza l'API client
 * @param {Object} options - Opzioni di configurazione
 * @returns {Promise<boolean>} - Stato dell'inizializzazione
 */
async function initApi(options = {}) {
    // Simuliamo l'inizializzazione dell'API
    console.log('[API] Inizializzazione API client...');
    
    return new Promise((resolve) => {
        setTimeout(() => {
            API_STATE.initialized = true;
            
            // Verifica lo stato di connessione
            checkConnectivity()
                .then(isOnline => {
                    API_STATE.isOnline = isOnline;
                    console.log(`[API] Stato connessione: ${isOnline ? 'Online' : 'Offline'}`);
                    
                    // Se l'utente è autenticato, verifica credenziali
                    const authData = localStorage.getItem('authData');
                    if (authData) {
                        try {
                            const parsedData = JSON.parse(authData);
                            API_STATE.authToken = parsedData.user.token;
                            API_STATE.userId = parsedData.user.id;
                            console.log('[API] Autenticazione ripristinata per utente:', parsedData.user.email);
                        } catch (error) {
                            console.error('[API] Errore nel ripristino autenticazione:', error);
                        }
                    }
                    
                    // Genera una chiave di crittografia per questa sessione
                    if (API_CONFIG.ENCRYPTION_ENABLED) {
                        API_STATE.encryptionKey = generateEncryptionKey();
                        console.log('[API] Crittografia dati abilitata');
                    }
                    
                    resolve(true);
                });
        }, 500);
    });
}

/**
 * Verifica lo stato della connettività con il server
 * @returns {Promise<boolean>} - Stato della connessione
 */
async function checkConnectivity() {
    return new Promise((resolve) => {
        // Simula un controllo di connessione
        setTimeout(() => {
            const isOnline = navigator.onLine && Math.random() > 0.1; // 10% di possibilità di fallimento
            resolve(isOnline);
        }, 300);
    });
}

/**
 * Genera una chiave di crittografia per la cifratura dei dati
 * @returns {string} - Chiave di crittografia generata
 */
function generateEncryptionKey() {
    // In un'implementazione reale, utilizzeremmo Web Crypto API
    // Questa è solo una simulazione per scopi dimostrativi
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let key = '';
    
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return key;
}

/**
 * Simula la cifratura dei dati prima dell'invio al server
 * @param {Object} data - Dati da cifrare
 * @returns {Object} - Dati cifrati
 */
function encryptData(data) {
    if (!API_CONFIG.ENCRYPTION_ENABLED || !API_STATE.encryptionKey) {
        return { data };
    }
    
    // Simulazione di cifratura
    // In un'implementazione reale, utilizzeremmo Web Crypto API
    
    // Converti i dati in stringa JSON
    const jsonData = JSON.stringify(data);
    
    // Simuliamo dati cifrati con un prefisso
    return {
        encrypted: true,
        data: `ENC:${btoa(jsonData)}:${Date.now()}:${API_STATE.encryptionKey.substr(0, 8)}`,
        keyId: API_STATE.encryptionKey.substr(0, 8)
    };
}

/**
 * Simula la decifratura dei dati ricevuti dal server
 * @param {Object} encryptedData - Dati cifrati
 * @returns {Object} - Dati decifrati
 */
function decryptData(encryptedData) {
    if (!encryptedData.encrypted) {
        return encryptedData.data;
    }
    
    try {
        // Simulazione di decifratura
        const parts = encryptedData.data.split(':');
        if (parts[0] !== 'ENC') {
            throw new Error('Formato dati cifrati non valido');
        }
        
        const base64Data = parts[1];
        const jsonData = atob(base64Data);
        
        return JSON.parse(jsonData);
    } catch (error) {
        console.error('[API] Errore nella decifratura dei dati:', error);
        throw new Error('Impossibile decifrare i dati');
    }
}

/**
 * Effettua una richiesta HTTP al server API
 * @param {string} endpoint - Endpoint API da chiamare
 * @param {string} method - Metodo HTTP (GET, POST, PUT, DELETE)
 * @param {Object} data - Dati da inviare con la richiesta
 * @returns {Promise<Object>} - Risposta del server
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    if (!API_STATE.initialized) {
        await initApi();
    }
    
    // Verifica lo stato della connessione
    const isOnline = await checkConnectivity();
    if (!isOnline) {
        console.warn(`[API] Impossibile effettuare la richiesta ${method} a ${endpoint} - Offline`);
        
        if (method !== 'GET') {
            // Salva la richiesta per la sincronizzazione successiva
            API_STATE.pendingSync.push({ endpoint, method, data, timestamp: Date.now() });
            localStorage.setItem('pendingSyncOperations', JSON.stringify(API_STATE.pendingSync));
        }
        
        throw new Error('Sei offline. La richiesta verrà sincronizzata quando tornerai online.');
    }
    
    // Costruisci URL
    const url = `${API_CONFIG.API_URL}${endpoint}`;
    
    // Prepara le intestazioni
    const headers = {
        'Content-Type': 'application/json',
        'X-App-Version': '1.0.0'
    };
    
    // Aggiungi token di autenticazione se disponibile
    if (API_STATE.authToken) {
        headers['Authorization'] = `Bearer ${API_STATE.authToken}`;
    }
    
    // Prepara la configurazione della richiesta
    const config = {
        method,
        headers,
        mode: 'cors',
        cache: 'no-cache',
        timeout: API_CONFIG.TIMEOUT
    };
    
    // Aggiungi il corpo della richiesta per i metodi che lo supportano
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        // Cifra i dati prima dell'invio
        const encryptedData = encryptData(data);
        config.body = JSON.stringify(encryptedData);
    }
    
    // Simulazione della chiamata API
    return new Promise((resolve, reject) => {
        console.log(`[API] Richiesta ${method} a ${endpoint}`, data);
        
        setTimeout(() => {
            // Simulazione di un errore casuale (10% di possibilità)
            if (Math.random() < 0.1 && API_STATE.retryCount < API_CONFIG.RETRY_ATTEMPTS) {
                API_STATE.retryCount++;
                console.warn(`[API] Errore nella richiesta, tentativo ${API_STATE.retryCount}/${API_CONFIG.RETRY_ATTEMPTS}`);
                
                // Riprova dopo un ritardo
                setTimeout(() => {
                    apiRequest(endpoint, method, data)
                        .then(resolve)
                        .catch(reject);
                }, API_CONFIG.RETRY_DELAY);
                
                return;
            }
            
            // Reset del contatore dei tentativi
            API_STATE.retryCount = 0;
            
            // Simula una risposta dal server
            const simulatedResponse = simulateServerResponse(endpoint, method, data);
            
            if (simulatedResponse.status >= 200 && simulatedResponse.status < 300) {
                // Decodifica i dati cifrati dalla risposta
                if (simulatedResponse.data && simulatedResponse.data.encrypted) {
                    try {
                        simulatedResponse.data = decryptData(simulatedResponse.data);
                    } catch (error) {
                        reject(error);
                        return;
                    }
                }
                
                resolve(simulatedResponse);
            } else {
                reject(new Error(`Errore ${simulatedResponse.status}: ${simulatedResponse.message}`));
            }
        }, 800); // Simulazione del ritardo di rete
    });
}

/**
 * Simula una risposta dal server
 * @param {string} endpoint - Endpoint chiamato
 * @param {string} method - Metodo HTTP utilizzato
 * @param {Object} data - Dati inviati
 * @returns {Object} - Risposta simulata
 */
function simulateServerResponse(endpoint, method, data) {
    // Simuliamo diverse risposte in base all'endpoint e al metodo
    if (endpoint === '/movements' && method === 'GET') {
        return {
            status: 200,
            data: { 
                encrypted: true,
                data: `ENC:${btoa(JSON.stringify({
                    movements: JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]'),
                    timestamp: Date.now()
                }))}:${Date.now()}:${API_STATE.encryptionKey?.substr(0, 8) || 'nokey'}`
            },
            message: 'OK'
        };
    } 
    else if (endpoint === '/movements' && method === 'POST') {
        // Simula salvataggio di nuovi movimenti sul server
        return {
            status: 201,
            data: {
                success: true,
                message: 'Movimento salvato con successo',
                id: Date.now() // Genera un ID simulato
            },
            message: 'Created'
        };
    } 
    else if (endpoint.startsWith('/movements/') && method === 'DELETE') {
        // Simula eliminazione di un movimento
        return {
            status: 200,
            data: {
                success: true,
                message: 'Movimento eliminato con successo'
            },
            message: 'OK'
        };
    } 
    else if (endpoint === '/sync' && method === 'POST') {
        // Simula sincronizzazione dati
        return {
            status: 200,
            data: {
                success: true,
                synced: data?.items?.length || 0,
                timestamp: Date.now()
            },
            message: 'OK'
        };
    }
    else if (endpoint === '/user/profile' && method === 'GET') {
        // Simula il recupero del profilo utente
        return {
            status: 200,
            data: {
                encrypted: true,
                data: `ENC:${btoa(JSON.stringify({
                    id: API_STATE.userId,
                    email: 'user@example.com',
                    name: 'Utente Demo',
                    settings: {
                        currency: 'EUR',
                        dateFormat: 'DD/MM/YYYY',
                        language: 'it'
                    },
                    lastSync: Date.now() - 86400000 // 24 ore fa
                }))}:${Date.now()}:${API_STATE.encryptionKey?.substr(0, 8) || 'nokey'}`
            },
            message: 'OK'
        };
    }
    else {
        // Risposta di default per endpoint non gestiti
        return {
            status: 404,
            data: null,
            message: 'Not Found'
        };
    }
}

/**
 * Sincronizza i dati locali con il server
 * @returns {Promise<Object>} - Risultato della sincronizzazione
 */
async function syncDataWithServer() {
    if (!API_STATE.initialized) {
        await initApi();
    }
    
    if (!API_STATE.authToken) {
        throw new Error('Utente non autenticato. Effettua l\'accesso per sincronizzare i dati.');
    }
    
    // Recupera i dati da sincronizzare
    const movements = JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]');
    const pendingSyncOperations = JSON.parse(localStorage.getItem('pendingSyncOperations') || '[]');
    
    // Prepara i dati per la sincronizzazione
    const syncData = {
        userId: API_STATE.userId,
        timestamp: Date.now(),
        items: movements,
        pendingOperations: pendingSyncOperations
    };
    
    try {
        // Effettua la richiesta di sincronizzazione
        const response = await apiRequest('/sync', 'POST', syncData);
        
        if (response.data.success) {
            // Aggiorna lo stato di sincronizzazione
            localStorage.setItem('lastSyncTimestamp', Date.now());
            localStorage.removeItem('pendingSyncOperations');
            API_STATE.pendingSync = [];
            
            return {
                success: true,
                syncedItems: response.data.synced,
                timestamp: response.data.timestamp
            };
        } else {
            throw new Error('Errore nella sincronizzazione dei dati');
        }
    } catch (error) {
        console.error('[API] Errore di sincronizzazione:', error);
        throw error;
    }
}

/**
 * Recupera i movimenti dal server
 * @returns {Promise<Array>} - Lista dei movimenti
 */
async function fetchMovementsFromServer() {
    try {
        const response = await apiRequest('/movements', 'GET');
        return response.data.movements;
    } catch (error) {
        console.error('[API] Errore nel recupero dei movimenti:', error);
        // In caso di errore, utilizza i dati locali
        return JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]');
    }
}

/**
 * Salva un movimento sul server
 * @param {Object} movement - Movimento da salvare
 * @returns {Promise<Object>} - Movimento salvato con ID generato dal server
 */
async function saveMovementToServer(movement) {
    try {
        const response = await apiRequest('/movements', 'POST', movement);
        
        if (response.data.success) {
            // Aggiorna l'ID del movimento con quello generato dal server
            return { ...movement, id: response.data.id };
        } else {
            throw new Error('Errore nel salvataggio del movimento');
        }
    } catch (error) {
        console.error('[API] Errore nel salvataggio del movimento:', error);
        
        // Se offline, salva comunque localmente
        return movement;
    }
}

/**
 * Elimina un movimento dal server
 * @param {string|number} movementId - ID del movimento da eliminare
 * @returns {Promise<boolean>} - Esito dell'operazione
 */
async function deleteMovementFromServer(movementId) {
    try {
        const response = await apiRequest(`/movements/${movementId}`, 'DELETE');
        return response.data.success;
    } catch (error) {
        console.error('[API] Errore nell\'eliminazione del movimento:', error);
        
        // Se offline, aggiungi alla coda di sincronizzazione
        API_STATE.pendingSync.push({ 
            endpoint: `/movements/${movementId}`, 
            method: 'DELETE', 
            data: null, 
            timestamp: Date.now() 
        });
        localStorage.setItem('pendingSyncOperations', JSON.stringify(API_STATE.pendingSync));
        
        return true; // Assume success for offline operation
    }
}

/**
 * Recupera le impostazioni utente dal server
 * @returns {Promise<Object>} - Impostazioni utente
 */
async function fetchUserSettings() {
    try {
        const response = await apiRequest('/user/profile', 'GET');
        return response.data.settings;
    } catch (error) {
        console.error('[API] Errore nel recupero delle impostazioni:', error);
        return {
            currency: 'EUR',
            dateFormat: 'DD/MM/YYYY',
            language: 'it'
        };
    }
}

/**
 * Salva le impostazioni utente sul server
 * @param {Object} settings - Impostazioni da salvare
 * @returns {Promise<boolean>} - Esito dell'operazione
 */
async function saveUserSettings(settings) {
    try {
        const response = await apiRequest('/user/settings', 'PUT', settings);
        return response.data.success;
    } catch (error) {
        console.error('[API] Errore nel salvataggio delle impostazioni:', error);
        
        // Se offline, aggiungi alla coda di sincronizzazione
        API_STATE.pendingSync.push({ 
            endpoint: '/user/settings', 
            method: 'PUT', 
            data: settings, 
            timestamp: Date.now() 
        });
        localStorage.setItem('pendingSyncOperations', JSON.stringify(API_STATE.pendingSync));
        
        return true; // Assume success for offline operation
    }
}

// Inizializza l'API al caricamento del file
initApi()
    .then(() => console.log('[API] API client inizializzato con successo'))
    .catch(error => console.error('[API] Errore nell\'inizializzazione dell\'API client:', error));

// Esponi le funzioni pubbliche
window.api = {
    syncData: syncDataWithServer,
    fetchMovements: fetchMovementsFromServer,
    saveMovement: saveMovementToServer,
    deleteMovement: deleteMovementFromServer,
    fetchSettings: fetchUserSettings,
    saveSettings: saveUserSettings,
    isOnline: () => API_STATE.isOnline,
    isAuthenticated: () => Boolean(API_STATE.authToken),
    encrypt: encryptData,
    decrypt: decryptData
}; 