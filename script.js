// Data storage (using localStorage as per original request)
let horses = JSON.parse(localStorage.getItem('horses')) || [];
let selectedHorse = null;

// --- Utility Functions ---

/**
 * Displays a custom message modal instead of a native alert.
 * @param {string} title - The title of the message.
 * @param {string} body - The body content of the message.
 */
function showMessage(title, body) {
    document.getElementById('messageModalTitle').textContent = title;
    document.getElementById('messageModalBody').textContent = body;
    openModal('messageModal');
}

/**
 * Displays a custom confirmation modal.
 * @param {string} title - The title of the confirmation.
 * @param {string} body - The body content of the confirmation.
 * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise.
 */
function showConfirm(title, body) {
    return new Promise((resolve) => {
        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalBody').textContent = body;
        openModal('confirmModal');

        const confirmOkBtn = document.getElementById('confirmOkBtn');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');

        const handleConfirm = () => {
            closeModal('confirmModal');
            confirmOkBtn.removeEventListener('click', handleConfirm);
            confirmCancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            closeModal('confirmModal');
            confirmOkBtn.removeEventListener('click', handleConfirm);
            confirmCancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };

        confirmOkBtn.addEventListener('click', handleConfirm);
        confirmCancelBtn.addEventListener('click', handleCancel);
    });
}

/**
 * Saves the current 'horses' array to localStorage.
 */
function saveData() {
    localStorage.setItem('horses', JSON.stringify(horses));
    console.log('Data saved to localStorage.');
}

/**
 * Formats a date string to a localized string (e.g., DD/MM/YYYY for en-AU).
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date string.
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        console.warn('Invalid date string provided to formatDate:', dateString); // Added for debugging
        return 'Invalid Date';
    }
    // Formatting for Australian date context (DD/MM/YYYY)
    const formattedDate = date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    console.log(`Formatted date "${dateString}" to "${formattedDate}" (en-AU).`); // Added for debugging
    return formattedDate;
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The input string.
 * @returns {string} The string with the first letter capitalized.
 */
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Modal Functions ---

/**
 * Opens a specified modal.
 * @param {string} modalId - The ID of the modal to open.
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex'; // Use flex to center the modal content
        // Reset forms when opening modals, but only for input modals, not message/confirm modals
        if (modalId !== 'messageModal' && modalId !== 'confirmModal') {
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
                // Reset "Other" input visibility if present
                const otherInputDiv = form.querySelector('.other-input');
                if (otherInputDiv) {
                    otherInputDiv.style.display = 'none';
                    const otherInputField = otherInputDiv.querySelector('input, textarea');
                    if (otherInputField) {
                        otherInputField.value = '';
                        otherInputField.removeAttribute('required'); // Remove required attribute when hidden
                    }
                }
            }
        }
    } else {
        console.error(`Error: Modal ${modalId} not found`);
        showMessage('Error', `Modal "${modalId}" not found.`);
    }
}

/**
 * Closes a specified modal.
 * @param {string} modalId - The ID of the modal to close.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error(`Error: Modal ${modalId} not found`);
        showMessage('Error', `Modal "${modalId}" not found.`);
    }
}

// Close modals when clicking outside of them
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// --- "Other" Input Toggling ---

/**
 * Toggles the visibility of an "Other" input field based on select dropdown value.
 * @param {Event} event - The change event from the select element.
 */
function toggleOtherInput(event) {
    const selectElement = event.target;
    // Find the parent form-group, then look for the .other-input div within it
    const formGroup = selectElement.closest('.form-group');
    if (!formGroup) {
        console.error('toggleOtherInput: Parent form-group not found.');
        return;
    }
    const otherInputDiv = formGroup.nextElementSibling; // Assuming other-input is sibling
    
    // Check if the next sibling is indeed an "other-input" and has the correct ID structure
    if (otherInputDiv && otherInputDiv.classList.contains('other-input')) {
        const otherInputField = otherInputDiv.querySelector('input, textarea');
        if (!otherInputField) {
            console.error('toggleOtherInput: Other input field not found within .other-input div.');
            return;
        }

        if (selectElement.value === 'Other') {
            otherInputDiv.style.display = 'block';
            otherInputField.setAttribute('required', 'required');
        } else {
            otherInputDiv.style.display = 'none';
            otherInputField.removeAttribute('required');
            otherInputField.value = ''; // Clear value when hidden
        }
    }
}


