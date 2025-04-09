// Inizializzazione dell'applicazione
document.addEventListener('DOMContentLoaded', function() {
    // Inizializza le variabili dell'applicazione
    const state = {
        movements: [], // Array che conterrà tutti i movimenti
        filteredMovements: [], // Array che conterrà i movimenti filtrati
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1,
        isAuthenticated: false,
        userData: null,
        activeTab: 'movements',
    };

    // Pulisci eventuali dati inconsistenti dal localStorage
    cleanupLocalStorage();

    // Carica i dati dal localStorage se disponibili
    loadDataFromLocalStorage();

    // Inizializza gli eventi UI
    initUIEvents();

    // Imposta la data odierna di default nel form
    setTodayDate();

    // Popola la tabella dei movimenti
    renderMovements();
    
    // Espone la funzione di aggiornamento a livello globale per la sincronizzazione
    window.updateMovementsList = function() {
        // Ricarica i dati dal localStorage
        loadDataFromLocalStorage();
        
        // Aggiorna i filtri attivi
        if (state.filteredMovements.length > 0) {
            applyFilters();
        } else {
            // Reset dei filtri
            state.filteredMovements = [...state.movements];
            state.totalPages = Math.ceil(state.filteredMovements.length / state.itemsPerPage);
        }
        
        // Aggiorna la visualizzazione
        renderMovements();
        
        // Se siamo nella sezione report, aggiorna anche i report
        if (state.activeTab === 'reports' && typeof window.updateReportData === 'function') {
            window.updateReportData();
        }
        
        console.log("Interfaccia aggiornata con i nuovi dati sincronizzati");
    };

    // Funzioni di utilità -----------------------------------------------------

    // Pulisce il localStorage da chiavi obsolete e assicura coerenza tra istanze
    function cleanupLocalStorage() {
        // Rimuovi l'impostazione precedente se esiste
        if (localStorage.getItem('appSettings')) {
            const oldSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
            localStorage.removeItem('appSettings');
            
            // Migra le vecchie impostazioni al nuovo formato
            const settings = JSON.parse(localStorage.getItem('financeTrackerSettings') || '{}');
            settings.syncEnabled = true; // Forza l'attivazione della sincronizzazione
            
            // Combina le vecchie e nuove impostazioni
            if (oldSettings.lastSync && (!settings.lastSync || oldSettings.lastSync > settings.lastSync)) {
                settings.lastSync = oldSettings.lastSync;
            }
            
            localStorage.setItem('financeTrackerSettings', JSON.stringify(settings));
            console.log("Migrazione impostazioni completata");
        }
        
        // Assicurati che syncEnabled sia sempre true
        const settings = JSON.parse(localStorage.getItem('financeTrackerSettings') || '{}');
        settings.syncEnabled = true;
        localStorage.setItem('financeTrackerSettings', JSON.stringify(settings));
    }

    // Imposta la data odierna nel campo data del form
    function setTodayDate() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        document.getElementById('movement-date').value = dateStr;
    }

    // Carica i dati dal localStorage
    function loadDataFromLocalStorage() {
        const savedMovements = localStorage.getItem('financeTrackerMovements');
        if (savedMovements) {
            state.movements = JSON.parse(savedMovements);
            state.totalPages = Math.ceil(state.movements.length / state.itemsPerPage);
        }
    }

    // Salva i dati nel localStorage
    function saveDataToLocalStorage() {
        localStorage.setItem('financeTrackerMovements', JSON.stringify(state.movements));
    }

    // Gestione degli eventi dell'interfaccia ---------------------------------
    function initUIEvents() {
        // Gestione del form per nuovo movimento
        const movementForm = document.getElementById('movement-form');
        if (movementForm) {
            movementForm.addEventListener('submit', handleNewMovement);
        }

        // Gestione della navigazione tra tab
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetTab = this.getAttribute('href').substring(1); // Rimuove il # dall'href
                activateTab(targetTab);
            });
        });

        // Gestione dei filtri
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', applyFilters);
        }

        const resetFiltersBtn = document.getElementById('reset-filters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', resetFilters);
        }

        // Gestione della paginazione
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (state.currentPage > 1) {
                    state.currentPage--;
                    renderMovements();
                }
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                if (state.currentPage < state.totalPages) {
                    state.currentPage++;
                    renderMovements();
                }
            });
        }

        // Gestione input filtri che cambiano dinamicamente
        const searchFilter = document.getElementById('search-filter');
        if (searchFilter) {
            searchFilter.addEventListener('input', debounce(applyFilters, 300));
        }
    }

    // Attiva il tab selezionato
    function activateTab(tabId) {
        // Rimuove la classe active da tutti i tab e link
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('nav li').forEach(li => {
            li.classList.remove('active');
        });
        
        // Attiva il tab selezionato
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Attiva il link del tab selezionato
        const selectedLink = document.querySelector(`nav a[href="#${tabId}"]`);
        if (selectedLink) {
            selectedLink.parentElement.classList.add('active');
        }
        
        state.activeTab = tabId;
    }

    // Gestione del nuovo movimento
    function handleNewMovement(e) {
        e.preventDefault();
        
        // Recupera i dati dal form
        const type = document.getElementById('movement-type').value;
        const category = document.getElementById('movement-category').value;
        const amount = parseFloat(document.getElementById('movement-amount').value);
        const date = document.getElementById('movement-date').value;
        const description = document.getElementById('movement-description').value;
        const tagsString = document.getElementById('movement-tags').value;
        const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];
        
        // Crea un nuovo movimento
        const newMovement = {
            id: Date.now(), // ID unico basato sul timestamp
            type,
            category,
            amount,
            date,
            description,
            tags,
            createdAt: new Date().toISOString()
        };
        
        // Aggiungi il movimento alla lista
        state.movements.unshift(newMovement); // Aggiunge all'inizio dell'array
        
        // Aggiorna il localStorage
        saveDataToLocalStorage();
        
        // Reimposta il form
        e.target.reset();
        setTodayDate();
        
        // Aggiorna la visualizzazione
        resetFilters();
        renderMovements();
        
        // Feedback all'utente
        showNotification('Movimento aggiunto con successo!', 'success');
    }

    // Applica i filtri alla lista dei movimenti
    function applyFilters() {
        const searchText = document.getElementById('search-filter').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const typeFilter = document.getElementById('type-filter').value;
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        
        // Filtra i movimenti in base ai criteri
        state.filteredMovements = state.movements.filter(movement => {
            // Filtro di ricerca testuale
            const matchesSearch = 
                movement.description.toLowerCase().includes(searchText) || 
                movement.category.toLowerCase().includes(searchText) ||
                (movement.tags && movement.tags.some(tag => tag.toLowerCase().includes(searchText)));
            
            // Filtro categoria
            const matchesCategory = !categoryFilter || movement.category === categoryFilter;
            
            // Filtro tipo
            const matchesType = !typeFilter || movement.type === typeFilter;
            
            // Filtro data (da)
            const matchesDateFrom = !dateFrom || movement.date >= dateFrom;
            
            // Filtro data (a)
            const matchesDateTo = !dateTo || movement.date <= dateTo;
            
            return matchesSearch && matchesCategory && matchesType && matchesDateFrom && matchesDateTo;
        });
        
        // Aggiorna lo stato e visualizza
        state.currentPage = 1;
        state.totalPages = Math.ceil(state.filteredMovements.length / state.itemsPerPage);
        renderMovements();
    }

    // Resetta i filtri
    function resetFilters() {
        document.getElementById('search-filter').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        
        state.filteredMovements = [...state.movements];
        state.currentPage = 1;
        state.totalPages = Math.ceil(state.filteredMovements.length / state.itemsPerPage);
        
        renderMovements();
    }

    // Renderizza la lista dei movimenti nella tabella
    function renderMovements() {
        const tableBody = document.getElementById('movements-data');
        if (!tableBody) return;
        
        // Svuota la tabella
        tableBody.innerHTML = '';
        
        // Determina quali movimenti mostrare (tutti o filtrati)
        const movementsToShow = state.filteredMovements.length > 0 ? state.filteredMovements : state.movements;
        
        // Calcola gli indici per la paginazione
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        
        // Mostra i movimenti per la pagina corrente
        const currentPageMovements = movementsToShow.slice(startIndex, endIndex);
        
        if (currentPageMovements.length === 0) {
            // Se non ci sono movimenti, mostra un messaggio
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="7" style="text-align: center;">Nessun movimento trovato</td>`;
            tableBody.appendChild(emptyRow);
        } else {
            // Altrimenti, mostra i movimenti
            currentPageMovements.forEach(movement => {
                const row = document.createElement('tr');
                
                // Formatta la data
                const formattedDate = formatDate(movement.date);
                
                // Formatta l'importo
                const formattedAmount = formatCurrency(movement.amount);
                
                // Formatta i tag
                const formattedTags = formatTags(movement.tags);
                
                // Crea la riga della tabella
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${capitalizeFirstLetter(movement.type)}</td>
                    <td>${capitalizeFirstLetter(movement.category)}</td>
                    <td>${movement.description}</td>
                    <td class="amount-${movement.type}">${formattedAmount}</td>
                    <td>${formattedTags}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" data-id="${movement.id}">Modifica</button>
                        <button class="delete-btn" data-id="${movement.id}">Elimina</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Aggiungi event listener ai pulsanti di modifica e eliminazione
            addActionButtonsListeners();
        }
        
        // Aggiorna informazioni sulla paginazione
        updatePaginationInfo();
    }

    // Aggiorna le informazioni sulla paginazione
    function updatePaginationInfo() {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            const movementsToShow = state.filteredMovements.length > 0 ? state.filteredMovements : state.movements;
            state.totalPages = Math.max(1, Math.ceil(movementsToShow.length / state.itemsPerPage));
            
            pageInfo.textContent = `Pagina ${state.currentPage} di ${state.totalPages}`;
            
            // Abilita/disabilita pulsanti di navigazione
            const prevPageBtn = document.getElementById('prev-page');
            const nextPageBtn = document.getElementById('next-page');
            
            if (prevPageBtn) {
                prevPageBtn.disabled = state.currentPage <= 1;
            }
            
            if (nextPageBtn) {
                nextPageBtn.disabled = state.currentPage >= state.totalPages;
            }
        }
    }

    // Aggiungi event listener ai pulsanti di azione
    function addActionButtonsListeners() {
        // Event listener per i pulsanti di modifica
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const movementId = parseInt(this.getAttribute('data-id'));
                editMovement(movementId);
            });
        });
        
        // Event listener per i pulsanti di eliminazione
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const movementId = parseInt(this.getAttribute('data-id'));
                deleteMovement(movementId);
            });
        });
    }

    // Funzione per modificare un movimento
    function editMovement(movementId) {
        // Trova il movimento nell'array
        const movementToEdit = state.movements.find(m => m.id === movementId);
        
        if (!movementToEdit) {
            showNotification('Movimento non trovato', 'error');
            return;
        }
        
        // Popola il form con i dati del movimento
        document.getElementById('movement-type').value = movementToEdit.type;
        document.getElementById('movement-category').value = movementToEdit.category;
        document.getElementById('movement-amount').value = movementToEdit.amount;
        document.getElementById('movement-date').value = movementToEdit.date;
        document.getElementById('movement-description').value = movementToEdit.description;
        document.getElementById('movement-tags').value = movementToEdit.tags.join(', ');
        
        // Rimuovi l'event listener esistente per evitare duplicati
        const form = document.getElementById('movement-form');
        const oldForm = form.cloneNode(true);
        form.parentNode.replaceChild(oldForm, form);
        
        // Aggiungi nuovo event listener che gestisce l'aggiornamento
        oldForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Aggiorna il movimento con i nuovi dati
            movementToEdit.type = document.getElementById('movement-type').value;
            movementToEdit.category = document.getElementById('movement-category').value;
            movementToEdit.amount = parseFloat(document.getElementById('movement-amount').value);
            movementToEdit.date = document.getElementById('movement-date').value;
            movementToEdit.description = document.getElementById('movement-description').value;
            const tagsString = document.getElementById('movement-tags').value;
            movementToEdit.tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];
            movementToEdit.updatedAt = new Date().toISOString();
            
            // Aggiorna il localStorage
            saveDataToLocalStorage();
            
            // Reimposta il form
            e.target.reset();
            setTodayDate();
            
            // Aggiorna la visualizzazione
            resetFilters();
            renderMovements();
            
            // Feedback all'utente
            showNotification('Movimento aggiornato con successo!', 'success');
            
            // Ripristina l'event listener originale
            initUIEvents();
        });
        
        // Scorri fino al form
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    }

    // Funzione per eliminare un movimento
    function deleteMovement(movementId) {
        if (confirm('Sei sicuro di voler eliminare questo movimento?')) {
            // Trova l'indice del movimento
            const index = state.movements.findIndex(m => m.id === movementId);
            
            if (index !== -1) {
                // Rimuovi il movimento dall'array
                state.movements.splice(index, 1);
                
                // Aggiorna il localStorage
                saveDataToLocalStorage();
                
                // Aggiorna la visualizzazione
                resetFilters();
                renderMovements();
                
                // Feedback all'utente
                showNotification('Movimento eliminato con successo!', 'success');
            } else {
                showNotification('Movimento non trovato', 'error');
            }
        }
    }

    // Funzioni di utilità -----------------------------------------------------

    // Formatta la data nel formato locale
    function formatDate(dateString) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('it-IT', options);
    }

    // Formatta l'importo come valuta
    function formatCurrency(amount) {
        return new Intl.NumberFormat('it-IT', { 
            style: 'currency', 
            currency: 'EUR' 
        }).format(amount);
    }

    // Formatta i tag come elementi HTML
    function formatTags(tags) {
        if (!tags || tags.length === 0) return '';
        
        return tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    }

    // Maiuscola la prima lettera
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Funzione per mostrare notifiche all'utente
    function showNotification(message, type = 'info') {
        // Controlla se esiste già un elemento di notifica
        let notification = document.querySelector('.notification');
        
        // Se non esiste, crealo
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Imposta il tipo e il messaggio
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Mostra la notifica
        notification.style.display = 'block';
        
        // Nascondi la notifica dopo 3 secondi
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // Funzione per ridurre le chiamate ripetute (debounce)
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
}); 