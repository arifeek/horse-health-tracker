        // Data storage
        let horses = JSON.parse(localStorage.getItem('horses')) || [];
        let selectedHorse = null;

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            loadHorses();
            updateReminders();
            
            const addHorseForm = document.getElementById('addHorseForm');
            if (addHorseForm) {
                addHorseForm.addEventListener('submit', addHorse);
            } else {
                alert('Error: Add Horse form not found');
            }
            
            document.getElementById('addVaccinationForm').addEventListener('submit', addVaccination);
            document.getElementById('addDewormingForm').addEventListener('submit', addDeworming);
            document.getElementById('addFarrierForm').addEventListener('submit', addFarrier);
            document.getElementById('addVeterinaryForm').addEventListener('submit', addVeterinary);
            
            // Prevent calendar from appearing on service type dropdowns
            const serviceSelects = [
                'vaccineType',
                'dewormingProduct',
                'farrierService',
                'vetVisitType'
            ];
            serviceSelects.forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    ['mousedown', 'touchstart'].forEach(eventType => {
                        select.addEventListener(eventType, (e) => {
                            e.preventDefault();
                            select.focus();
                        });
                    });
                    select.addEventListener('change', toggleOtherInput);
                }
            });
            
            document.getElementById('importFile').addEventListener('change', handleImport);
        });

        function loadHorses() {
            const horseSelect = document.getElementById('horseSelect');
            horseSelect.innerHTML = '<option value="">-- Select a horse --</option>';
            
            horses.forEach((horse, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = horse.name;
                horseSelect.appendChild(option);
            });
        }

        function addHorse(e) {
            e.preventDefault();
            
            const name = document.getElementById('horseName').value;
            if (!name) {
                alert('Horse name is required');
                return;
            }
            
            const breed = document.getElementById('horseBreed').value;
            const age = document.getElementById('horseAge').value;
            const colour = document.getElementById('horseColour').value;
            
            const horse = {
                name: name,
                breed: breed || 'Not specified',
                age: age || 'Not specified',
                colour: colour || 'Not specified',
                records: {}
            };
            
            horses.push(horse);
            saveData();
            loadHorses();
            closeModal('addHorseModal');
            document.getElementById('addHorseForm').reset();
            alert('Horse added successfully!');
        }

        function switchHorse() {
            const horseSelect = document.getElementById('horseSelect');
            const horseIndex = horseSelect.value;
            
            if (horseIndex === '') {
                selectedHorse = null;
                document.getElementById('horseContent').style.display = 'none';
                return;
            }
            
            selectedHorse = horses[horseIndex];
            document.getElementById('horseContent').style.display = 'block';
            document.getElementById('tabSelect').value = 'overview';
            switchTab('overview');
        }

        function loadHorseData() {
            if (!selectedHorse) return;
            
            loadOverview();
            loadRecords('vaccinations', 'vaccinationRecords');
            loadRecords('deworming', 'dewormingRecords');
            loadRecords('farrier', 'farrierRecords');
            loadRecords('veterinary', 'veterinaryRecords');
        }

        function loadOverview() {
            const overviewContent = document.getElementById('overviewContent');
            const records = selectedHorse.records || {};
            
            let html = `
                <div class="record-item">
                    <h3>${selectedHorse.name}</h3>
                    <p><strong>Breed:</strong> ${selectedHorse.breed || 'Not specified'}</p>
                    <p><strong>Age:</strong> ${selectedHorse.age || 'Not specified'}</p>
                    <p><strong>Colour:</strong> ${selectedHorse.colour || 'Not specified'}</p>
                </div>
            `;
            
            const allRecords = [];
            Object.keys(records).forEach(type => {
                if (records[type] && records[type].length > 0) {
                    records[type].forEach(record => {
                        allRecords.push({...record, type: type});
                    });
                }
            });
            
            allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (allRecords.length > 0) {
                html += '<h3>Recent Activity</h3>';
                allRecords.slice(0, 5).forEach(record => {
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

        function loadRecords(type, containerId) {
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
                            <button class="btn btn-danger" onclick="deleteRecord('${type}', ${index})" style="margin-left: 0.5rem; padding: 0.2rem 0.4rem; font-size: 0.7rem;" aria-label="Delete this record">Delete</button>
                        </div>
                    </div>
                    <div class="record-details">
                        ${getRecordDetails(record, type)}
                    </div>
                `;
                fragment.appendChild(recordDiv);
            });
            
            container.innerHTML = '';
            container.appendChild(fragment);
        }

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

        function getRecordDetails(record, type) {
            let details = '';
            
            switch(type) {
                case 'vaccinations':
                    details = '';
                    if (record.veterinarian) details += `<p><strong>Veterinarian:</strong> ${record.veterinarian}</p>`;
                    if (record.nextDue) details += `<p><strong>Next Due:</strong> ${formatDate(record.nextDue)}</p>`;
                    if (record.notes) details += `<p><strong>Notes:</strong> ${record.notes}</p>`;
                    break;
                case 'deworming':
                    details = '';
                    if (record.weight) details += `<p><strong>Weight:</strong> ${record.weight} kg</p>`;
                    if (record.nextDue) details += `<p><strong>Next Due:</strong> ${formatDate(record.nextDue)}</p>`;
                    if (record.notes) details += `<p><strong>Notes:</strong> ${record.notes}</p>`;
                    break;
                case 'farrier':
                    details = '';
                    if (record.farrier) details += `<p><strong>Farrier:</strong> ${record.farrier}</p>`;
                    if (record.cost) details += `<p><strong>Cost:</strong> $${parseFloat(record.cost).toFixed(2)}</p>`;
                    if (record.nextDue) details += `<p><strong>Next Due:</strong> ${formatDate(record.nextDue)}</p>`;
                    if (record.notes) details += `<p><strong>Notes:</strong> ${record.notes}</p>`;
                    break;
                case 'veterinary':
                    details = '';
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

        function getRecordSummary(record) {
            switch(record.type) {
                case 'vaccinations':
                    return `${record.type || 'Vaccination'} vaccination`;
                case 'deworming':
                    return `${record.product || 'Deworming'} deworming`;
                case 'farrier':
                    return `${record.service || 'Farrier visit'} - ${record.farrier || 'Farrier'}`;
                case 'veterinary':
                    return `${record.visitType || 'Veterinary visit'} - ${record.veterinarian || 'Vet visit'}`;
                default:
                    return 'Health record';
            }
        }

        function addVaccination(e) {
            e.preventDefault();
            
            if (!selectedHorse) {
                alert('Please select a horse first');
                return;
            }
            
            const vaccineType = document.getElementById('vaccineType').value;
            const otherType = document.getElementById('otherVaccineInput').value;
            const date = document.getElementById('vaccineDate').value;
            const nextDue = document.getElementById('vaccineNextDue').value;
            const veterinarian = document.getElementById('vaccineVet').value;
            const notes = document.getElementById('vaccineNotes').value;
            
            const vaccination = {
                type: vaccineType === 'Other' ? otherType : vaccineType,
                date: date,
                nextDue: nextDue,
                veterinarian: veterinarian,
                notes: notes
            };
            
            if (!selectedHorse.records) selectedHorse.records = {};
            if (!selectedHorse.records.vaccinations) selectedHorse.records.vaccinations = [];
            
            selectedHorse.records.vaccinations.push(vaccination);
            saveData();
            loadHorseData();
            updateReminders();
            closeModal('addVaccinationModal');
            document.getElementById('addVaccinationForm').reset();
            alert('Vaccination added successfully!');
        }

        function addDeworming(e) {
            e.preventDefault();
            
            if (!selectedHorse) {
                alert('Please select a horse first');
                return;
            }
            
            const product = document.getElementById('dewormingProduct').value;
            const otherProduct = document.getElementById('otherDewormingInput').value;
            const date = document.getElementById('dewormingDate').value;
            const nextDue = document.getElementById('dewormingNextDue').value;
            const weight = document.getElementById('dewormingWeight').value;
            const notes = document.getElementById('dewormingNotes').value;
            
            const deworming = {
                product: product === 'Other' ? otherProduct : product,
                date: date,
                nextDue: nextDue,
                weight: weight,
                notes: notes
            };
            
            if (!selectedHorse.records) selectedHorse.records = {};
            if (!selectedHorse.records.deworming) selectedHorse.records.deworming = [];
            
            selectedHorse.records.deworming.push(deworming);
            saveData();
            loadHorseData();
            updateReminders();
            closeModal('addDewormingModal');
            document.getElementById('addDewormingForm').reset();
            alert('Deworming record added successfully!');
        }

        function addFarrier(e) {
            e.preventDefault();
            
            if (!selectedHorse) {
                alert('Please select a horse first');
                return;
            }
            
            const service = document.getElementById('farrierService').value;
            const otherService = document.getElementById('otherFarrierInput').value;
            const date = document.getElementById('farrierDate').value;
            const nextDue = document.getElementById('farrierNextDue').value;
            const farrier = document.getElementById('farrierName').value;
            const cost = document.getElementById('farrierCost').value;
            const notes = document.getElementById('farrierNotes').value;
            
            const farrierVisit = {
                service: service === 'Other' ? otherService : service,
                date: date,
                nextDue: nextDue,
                farrier: farrier,
                cost: cost,
                notes: notes
            };
            
            if (!selectedHorse.records) selectedHorse.records = {};
            if (!selectedHorse.records.farrier) selectedHorse.records.farrier = [];
            
            selectedHorse.records.farrier.push(farrierVisit);
            saveData();
            loadHorseData();
            updateReminders();
            closeModal('addFarrierModal');
            document.getElementById('addFarrierForm').reset();
            alert('Farrier visit added successfully!');
        }

        function addVeterinary(e) {
            e.preventDefault();
            
            if (!selectedHorse) {
                alert('Please select a horse first');
                return;
            }
            
            const visitType = document.getElementById('vetVisitType').value;
            const otherVisitType = document.getElementById('otherVetInput').value;
            const date = document.getElementById('vetDate').value;
            const nextDue = document.getElementById('vetNextDue').value;
            const veterinarian = document.getElementById('vetName').value;
            const diagnosis = document.getElementById('vetDiagnosis').value;
            const treatment = document.getElementById('vetTreatment').value;
            const cost = document.getElementById('vetCost').value;
            const notes = document.getElementById('vetNotes').value;
            
            const veterinaryVisit = {
                visitType: visitType === 'Other' ? otherVisitType : visitType,
                date: date,
                nextDue: nextDue,
                veterinarian: veterinarian,
                diagnosis: diagnosis,
                treatment: treatment,
                cost: cost,
                notes: notes
            };
            
            if (!selectedHorse.records) selectedHorse.records = {};
            if (!selectedHorse.records.veterinary) selectedHorse.records.veterinary = [];
            
            selectedHorse.records.veterinary.push(veterinaryVisit);
            saveData();
            loadHorseData();
            updateReminders();
            closeModal('addVeterinaryModal');
            document.getElementById('addVeterinaryForm').reset();
            alert('Veterinary visit added successfully!');
        }

        function deleteRecord(type, index) {
            if (confirm('Are you sure you want to delete this record?')) {
                selectedHorse.records[type].splice(index, 1);
                saveData();
                loadHorseData();
                updateReminders();
                alert('Record deleted successfully!');
            }
        }

        function updateReminders() {
            const remindersList = document.getElementById('remindersList');
            const remindersContainer = document.getElementById('upcomingReminders');
            const today = new Date();
            const upcomingDays = 30;
            
            let allReminders = [];
            
            horses.forEach(horse => {
                if (!horse.records) return;
                
                Object.keys(horse.records).forEach(type => {
                    horse.records[type].forEach(record => {
                        if (record.nextDue) {
                            const dueDate = new Date(record.nextDue);
                            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                            
                            if (daysDiff <= upcomingDays) {
                                allReminders.push({
                                    horse: horse.name,
                                    type: type,
                                    title: getRecordTitle(record, type),
                                    dueDate: dueDate,
                                    daysDiff: daysDiff,
                                    overdue: daysDiff < 0
                                });
                            }
                        }
                    });
                });
            });
            
            allReminders.sort((a, b) => a.dueDate - b.dueDate);
            
            if (allReminders.length === 0) {
                remindersContainer.style.display = 'none';
                return;
            }
            
            remindersContainer.style.display = 'block';
            
            let html = '';
            allReminders.forEach(reminder => {
                const className = reminder.overdue ? 'reminder-item overdue' : 'reminder-item';
                const statusText = reminder.overdue ? 
                    `Overdue by ${Math.abs(reminder.daysDiff)} days` : 
                    reminder.daysDiff === 0 ? 'Due today' : `Due in ${reminder.daysDiff} days`;
                
                html += `
                    <div class="${className}">
                        <div>
                            <strong>${reminder.horse}</strong> - ${reminder.title}
                        </div>
                        <div style="color: ${reminder.overdue ? '#721c24' : '#856404'};">
                            ${statusText}
                        </div>
                    </div>
                `;
            });
            
            remindersList.innerHTML = html;
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            const selectedPane = document.getElementById(tabName);
            if (selectedPane) {
                selectedPane.classList.add('active');
            }
            
            const selectedTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }
            
            const tabSelect = document.getElementById('tabSelect');
            if (tabSelect) {
                tabSelect.value = tabName;
            }
            
            loadHorseData();
        }

        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
            } else {
                alert(`Error: Modal ${modalId} not found`);
            }
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            } else {
                alert(`Error: Modal ${modalId} not found`);
            }
        }

        function toggleOtherInput(event) {
            const select = event.target;
            const otherInputId = select.id.replace(/Type|Product|Service/i, '') + 
                (select.id.includes('vaccine') ? 'Type' : 
                 select.id.includes('deworming') ? 'Product' : 
                 select.id.includes('farrier') ? 'Service' : 'VisitType');
            const otherDiv = document.getElementById('other' + otherInputId.charAt(0).toUpperCase() + otherInputId.slice(1));
            
            if (select.value === 'Other') {
                otherDiv.style.display = 'block';
            } else {
                otherDiv.style.display = 'none';
            }
        }

        function saveData() {
            try {
                localStorage.setItem('horses', JSON.stringify(horses));
            } catch (e) {
                alert('Error saving data to localStorage: ' + e.message);
            }
        }

        function exportData() {
            const dataStr = JSON.stringify(horses, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'horse_health_data.json';
            link.click();
            URL.revokeObjectURL(url);
        }

        function importData() {
            document.getElementById('importFile').click();
        }

        function handleImport(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedHorses = JSON.parse(e.target.result);
                    if (Array.isArray(importedHorses)) {
                        horses = importedHorses;
                        saveData();
                        loadHorses();
                        updateReminders();
                        alert('Data imported successfully!');
                    } else {
                        alert('Invalid file format. Please select a valid JSON file.');
                    }
                } catch (error) {
                    alert('Error reading file. Please make sure it\'s a valid JSON file.');
                }
            };
            reader.readAsText(file);
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-AU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        }

        function capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        };