// --- Horse Management Functions ---

/**
 * Loads horses into the select dropdown.
 */
function loadHorses() {
    const horseSelect = document.getElementById('horseSelect');
    horseSelect.innerHTML = '<option value="">-- Select a horse --</option>'; // Clear existing options

    horses.forEach((horse, index) => {
        // Ensure horse.records and its sub-arrays are initialized
        horse.records = horse.records || {};
        horse.records.vaccinations = horse.records.vaccinations || [];
        horse.records.deworming = horse.records.deworming || [];
        horse.records.farrier = horse.records.farrier || [];
        horse.records.veterinary = horse.records.veterinary || [];

        const option = document.createElement('option');
        option.value = index; // Use array index as value for localStorage
        option.textContent = horse.name;
        horseSelect.appendChild(option);
    });

    // If a horse was previously selected, try to re-select it
    // This handles cases where data is reloaded or page refreshes
    if (selectedHorse !== null && horses[selectedHorse.index]) {
        horseSelect.value = selectedHorse.index;
        // Directly reference the object in the array
        selectedHorse = horses[selectedHorse.index]; 
        selectedHorse.index = parseInt(horseSelect.value); // Ensure index is correct
        loadHorseData();
    } else {
        selectedHorse = null;
        document.getElementById('horseContent').style.display = 'none';
    }
    updateReminders();
}

/**
 * Adds a new horse.
 * @param {Event} e - The form submission event.
 */
function addHorse(e) {
    e.preventDefault();
    
    const name = document.getElementById('horseName').value.trim();
    if (!name) {
        showMessage('Input Required', 'Horse name is required.');
        return;
    }
    
    const breed = document.getElementById('horseBreed').value.trim();
    const age = document.getElementById('horseAge').value.trim();
    const colour = document.getElementById('horseColour').value.trim();
    
    const horse = {
        name: name,
        breed: breed || 'Not specified',
        age: age || 'Not specified',
        colour: colour || 'Not specified',
        records: { // Initialize empty records for all categories
            vaccinations: [],
            deworming: [],
            farrier: [],
            veterinary: []
        }
    };
    
    horses.push(horse);
    saveData();
    loadHorses();
    closeModal('addHorseModal');
    document.getElementById('addHorseForm').reset();
    showMessage('Success', 'Horse added successfully!');
}

/**
 * Switches the currently selected horse in the UI.
 */
function switchHorse() {
    const horseSelect = document.getElementById('horseSelect');
    const horseIndex = parseInt(horseSelect.value); // Parse to integer
    
    if (isNaN(horseIndex) || horseIndex < 0 || horseIndex >= horses.length) { // Check for valid index
        selectedHorse = null;
        document.getElementById('horseContent').style.display = 'none';
        return;
    }
    
    selectedHorse = horses[horseIndex]; // Direct reference
    selectedHorse.index = horseIndex; // Store index for convenience if needed elsewhere
    document.getElementById('horseContent').style.display = 'block';
    // Ensure overview tab is active by default when switching horse
    document.getElementById('tabSelect').value = 'overview';
    switchTab('overview'); 
    loadHorseData(); // Load data for the newly selected horse
}

/**
 * Loads all data for the currently selected horse into the respective tab panes.
 */
function loadHorseData() {
    if (!selectedHorse) {
        return;
    }
    loadOverview();
    loadRecords('vaccinations', 'vaccinationRecords');
    loadRecords('deworming', 'dewormingRecords');
    loadRecords('farrier', 'farrierRecords');
    loadRecords('veterinary', 'veterinaryRecords');
}

/**
 * Populates the overview tab with horse details and recent activity.
 */
