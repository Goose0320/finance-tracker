   // supabase-config.js
   (function() {
     // Configurazione Supabase (servizio affidabile e gratuito)
     const SUPABASE_URL = 'https://abcdefghijklmnopqrstu.supabase.co';
     const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3BxcnN0dSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjMyNTE4NDAwLCJleHAiOjE5NDgwNzg0MDB9.exampleTokenKeyR3plac3Th1sW1thY0urActu4lK3y';
     
     console.log("Inizializzazione Supabase...");
     
     // Inizializza API e crea client
     window.supabase = null;
     window.db = null;
     window.userId = null;
     
     // Carica lo script di Supabase dinamicamente
     const loadSupabase = function() {
       return new Promise((resolve, reject) => {
         if (window.supabaseLoaded) {
           resolve();
           return;
         }
         
         const script = document.createElement('script');
         script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
         script.onload = function() {
           window.supabaseLoaded = true;
           resolve();
         };
         script.onerror = function() {
           reject(new Error('Impossibile caricare Supabase'));
         };
         document.head.appendChild(script);
       });
     };
     
     // Inizializza il client Supabase
     const initClient = async function() {
       try {
         await loadSupabase();
         
         if (!window.supabase) {
           window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
           console.log("Client Supabase inizializzato con successo");
           
           // Esponi db come alias per coerenza con il vecchio codice
           window.db = {
             collection: function(name) {
               return {
                 doc: function(id) {
                   return {
                     get: async function() {
                       const { data, error } = await window.supabase
                         .from(name)
                         .select('*')
                         .eq('user_id', id)
                         .single();
                       
                       if (error) throw error;
                       
                       return {
                         exists: !!data,
                         data: function() { return data; }
                       };
                     },
                     set: async function(data, options) {
                       // Verifica se il record esiste già
                       const { data: existing } = await window.supabase
                         .from(name)
                         .select('id')
                         .eq('user_id', id)
                         .single();
                       
                       if (existing) {
                         // Aggiorna il record esistente
                         const { error } = await window.supabase
                           .from(name)
                           .update(data)
                           .eq('user_id', id);
                           
                         if (error) throw error;
                       } else {
                         // Inserisci un nuovo record
                         const { error } = await window.supabase
                           .from(name)
                           .insert([{ ...data, user_id: id }]);
                           
                         if (error) throw error;
                       }
                       
                       return Promise.resolve();
                     },
                     onSnapshot: function(callback, errorCallback) {
                       // Supabase non supporta nativamente listeners in tempo reale come Firestore
                       // Implementiamo un polling efficiente invece
                       let lastData = null;
                       const pollInterval = 3000; // 3 secondi
                       
                       const poll = async function() {
                         try {
                           const { data, error } = await window.supabase
                             .from(name)
                             .select('*')
                             .eq('user_id', id)
                             .single();
                             
                           if (error) throw error;
                           
                           // Se i dati sono cambiati, notifica il callback
                           if (JSON.stringify(data) !== JSON.stringify(lastData)) {
                             lastData = data;
                             callback({
                               exists: !!data,
                               data: function() { return data; }
                             });
                           }
                         } catch (err) {
                           if (errorCallback) errorCallback(err);
                         }
                       };
                       
                       // Esegui immediatamente e poi ogni 3 secondi
                       poll();
                       const intervalId = setInterval(poll, pollInterval);
                       
                       // Restituisci una funzione per annullare la sottoscrizione
                       return function() {
                         clearInterval(intervalId);
                       };
                     }
                   };
                 }
               };
             }
           };
         }
         
         // Verifica stato autenticazione
         const { data: { user } } = await window.supabase.auth.getUser();
         
         if (user) {
           console.log("Utente già autenticato:", user.id);
           window.userId = user.id;
         } else {
           // Se non autenticato, fai un login anonimo
           console.log("Nessun utente autenticato, procedo con autenticazione anonima");
           await signInAnonymously();
         }
         
         // Crea e dispara un evento personalizzato
         const readyEvent = new CustomEvent('database-ready', { 
           detail: { userId: window.userId } 
         });
         document.dispatchEvent(readyEvent);
         
         return true;
       } catch (error) {
         console.error("Errore nell'inizializzazione di Supabase:", error);
         return false;
       }
     };
     
     // Login anonimo
     const signInAnonymously = async function() {
       try {
         // Genera credenziali casuali per l'utente anonimo
         const email = `anonymous_${Date.now()}_${Math.floor(Math.random() * 1000000)}@example.com`;
         const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
         
         // Registra l'utente
         const { data, error } = await window.supabase.auth.signUp({
           email: email,
           password: password
         });
         
         if (error) throw error;
         
         console.log("Autenticazione anonima riuscita:", data.user.id);
         window.userId = data.user.id;
         
         // Salva le credenziali in localStorage per futuri accessi
         localStorage.setItem('anonymousCredentials', JSON.stringify({
           email: email,
           password: password
         }));
         
         return data.user;
       } catch (error) {
         console.error("Errore durante l'autenticazione anonima:", error);
         
         // Fallback: prova a recuperare credenziali precedenti
         const savedCreds = localStorage.getItem('anonymousCredentials');
         if (savedCreds) {
           try {
             const { email, password } = JSON.parse(savedCreds);
             const { data, error } = await window.supabase.auth.signInWithPassword({
               email: email,
               password: password
             });
             
             if (error) throw error;
             
             console.log("Login con credenziali salvate riuscito:", data.user.id);
             window.userId = data.user.id;
             return data.user;
           } catch (e) {
             console.error("Errore durante il recupero sessione:", e);
             throw e;
           }
         } else {
           throw error;
         }
       }
     };
     
     // Esporta funzioni globalmente
     window.auth = {
       signInAnonymously: signInAnonymously,
       currentUser: { uid: window.userId },
       onAuthStateChanged: function(callback) {
         // Controlla lo stato dell'autenticazione e chiama il callback
         window.supabase.auth.onAuthStateChange((event, session) => {
           if (session) {
             window.userId = session.user.id;
             window.auth.currentUser = { uid: window.userId };
             callback({ uid: window.userId });
           } else {
             window.userId = null;
             window.auth.currentUser = null;
             callback(null);
           }
         });
       }
     };
     
     // Avvia l'inizializzazione
     initClient().then(function(success) {
       window.databaseReady = success;
       console.log("Inizializzazione completata, database pronto:", success);
     });
   })();