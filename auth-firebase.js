   // auth-firebase.js - Gestione autenticazione con Firebase

   // Configurazione Firebase
   const firebaseConfig = {
     apiKey: "AIzaSyDAAO2N1POqx8F0AY7amJ9ukpEgHqGdP8c",
     authDomain: "https://financetracker-456219.web.app",
     projectId: "finance-tracker-personal-cbaef",
     storageBucket: "finance-tracker-personal-cbaef.firebasestorage.app",
     messagingSenderId: "1052911290954",
     appId: "1:1052911290954:web:ae70348e49314bee9674b3"
   };

   // Inizializza Firebase
   firebase.initializeApp(firebaseConfig);
   const auth = firebase.auth();
   const db = firebase.firestore();

   // Controlla lo stato di autenticazione all'avvio
   document.addEventListener('DOMContentLoaded', function() {
     // Crea container per login se non esiste
     if (!document.getElementById('login-container')) {
       const loginContainer = document.createElement('div');
       loginContainer.id = 'login-container';
       loginContainer.style.display = 'none';
       loginContainer.innerHTML = `
         <div class="login-form">
           <h2>Accedi a FinanceTracker</h2>
           <div class="form-group">
             <label for="login-email">Email:</label>
             <input type="email" id="login-email" required>
           </div>
           <div class="form-group">
             <label for="login-password">Password:</label>
             <input type="password" id="login-password" required>
           </div>
           <div class="form-actions">
             <button id="login-button">Accedi</button>
           </div>
         </div>
       `;
       document.body.insertBefore(loginContainer, document.body.firstChild);
       
       // Aggiungi stile CSS
       const style = document.createElement('style');
       style.textContent = `
         .login-form {
           max-width: 400px;
           margin: 100px auto;
           padding: 20px;
           background: white;
           border-radius: 8px;
           box-shadow: 0 2px 10px rgba(0,0,0,0.1);
         }
         .login-form h2 {
           text-align: center;
           margin-bottom: 20px;
         }
         .form-group {
           margin-bottom: 15px;
         }
         .form-group label {
           display: block;
           margin-bottom: 5px;
         }
         .form-group input {
           width: 100%;
           padding: 8px;
           border: 1px solid #ddd;
           border-radius: 4px;
         }
         .form-actions {
           text-align: center;
         }
         #login-button {
           padding: 10px 20px;
           background: #4285f4;
           color: white;
           border: none;
           border-radius: 4px;
           cursor: pointer;
         }
       `;
       document.head.appendChild(style);
     }
     
     // Nascondi l'app all'inizio
     const appContainer = document.getElementById('app-container');
     if (appContainer) {
       appContainer.style.display = 'none';
     }
     
     // Controlla se l'utente è già autenticato
     auth.onAuthStateChanged(function(user) {
       const loginContainer = document.getElementById('login-container');
       const appContainer = document.getElementById('app-container');
       
       if (user) {
         // Utente autenticato, mostra l'app
         if (loginContainer) loginContainer.style.display = 'none';
         if (appContainer) appContainer.style.display = 'block';
         
         // Carica i dati dal database
         loadDataFromFirebase();
       } else {
         // Utente non autenticato, mostra il login
         if (loginContainer) loginContainer.style.display = 'block';
         if (appContainer) appContainer.style.display = 'none';
       }
     });
     
     // Gestisci il login
     const loginButton = document.getElementById('login-button');
     if (loginButton) {
       loginButton.addEventListener('click', function() {
         const email = document.getElementById('login-email').value;
         const password = document.getElementById('login-password').value;
         
         auth.signInWithEmailAndPassword(email, password)
           .catch(function(error) {
             alert('Errore di accesso: ' + error.message);
           });
       });
     }
   });

   // Carica i dati da Firebase
   function loadDataFromFirebase() {
     const user = auth.currentUser;
     if (!user) return;
     
     db.collection('users').doc(user.uid).get()
       .then(function(doc) {
         if (doc.exists && doc.data().movements) {
           // Salva i movimenti nel localStorage
           localStorage.setItem('financeTrackerMovements', JSON.stringify(doc.data().movements));
           
           // Se necessario, aggiorna l'interfaccia
           if (typeof updateMovementsList === 'function') {
             updateMovementsList();
           }
         }
       })
       .catch(function(error) {
         console.error('Errore nel caricamento dei dati:', error);
       });
   }

   // Funzione per la sincronizzazione
   function syncDataWithFirebase() {
     const user = auth.currentUser;
     if (!user) {
       alert('Devi essere autenticato per sincronizzare i dati');
       return;
     }
     
     // Ottieni i dati dal localStorage
     const movements = JSON.parse(localStorage.getItem('financeTrackerMovements') || '[]');
     
     // Salva su Firebase
     db.collection('users').doc(user.uid).set({
       movements: movements,
       lastSynced: new Date().toISOString()
     })
     .then(function() {
       alert('Sincronizzazione completata con successo!');
       
       // Aggiorna le impostazioni
       const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
       settings.lastSync = Date.now();
       localStorage.setItem('appSettings', JSON.stringify(settings));
       
       // Aggiorna l'interfaccia se necessario
       if (typeof updateSyncStatus === 'function') {
         updateSyncStatus();
       }
     })
     .catch(function(error) {
       alert('Errore durante la sincronizzazione: ' + error.message);
     });
   }

   // Esporta le funzioni globalmente
   window.loadDataFromFirebase = loadDataFromFirebase;
   window.syncDataWithFirebase = syncDataWithFirebase;