function loadOverview() {
    if (!selectedHorse) {
        return;
    }
    const overviewContent = document.getElementById('overviewContent');
    
    let html = `
        <div class="record-item">
            <h3>${selectedHorse.name || 'Unknown Horse'}</h3>
            <p><strong>Breed:</strong> ${selectedHorse.breed || 'Not specified'}</p>
            <p><strong>Age:</strong> ${selectedHorse.age || 'Not specified'}</p>
            <p><strong>Colour:</strong> ${selectedHorse.colour || 'Not specified'}</p>
        </div>
    `;
    
    const allRecords = [];
    // Combine all records for recent activity display
    Object.keys(selectedHorse.records || {}).forEach(type => {
        if (selectedHorse.records[type] && Array.isArray(selectedHorse.records[type])) {
            selectedHorse.records[type].forEach(record => {
                allRecords.push({...record, type: type});
            });
        }
    });
    
    allRecords.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
    
    if (allRecords.length > 0) {
        html += '<h3>Recent Activity</h3>';
        allRecords.slice(0, 5).forEach(record => { // Show up to 5 recent activities
            html += `
                <div class="record-item">
                    <div class="record-header">
                        <span class="record-type">${capitalizeFirst(record.type)}</span>
                        <span class="record-date">${formatDate(record.date)}</span>
                    </div>
                    <div class="record-details">
                        ${getRecordSummary(record)}
                    </div>
                </div>
            `;
        });
    } else {
        html += '<div class="empty-state">No records yet. Add health records to start!</div>';
    }
    
    overviewContent.innerHTML = html;
}

/**
 * Populates a specific record tab (e.g., vaccinations, deworming).
 * @param {string} type - The type of record (e.g., 'vaccinations').
 * @param {string} containerId - The ID of the HTML container for these records.
 */
function loadRecords(type, containerId) {
    if (!selectedHorse) {
        return;
    }
    const container = document.getElementById(containerId);
    const records = selectedHorse.records?.[type] || [];
    
    if (records.length === 0) {
        container.innerHTML = '<div class="empty-state">No records yet. Click + Add to start.</div>';
        return;
    }
    
    const sortedRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date));
    const fragment = document.createDocumentFragment();
    
    sortedRecords.forEach((record, index) => {
        const recordDiv = document.createElement('div');
        recordDiv.className = 'record-item';
        recordDiv.innerHTML = `
            <div class="record-header">
                <span class="record-type">${getRecordTitle(record, type)}</span>
                <div>
                    <span class="record-date">${formatDate(record.date)}</span>
                    <button class="btn btn-danger" onclick="deleteRecord('${type}', ${index})" aria-label="Delete this record">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
            <div class="record-details">
                ${getRecordDetails(record, type)}
            </div>
        `;
        fragment.appendChild(recordDiv);
    });
    
    container.innerHTML = ''; // Clear previous content
    container.appendChild(fragment);
}

/**
 * Gets a descriptive title for a record based on its type.
 * @param {object} record - The record object.
 * @param {string} type - The type of record.
 * @returns {string} The descriptive title.
 */
function getRecordTitle(record, type) {
    switch(type) {
        case 'vaccinations':
            return record.type || 'Vaccination';
        case 'deworming':
            return record.product || 'Deworming';
        case 'farrier':
            return record.service || 'Farrier Visit';
        case 'veterinary':
            return record.visitType || 'Veterinary Visit';
        default:
            return 'Record';
    }
}

/**
 * Gets detailed HTML content for a record based on its type.
 * @param {object} record - The record object.
 * @param {string} type - The type of record.
 * @returns {string} HTML string with record details.
 */
