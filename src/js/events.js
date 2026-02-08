import { id, queryAll } from './utils.js';

export function handleAllRegionToggle(e) {
    e.preventDefault();
    const allCheckbox = id('all');
    const isChecked = allCheckbox.getAttribute('data-state') === 'checked';
    
    allCheckbox.setAttribute('aria-checked', !isChecked);
    allCheckbox.setAttribute('data-state', isChecked ? 'unchecked' : 'checked');
    
    if (!isChecked) {
        allCheckbox.innerHTML = '<span data-state="checked" class="checkbox__checkmark" style="pointer-events: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="checkbox__checkmark-icon"><path d="M20 6 9 17l-5-5"></path></svg></span>';
    } else {
        allCheckbox.innerHTML = '';
    }
    
    updateRegionToggleState();
}

export function handleRegionCheckboxToggle(e) {
    e.preventDefault();
    const checkbox = e.target;
    const isChecked = checkbox.getAttribute('data-state') === 'checked';
    
    checkbox.setAttribute('aria-checked', !isChecked);
    checkbox.setAttribute('data-state', isChecked ? 'unchecked' : 'checked');
    
    if (!isChecked) {
        checkbox.innerHTML = '<span data-state="checked" class="checkbox__checkmark" style="pointer-events: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="checkbox__checkmark-icon"><path d="M20 6 9 17l-5-5"></path></svg></span>';
    } else {
        checkbox.innerHTML = '';
    }
    
    updateRegionToggleState();
}

function updateRegionToggleState() {
    const allCheckbox = id('all');
    const regionCheckboxes = queryAll('.region-checkbox');
    const regionLabels = queryAll('[id^="region-"]');

    if (allCheckbox.getAttribute('data-state') === 'checked') {
        regionCheckboxes.forEach(checkbox => {
            checkbox.setAttribute('aria-checked', 'true');
            checkbox.setAttribute('data-state', 'checked');
            checkbox.innerHTML = '<span data-state="checked" class="checkbox__checkmark" style="pointer-events: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="checkbox__checkmark-icon"><path d="M20 6 9 17l-5-5"></path></svg></span>';
            checkbox.disabled = true;
        });
        regionLabels.forEach(label => {
            label.classList.add('checkbox--disabled');
        });
    } else {
        regionCheckboxes.forEach(checkbox => {
            checkbox.disabled = false;
        });
        regionLabels.forEach(label => {
            label.classList.remove('checkbox--disabled');
        });
    }
}

export function handleFormSubmit(e, appState, appData, getRecommendations, showResults, saveUserInput, showLoading) {
    e.preventDefault();
    
    const agents = parseInt(id('agents').value) || 50;
    const serviceType = id('service').value;
    const selectedRegions = Array.from(queryAll('.region-checkbox[data-state="checked"]')).map(el => el.value);

    if (!serviceType) {
        alert('Please select a service type');
        return;
    }

    const input = {
        agentCount: agents,
        serviceType,
        selectedRegions
    };

    saveUserInput(input);
    appState.inputData = input;

    if (showLoading) {
        showLoading();
    }
    
    appState.isLoading = true;
    const submitBtn = id('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing...';

    setTimeout(() => {
        const recommendations = getRecommendations(input, appData);
        appState.recommendations = recommendations;
        showResults(recommendations, input, appData);
    }, 800);
}

export function handleReset(appState, clearUserInput, showForm, saveUserInput) {
    clearUserInput();
    showForm();
    
    appState.isLoading = false;
    const submitBtn = id('submitBtn');
    submitBtn.textContent = 'Get Recommendations';
    submitBtn.disabled = true;
    
    id('agents').value = '50';
    id('service').value = '';
    id('serviceValue').textContent = 'Select a service type';
    id('serviceValue').classList.add('form-quiz__dropdown-value');
    const dropdown = id('serviceDropdown');
    dropdown.style.display = 'none';
    
    queryAll('.region-checkbox, #all').forEach(checkbox => {
        checkbox.setAttribute('aria-checked', 'false');
        checkbox.setAttribute('data-state', 'unchecked');
        checkbox.innerHTML = '';
        checkbox.disabled = false;
    });
    
    queryAll('[id^="region-"]').forEach(label => {
        label.classList.remove('checkbox--disabled');
    });
}

export function selectService(value, label) {
    id('service').value = value;
    id('serviceValue').textContent = label;
    id('serviceValue').classList.remove('form-quiz__dropdown-value');
    id('serviceDropdown').style.display = 'none';
    
    window.renderServiceTypes(window.appData.serviceTypes);
    validateForm();
}

export function toggleServiceDropdown() {
    const dropdown = id('serviceDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

export function validateForm() {
    const serviceValue = id('service').value;
    const submitBtn = id('submitBtn');
    if (serviceValue) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

document.addEventListener('click', function(event) {
    const serviceButton = id('serviceButton');
    const serviceDropdown = id('serviceDropdown');
    if (serviceButton && serviceDropdown && 
        !serviceButton.contains(event.target) &&
        !serviceDropdown.contains(event.target)) {
        serviceDropdown.style.display = 'none';
    }
});
