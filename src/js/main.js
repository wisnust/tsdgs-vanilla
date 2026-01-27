import { appState, getUserInput, saveUserInput, clearUserInput } from './state.js';
import { id, queryAll } from './utils.js';
import { loadAllData } from './data.js';
import { getRecommendations } from './recommender.js';
import { renderServiceTypes, renderRegions, showResults, showForm } from './ui.js';
import { 
    handleAllRegionToggle, 
    handleRegionCheckboxToggle, 
    handleFormSubmit, 
    handleReset,
    selectService,
    toggleServiceDropdown,
    validateForm
} from './events.js';

// Make functions globally available for inline onclick handlers
window.selectService = selectService;
window.toggleServiceDropdown = toggleServiceDropdown;
window.handleAllRegionToggle = handleAllRegionToggle;
window.handleRegionCheckboxToggle = handleRegionCheckboxToggle;
window.renderServiceTypes = renderServiceTypes;
window.appState = appState;

function initialize() {
    // Set year
    const yearElement = id('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Load data
    loadAllData()
        .then(data => {
            appState.data = data;
            window.appData = data; // Make available globally
            appState.isDataLoaded = true;

            // Render initial UI
            renderServiceTypes(data.serviceTypes);
            renderRegions(data.regions);

            // Attach dropdown listener
            const serviceButton = id('serviceButton');
            if (serviceButton) {
                serviceButton.addEventListener('click', toggleServiceDropdown);
            }

            // Restore user input from session storage
            const savedInput = getUserInput();
            if (savedInput) {
                id('service').value = savedInput.serviceType;
                
                // Find and display the saved service label
                const savedService = data.serviceTypes.find(s => s.value === savedInput.serviceType);
                if (savedService) {
                    id('serviceValue').textContent = savedService.label;
                    id('serviceValue').classList.remove('text-muted-foreground');
                }
                
                // Check saved regions
                savedInput.selectedRegions.forEach(regionId => {
                    const button = document.querySelector(`button[value="${regionId}"]`);
                    if (button) {
                        button.setAttribute('aria-checked', 'true');
                        button.setAttribute('data-state', 'checked');
                        button.innerHTML = '<span data-state="checked" class="flex items-center justify-center text-current" style="pointer-events: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4"><path d="M20 6 9 17l-5-5"></path></svg></span>';
                    }
                });

                // If "all" regions was restored, sync the disabled state
                if (savedInput.selectedRegions.includes('on')) {
                    const allCheckbox = id('all');
                    allCheckbox.setAttribute('aria-checked', 'true');
                    allCheckbox.setAttribute('data-state', 'checked');
                    allCheckbox.innerHTML = '<span data-state="checked" class="flex items-center justify-center text-current" style="pointer-events: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4"><path d="M20 6 9 17l-5-5"></path></svg></span>';
                    
                    // Disable individual region checkboxes
                    queryAll('.region-checkbox').forEach(checkbox => {
                        checkbox.setAttribute('aria-checked', 'true');
                        checkbox.setAttribute('data-state', 'checked');
                        checkbox.innerHTML = '<span data-state="checked" class="flex items-center justify-center text-current" style="pointer-events: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4"><path d="M20 6 9 17l-5-5"></path></svg></span>';
                        checkbox.disabled = true;
                    });
                    queryAll('[id^="region-"]').forEach(label => {
                        label.classList.add('opacity-60', 'cursor-not-allowed');
                        label.classList.remove('cursor-pointer');
                    });
                }
            }

            // Attach event listeners
            const form = id('inputForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    handleFormSubmit(e, appState, data, getRecommendations, showResults, saveUserInput);
                });
            }

            const resetBtn = id('resetBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    handleReset(appState, clearUserInput, showForm, saveUserInput);
                });
            }

            // Enable/disable submit button based on service selection
            const serviceSelect = id('service');
            if (serviceSelect) {
                serviceSelect.addEventListener('change', validateForm);
            }
        })
        .catch(error => {
            console.error('Failed to initialize app:', error);
            const main = document.querySelector('main');
            if (main) {
                main.innerHTML = `
                    <div class="text-center py-12">
                        <p class="text-destructive">Failed to load data. Please refresh the page.</p>
                    </div>
                `;
            }
        });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