function getRecordDetails(record, type) {
    let details = '';
    
    switch(type) {
        case 'vaccinations':
            if (record.veterinarian) details += `<p><strong>Veterinarian:</strong> ${record.veterinarian}</p>`;
            if (record.nextDue) details += `<p><strong>Next Due:</strong> ${formatDate(record.nextDue)}</p>`;
            if (record.notes) details += `<p><strong>Notes:</strong> ${record.notes}</p>`;
            break;
        case 'deworming':
            if (record.weight) details += `<p><strong>Weight:</strong> ${record.weight} kg</p>`;
            if (record.nextDue) details += `<p><strong>Next Due:</strong> ${formatDate(record.nextDue)}</p>`;
            if (record.notes) details += `<p><strong>Notes:</strong> ${record.notes}</p>`;
            break;
        case 'farrier':
            if (record.farrier) details += `<p><strong>Farrier:</strong> ${record.farrier}</p>`;
            if (record.cost) details += `<p><strong>Cost:</strong> $${parseFloat(record.cost).toFixed(2)}</p>`;
            if (record.nextDue) details += `<p><strong>Next Due:</strong> ${formatDate(record.nextDue)}</p>`;
            if (record.notes) details += `<p><strong>Notes:</strong> ${record.notes}</p>`;
            break;
        case 'veterinary':
            if (record.veterinarian) details += `<p><strong>Veterinarian:</strong> ${record.veterinarian}</p>`;
            if (record.diagnosis) details += `<p><strong>Diagnosis:</strong> ${record.diagnosis}</p>`;
            if (record.treatment) details += `<p><strong>Treatment:</strong> ${record.treatment}</p>`;
            if (record.cost) details += `<p><strong>Cost:</strong> $${parseFloat(record.cost).toFixed(2)}</p>`;
            if (record.nextDue) details += `<p><strong>Next Check-up:</strong> ${formatDate(record.nextDue)}</p>`;
            if (record.notes) details += `<p><strong>Notes:</strong> ${record.notes}</p>`;
            break;
    }
    return details;
}

/**
 * Gets a summary string for a record, used in the overview tab.
 * @param {object} record - The record object.
 * @returns {string} A brief summary of the record.
 */
function getRecordSummary(record) {
    switch(record.type) {
        case 'vaccinations':
            return `${record.type || 'Vaccination'} administered`;
        case 'deworming':
            return `${record.product || 'Deworming'} administered`;
        case 'farrier':
            return `${record.service || 'Farrier visit'} by ${record.farrier || 'Farrier'}`;
        case 'veterinary':
            return `${record.visitType || 'Veterinary visit'} by ${record.veterinarian || 'Veterinarian'}`;
        default:
            return 'Health record updated';
    }
}

/**
 * Deletes a specific record from the selected horse's data.
 * @param {string} type - The type of record (e.g., 'vaccinations').
 * @param {number} index - The index of the record in the array to delete.
 */
async function deleteRecord(type, index) {
    if (selectedHorse === null) {
        showMessage('Error', 'Please select a horse first.');
        return;
    }

    const confirmed = await showConfirm('Delete Record', 'Are you sure you want to delete this record? This action cannot be undone.');
    if (!confirmed) {
        return;
    }

    if (selectedHorse.records && selectedHorse.records[type] && selectedHorse.records[type][index]) {
        selectedHorse.records[type].splice(index, 1); // Remove the record
        // No need to re-assign selectedHorse to horses[selectedHorse.index] here
        // as selectedHorse is now a direct reference
        saveData();
        loadHorseData(); // Reload data for the current horse
        updateReminders();
        showMessage('Success', 'Record deleted successfully!');
    } else {
        showMessage('Error', 'Record not found.');
    }
}

// --- Add Record Functions (Local Storage) ---

/**
 * Adds a vaccination record to the selected horse.
 * @param {Event} e - The form submission event.
 */
function addVaccination(e) {
    e.preventDefault();
    if (selectedHorse === null) {
        showMessage('Error', 'Please select a horse first.');
        return;
    }
    
    const vaccineType = document.getElementById('vaccineType').value;
    const otherType = document.getElementById('otherVaccineType').value.trim();
    const date = document.getElementById('vaccineDate').value;
    const nextDue = document.getElementById('vaccineNextDue').value;
    const veterinarian = document.getElementById('vaccineVet').value.trim();
    const notes = document.getElementById('vaccineNotes').value.trim();
    
    const finalType = vaccineType === 'Other' ? otherType : vaccineType;

    if (!date || !finalType) {
        showMessage('Input Required', 'Date and Vaccine Type are required.');
        return;
    }
    
    const vaccination = {
        type: finalType,
        date: date,
        nextDue: nextDue,
        veterinarian: veterinarian,
        notes: notes
    };
    
    selectedHorse.records.vaccinations.push(vaccination);
    // No need to re-assign selectedHorse to horses[selectedHorse.index] here
    // as selectedHorse is now a direct reference
    saveData();
    loadHorseData();
    closeModal('addVaccinationModal');
    document.getElementById('addVaccinationForm').reset();
    showMessage('Success', 'Vaccination added successfully!');
    console.log('Vaccination added:', vaccination); // Add log for debugging
}

