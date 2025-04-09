// Login.js - Versione semplificata
document.addEventListener('DOMContentLoaded', function() {
  console.log("Login.js caricato - VERSIONE SEMPLIFICATA");
  
  // Nascondi il contenuto dell'app finché non viene effettuato il login
  const appContainer = document.getElementById('app-container');
  if (appContainer) {
    appContainer.style.display = 'none';
    console.log("app-container trovato e nascosto");
  } else {
    console.error("ERRORE: app-container non trovato!");
  }
  
  // Crea form di login se non esiste già
  if (!document.getElementById('login-container')) {
    console.log("Creazione form di login...");
    
    // Crea container per il login
    const loginContainer = document.createElement('div');
    loginContainer.id = 'login-container';
    loginContainer.style.position = 'fixed';
    loginContainer.style.top = '0';
    loginContainer.style.left = '0';
    loginContainer.style.width = '100%';
    loginContainer.style.height = '100%';
    loginContainer.style.backgroundColor = 'rgba(255,255,255,0.95)';
    loginContainer.style.display = 'flex';
    loginContainer.style.justifyContent = 'center';
    loginContainer.style.alignItems = 'center';
    loginContainer.style.zIndex = '9999';
    
    // Crea il form
    const loginForm = document.createElement('div');
    loginForm.style.backgroundColor = 'white';
    loginForm.style.padding = '30px';
    loginForm.style.borderRadius = '8px';
    loginForm.style.boxShadow = '0 2px 15px rgba(0,0,0,0.2)';
    loginForm.style.width = '350px';
    loginForm.style.maxWidth = '90%';
    
    loginForm.innerHTML = `
      <h2 style="text-align:center;margin-bottom:25px;color:#333;">Accedi a FinanceTracker</h2>
      <div style="margin-bottom:20px;">
        <label for="login-email" style="display:block;margin-bottom:8px;font-weight:bold;">Email:</label>
        <input type="email" id="login-email" placeholder="La tua email" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;font-size:16px;">
      </div>
      <div style="margin-bottom:25px;">
        <label for="login-password" style="display:block;margin-bottom:8px;font-weight:bold;">Password:</label>
        <input type="password" id="login-password" placeholder="La tua password" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;font-size:16px;">
      </div>
      <div style="text-align:center;margin-bottom:15px;">
        <button id="login-button" style="padding:12px 25px;background:#4285f4;color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;font-weight:bold;">Accedi</button>
      </div>
      <div id="login-error" style="color:red;margin-top:15px;text-align:center;"></div>
      <div style="text-align:center;margin-top:15px;font-size:12px;color:#666;">
        Prova con: admin@example.com / password123
      </div>
    `;
    
    loginContainer.appendChild(loginForm);
    document.body.appendChild(loginContainer);
    
    // Aggiungi evento di login
    document.getElementById('login-button').addEventListener('click', function() {
      // Versione semplificata: autenticazione simulata
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorElement = document.getElementById('login-error');
      
      if (!email || !password) {
        errorElement.textContent = 'Inserisci email e password';
        return;
      }
      
      console.log("Tentativo di login con:", email);
      
      // Credenziali di test
      if (email === 'admin@example.com' && password === 'password123') {
        console.log("Login riuscito con credenziali di test");
        errorElement.textContent = '';
        loginContainer.style.display = 'none';
        if (appContainer) {
          appContainer.style.display = 'block';
        }
        
        // Aggiorna nome utente
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
          userNameElement.textContent = email;
        }
      } else {
        // Prova Firebase se le credenziali di test non funzionano
        if (typeof firebase !== 'undefined') {
          errorElement.textContent = 'Login in corso...';
          
          firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
              console.log("Login riuscito:", userCredential.user.email);
              errorElement.textContent = '';
              loginContainer.style.display = 'none';
              if (appContainer) {
                appContainer.style.display = 'block';
              }
              
              // Aggiorna nome utente
              const userNameElement = document.getElementById('user-name');
              if (userNameElement) {
                userNameElement.textContent = userCredential.user.email;
              }
            })
            .catch((error) => {
              console.error("Errore login:", error.code, error.message);
              errorElement.textContent = 'Errore: ' + error.message;
            });
        } else {
          errorElement.textContent = 'Firebase non disponibile! Usa admin@example.com / password123';
        }
      }
    });
  } else {
    console.log("Form di login già esistente");
  }
});