/**
 * Adds a deworming record to the selected horse.
 * @param {Event} e - The form submission event.
 */
function addDeworming(e) {
    e.preventDefault();
    if (selectedHorse === null) {
        showMessage('Error', 'Please select a horse first.');
        return;
    }
    
    const product = document.getElementById('dewormingProduct').value;
    const otherProduct = document.getElementById('otherDewormingProduct').value.trim();
    const date = document.getElementById('dewormingDate').value;
    const nextDue = document.getElementById('dewormingNextDue').value;
    const weight = document.getElementById('dewormingWeight').value;
    const notes = document.getElementById('dewormingNotes').value.trim();

    const finalProduct = product === 'Other' ? otherProduct : product;

    if (!date || !finalProduct) {
        showMessage('Input Required', 'Date and Deworming Product are required.');
        return;
    }
    
    const deworming = {
        product: finalProduct,
        date: date,
        nextDue: nextDue,
        weight: parseFloat(weight) || 0,
        notes: notes
    };
    
    selectedHorse.records.deworming.push(deworming);
    // No need to re-assign selectedHorse to horses[selectedHorse.index] here
    saveData();
    loadHorseData();
    closeModal('addDewormingModal');
    document.getElementById('addDewormingForm').reset();
    showMessage('Success', 'Deworming record added successfully!');
    console.log('Deworming added:', deworming); // Add log for debugging
}

/**
 * Adds a farrier visit record to the selected horse.
 * @param {Event} e - The form submission event.
 */
function addFarrier(e) {
    e.preventDefault();
    if (selectedHorse === null) {
        showMessage('Error', 'Please select a horse first.');
        return;
    }
    
    const service = document.getElementById('farrierService').value;
    const otherService = document.getElementById('otherFarrierService').value.trim();
    const date = document.getElementById('farrierDate').value;
    const nextDue = document.getElementById('farrierNextDue').value;
    const farrier = document.getElementById('farrierName').value.trim();
    const cost = document.getElementById('farrierCost').value;
    const notes = document.getElementById('farrierNotes').value.trim();

    const finalService = service === 'Other' ? otherService : service;

    if (!date || !finalService) {
        showMessage('Input Required', 'Date and Service Type are required.');
        return;
    }
    
    const farrierVisit = {
        service: finalService,
        date: date,
        nextDue: nextDue,
        farrier: farrier,
        cost: parseFloat(cost) || 0,
        notes: notes
    };
    
    selectedHorse.records.farrier.push(farrierVisit);
    // No need to re-assign selectedHorse to horses[selectedHorse.index] here
    saveData();
    loadHorseData();
    closeModal('addFarrierModal');
    document.getElementById('addFarrierForm').reset();
    showMessage('Success', 'Farrier visit added successfully!');
    console.log('Farrier visit added:', farrierVisit); // Add log for debugging
}

/**
 * Adds a veterinary visit record to the selected horse.
 * @param {Event} e - The form submission event.
 */
function addVeterinary(e) {
    e.preventDefault();
    if (selectedHorse === null) {
        showMessage('Error', 'Please select a horse first.');
        return;
    }
    
    try { // Added try-catch for better error reporting
        const visitType = document.getElementById('vetVisitType').value;
        const otherVisitType = document.getElementById('otherVetVisitType').value.trim();
        const date = document.getElementById('vetDate').value;
        const nextDue = document.getElementById('vetNextDue').value;
        const veterinarian = document.getElementById('vetName').value.trim();
        const diagnosis = document.getElementById('vetDiagnosis').value.trim();
        const treatment = document.getElementById('vetTreatment').value.trim();
        const cost = document.getElementById('vetCost').value;
        const notes = document.getElementById('vetNotes').value.trim();

        const finalVisitType = visitType === 'Other' ? otherVisitType : visitType;

        if (!date || !finalVisitType) {
            showMessage('Input Required', 'Date and Visit Type are required.');
            console.error('Validation failed: Date or Visit Type missing.'); // Added for debugging
            return;
        }
        
        const veterinaryVisit = {
            visitType: finalVisitType,
            date: date,
            nextDue: nextDue,
            veterinarian: veterinarian,
            diagnosis: diagnosis,
            treatment: treatment,
            cost: parseFloat(cost) || 0,
            notes: notes
        };
        
        console.log('Attempting to add veterinary visit:', veterinaryVisit); // Added for debugging
        selectedHorse.records.veterinary.push(veterinaryVisit);
        console.log('Current selectedHorse.records.veterinary after push:', selectedHorse.records.veterinary); // Added for debugging

        saveData();
        loadHorseData();
        closeModal('addVeterinaryModal');
        document.getElementById('addVeterinaryForm').reset();
        showMessage('Success', 'Veterinary visit added successfully!');
        console.log('Veterinary visit added and saved:', veterinaryVisit); // Added for debugging
    } catch (error) {
        console.error("Error in addVeterinary function: ", error); // Catch and log any errors
        showMessage('Error', `Failed to add veterinary visit: ${error.message}. Check console for details.`);
    }
}

// --- Reminder System ---

/**
 * Updates and displays upcoming and overdue care reminders.
 */
function updateReminders() {
    const remindersList = document.getElementById('remindersList');
    const upcomingRemindersDiv = document.getElementById('upcomingReminders');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const upcomingDaysThreshold = 30; // Reminders for next 30 days

    let allReminders = [];

    horses.forEach(horse => {
        if (horse.records) {
            Object.keys(horse.records).forEach(recordType => {
                if (Array.isArray(horse.records[recordType])) {
                    horse.records[recordType].forEach(record => {
                        if (record.nextDue) {
                            const dueDate = new Date(record.nextDue);
                            dueDate.setHours(0, 0, 0, 0); // Normalize to start of day

                            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                            if (daysDiff <= upcomingDaysThreshold) { // Include overdue and upcoming within threshold
                                const typeMap = {
                                    'vaccinations': 'Vaccination',
                                    'deworming': 'Deworming',
                                    'farrier': 'Farrier',
                                    'veterinary': 'Vet Visit'
                                };
                                allReminders.push({
                                    horseName: horse.name,
                                    type: typeMap[recordType] || capitalizeFirst(recordType),
                                    item: getReminderItemName(record, recordType),
                                    dueDate: dueDate,
                                    daysDiff: daysDiff,
                                    overdue: daysDiff < 0
                                });
                            }
                        }
                    });
                }
            });
        }
    });

    allReminders.sort((a, b) => a.dueDate - b.dueDate); // Sort by due date

    if (allReminders.length > 0) {
        remindersList.innerHTML = '';
        const fragment = document.createDocumentFragment();
        allReminders.forEach(reminder => {
            const className = reminder.overdue ? 'reminder-item overdue' : 'reminder-item';
            const statusText = reminder.overdue ?
                `Overdue by ${Math.abs(reminder.daysDiff)} days` :
                reminder.daysDiff === 0 ? 'Due today' : `Due in ${reminder.daysDiff} days`;

            const reminderItem = document.createElement('div');
            reminderItem.className = className;
            reminderItem.innerHTML = `
                <div>
                    <strong>${reminder.horseName}</strong> - ${reminder.item} (${reminder.type})
                </div>
                <div style="color: ${reminder.overdue ? '#DC3545' : '#007BFF'};">
                    ${statusText}
                </div>
            `;
            fragment.appendChild(reminderItem);
        });
        remindersList.appendChild(fragment);
        upcomingRemindersDiv.style.display = 'block';
    } else {
        upcomingRemindersDiv.style.display = 'none';
        remindersList.innerHTML = '';
    }
}

/**
 * Gets the specific item name for a reminder (e.g., vaccine type, deworming product).
 * @param {object} record - The record object.
 * @param {string} type - The type of record.
 * @returns {string} The item name.
 */
function getReminderItemName(record, type) {
    switch(type) {
        case 'vaccinations': return record.type;
        case 'deworming': return record.product;
        case 'farrier': return record.service;
        case 'veterinary': return record.visitType;
        default: return '';
    }
}

// --- Tab Switching Logic ---

/**
 * Switches the active tab and loads content for it.
 * @param {string} tabId - The ID of the tab to activate (e.g., 'overview', 'vaccinations').
 */
function switchTab(tabId) {
    // Hide all tab content panes
    document.querySelectorAll('.tab-content').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activate the selected tab content pane
    const selectedPane = document.getElementById(`${tabId}Content`);
    if (selectedPane) {
        selectedPane.classList.add('active');
    } else {
        console.error(`Tab content for ID "${tabId}Content" not found.`);
    }
    
    // Activate the corresponding tab button (for desktop view)
    const selectedTabButton = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (selectedTabButton) {
        selectedTabButton.classList.add('active');
    }

    // Update the mobile dropdown selector
    const mobileTabSelect = document.getElementById('tabSelect');
    if (mobileTabSelect) {
        mobileTabSelect.value = tabId;
    }

    // Load data specific to the tab if a horse is selected
    if (selectedHorse) {
        loadHorseData(); // This function will call the specific loadRecords/loadOverview based on active tab
    } else {
        // If no horse is selected, clear content of all tabs
        document.querySelectorAll('.record-list').forEach(list => list.innerHTML = '<div class="empty-state">Please select a horse to view records.</div>');
        document.getElementById('overviewContent').innerHTML = '<div class="empty-state">Please select a horse to view overview.</div>';
    }
}

// --- Data Import/Export ---

/**
 * Exports all horse data to a JSON file.
 */
function exportData() {
    const dataStr = JSON.stringify(horses, null, 2); // Pretty print JSON
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'horse_health_data.json';
    link.click();
    URL.revokeObjectURL(url); // Clean up the URL object
    showMessage('Export Complete', 'Your horse data has been exported as "horse_health_data.json".');
}

/**
 * Triggers the hidden file input to open the import dialog.
 */
function importData() {
    document.getElementById('importFile').click();
}

/**
 * Handles the file selection for importing data.
 * @param {Event} event - The change event from the file input.
 */
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedHorses = JSON.parse(e.target.result);
            if (Array.isArray(importedHorses)) {
                const confirmed = await showConfirm('Import Data', 'Importing will overwrite existing data. Are you sure?');
                if (!confirmed) {
                    return;
                }

                horses = importedHorses;
                saveData();
                loadHorses();
                updateReminders();
                showMessage('Import Complete', 'Data imported successfully!');
            } else {
                showMessage('Invalid File', 'Invalid file format. Please select a valid JSON file.');
            }
        } catch (error) {
            console.error("Error reading or importing file: ", error);
            showMessage('Error', `Error reading file. Please make sure it's a valid JSON file. Details: ${error.message}`);
        }
    };
    reader.readAsText(file);
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded. Initializing app...');

    // Initial load of horses and reminders
    loadHorses();
    updateReminders();
    
    // Attach form submission listeners
    const addHorseForm = document.getElementById('addHorseForm');
    if (addHorseForm) {
        addHorseForm.addEventListener('submit', addHorse);
    } else {
        // This is a critical error, show a message
        showMessage('Initialization Error', 'Add Horse form not found. The application may not function correctly.');
        console.error('Error: Add Horse form not found');
    }
    
    // Attach event listeners for all other forms and elements
    document.getElementById('addVaccinationForm').addEventListener('submit', addVaccination);
    document.getElementById('addDewormingForm').addEventListener('submit', addDeworming);
    document.getElementById('addFarrierForm').addEventListener('submit', addFarrier);
    document.getElementById('addVeterinaryForm').addEventListener('submit', addVeterinary);
    
    // Attach change listeners for "Other" input toggling
    document.getElementById('vaccineType').addEventListener('change', toggleOtherInput);
    document.getElementById('dewormingProduct').addEventListener('change', toggleOtherInput);
    document.getElementById('farrierService').addEventListener('change', toggleOtherInput);
    document.getElementById('vetVisitType').addEventListener('change', toggleOtherInput);

    // Attach import file listener
    document.getElementById('importFile').addEventListener('change', handleImport);

    // Ensure no service modals are open on load by explicitly closing them
    closeModal('addHorseModal'); // Ensure add horse modal is also closed
    closeModal('addVaccinationModal');
    closeModal('addDewormingModal');
    closeModal('addFarrierModal');
    closeModal('addVeterinaryModal');
    closeModal('messageModal'); // Ensure message modal is closed
    closeModal('confirmModal'); // Ensure confirm modal is closed

    // Set the initial tab to overview
    switchTab('overview');
});
