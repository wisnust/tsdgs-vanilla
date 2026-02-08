import { formatCurrency, formatCurrencyRange, id, query, queryAll } from './utils.js';

export function renderServiceTypes(serviceTypes) {
    const dropdown = id('serviceDropdown');
    const selectedValue = id('service').value;
    dropdown.innerHTML = '';
    
    serviceTypes.forEach(service => {
        const isSelected = service.value === selectedValue;
        const optionDiv = document.createElement('div');
        optionDiv.className = isSelected ? 'form-quiz__dropdown-option form-quiz__dropdown-option--selected' : 'form-quiz__dropdown-option';
        optionDiv.dataset.value = service.value;
        optionDiv.addEventListener('click', () => {
            window.selectService(service.value, service.label);
        });
        optionDiv.addEventListener('mouseenter', function() {
            queryAll('#serviceDropdown > div').forEach(el => {
                el.classList.remove('form-quiz__dropdown-option--selected');
            });
            optionDiv.classList.add('form-quiz__dropdown-option--selected');
        });
        optionDiv.addEventListener('mouseleave', function() {
            queryAll('#serviceDropdown > div').forEach(el => {
                el.classList.remove('form-quiz__dropdown-option--selected');
            });
            const currentSelected = id('service').value;
            queryAll('#serviceDropdown > div').forEach(el => {
                if (el.dataset.value === currentSelected) {
                    el.classList.add('form-quiz__dropdown-option--selected');
                }
            });
        });
        
        // Add checkmark
        const checkmark = document.createElement('span');
        checkmark.className = 'form-quiz__dropdown-option-checkmark';
        checkmark.textContent = isSelected ? '✓' : '';
        optionDiv.appendChild(checkmark);
        
        // Add label
        const label = document.createElement('span');
        label.textContent = service.label;
        optionDiv.appendChild(label);
        
        dropdown.appendChild(optionDiv);
    });
}

export function renderRegions(regions) {
    const container = id('regionsContainer');
    container.innerHTML = '';

    // All Regions option
    const allLabel = document.createElement('label');
    allLabel.className = 'checkbox';
    allLabel.innerHTML = `
        <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" class="checkbox__input" id="all"></button>
        <div class="checkbox__content">
            <div class="checkbox__label">🌍 All Regions</div>
            <div class="checkbox__description">Compare options across all available regions</div>
        </div>
    `;
    container.appendChild(allLabel);

    // Individual regions
    regions.forEach(region => {
        const regionLabel = document.createElement('label');
        regionLabel.className = 'checkbox';
        regionLabel.id = 'region-' + region.id;
        regionLabel.innerHTML = `
            <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="${region.id}" class="checkbox__input region-checkbox"></button>
            <div class="checkbox__content">
                <div class="checkbox__label">${region.flag} ${region.label}</div>
                <div class="checkbox__description">${region.description}</div>
            </div>
        `;
        container.appendChild(regionLabel);
    });

    // Attach event listeners
    const allCheckbox = id('all');
    allCheckbox.addEventListener('click', window.handleAllRegionToggle);
    
    queryAll('.region-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', window.handleRegionCheckboxToggle);
    });
}

export function renderLocationCard(location, rank) {
    const isTopPick = rank === 1;
    const topBadge = isTopPick ? '<div class="location-card__badge">Top Recommendation</div>' : '';
    const cardClass = isTopPick 
        ? 'location-card location-card--featured'
        : 'location-card';

    const div = document.createElement('div');
    div.className = 'location-card-wrapper';
    div.style.animationDelay = (rank - 1) * 100 + 'ms';
    div.innerHTML = `
        <div class="${cardClass}">
            ${topBadge}
            
            <div class="location-card__header">
                <div class="location-card__info">
                    <span class="location-card__flag">${location.flag}</span>
                    <div class="location-card__details">
                        <h3 class="location-card__title">${location.country}</h3>
                        <p class="location-card__region">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg> 
                            ${location.region}
                        </p>
                    </div>
                </div>
                <div class="location-card__savings">
                    <div class="location-card__savings-value">${location.savingsPercentage}%</div>
                    <div class="location-card__savings-label">est. savings</div>
                </div>
            </div>

            <div class="location-card__content">

                <div class="location-card__metrics">
                    <div class="location-card__rate">
                        <div class="location-card__rate-label">Hourly Rate Range</div>
                        <div class="location-card__rate-value">$${location.rateRange.min} - $${location.rateRange.max}/hr</div>
                    </div>
                    <div class="location-card__metric">
                        <div class="location-card__metric-label">English Level</div>
                        <div class="location-card__metric-value">${location.englishProficiency}</div>
                    </div>
                    <div class="location-card__metric">
                        <div class="location-card__metric-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock h-3 w-3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            Timezone
                        </div>
                        <div class="location-card__metric-value">${location.timezone}</div>
                    </div>
                    <div class="location-card__metric">
                        <div class="location-card__metric-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star h-3 w-3"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
                            Infrastructure
                        </div>
                        <div class="location-card__metric-value">
                            ${'★'.repeat(location.infrastructureRating)}${'☆'.repeat(5 - location.infrastructureRating)}
                        </div>
                    </div>
                </div>

                <div class="location-card__strengths">
                    <div class="location-card__strengths-title">Why this location:</div>
                    <ul class="location-card__strengths-list">
                        ${location.matchReasons.slice(0, 3).map(reason => `
                            <li class="location-card__strength-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="location-card__strength-icon"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                                ${reason}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="location-card__tags">
                    ${location.specializations.slice(0, 3).map(spec => `
                        <span class="location-card__tag">${spec}</span>
                    `).join('')}
                </div>

                <div class="location-card__cost">
                    <div class="location-card__cost-item">
                        <div class="location-card__cost-label">Est. Monthly Cost</div>
                        <div class="location-card__cost-value">
                            ${formatCurrencyRange(location.estimatedMonthlyCostRange.min, location.estimatedMonthlyCostRange.max)}
                        </div>
                    </div>
                    <div class="location-card__cost-item location-card__cost-item--savings">
                        <div class="location-card__cost-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="location-card__cost-icon"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg> 
                            Est. Annual Savings
                        </div>
                        <div class="location-card__cost-value location-card__cost-value--savings">
                            ${formatCurrencyRange(location.estimatedAnnualSavingsRange.min, location.estimatedAnnualSavingsRange.max)}
                        </div>
                    </div>
                </div>

                <div class="location-card__description">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                    <p class="location-card__description-text">${location.description}</p>
                </div>
            </div>
        </div>
    `;

    return div;
}

export function showResults(recommendations, inputData, appData) {
    const heroSection = id('heroSection');
    const inputSection = id('inputSection');
    const resultsSection = id('resultsSection');
    const loadingState = id('loadingState');

    heroSection.style.display = 'none';
    inputSection.style.display = 'none';
    loadingState.classList.remove('loading--visible');
    resultsSection.classList.add('results--visible');

    // Render recommendations
    const container = id('recommendationsContainer');
    container.innerHTML = '';
    recommendations.forEach((location, index) => {
        container.appendChild(renderLocationCard(location, index + 1));
    });

    // Update ROI calculator
    const usRate = appData.usHourlyRates[inputData.serviceType] || appData.usHourlyRates['customer-service'];
    const monthlyHours = 173;
    const serviceLabel = (appData.serviceTypes.find(s => s.value === inputData.serviceType)?.label) || inputData.serviceType;
    
    const inHouseMonthly = usRate.midpoint * monthlyHours * inputData.agentCount;
    const inHouseAnnual = inHouseMonthly * 12;
    
    const outsourcedMonthlyMin = recommendations[0].rateRange.min * monthlyHours * inputData.agentCount;
    const outsourcedMonthlyMax = recommendations[0].rateRange.max * monthlyHours * inputData.agentCount;
    const outsourcedMonthlyMidpoint = recommendations[0].rateMidpoint * monthlyHours * inputData.agentCount;
    const outsourcedAnnualMidpoint = outsourcedMonthlyMidpoint * 12;
    
    const benefitsSavings = Math.round(inHouseAnnual * 0.25);
    const infrastructureSavings = inputData.agentCount * 500 * 12;
    const annualSavings = inHouseAnnual - outsourcedAnnualMidpoint;
    const totalPotentialSavings = annualSavings + benefitsSavings + infrastructureSavings;
    const savingsPercent = Math.round((annualSavings / inHouseAnnual) * 100);

    // Update ROI elements
    id('agentCountDisplay').textContent = inputData.agentCount;
    id('serviceTypeDisplay').textContent = serviceLabel;
    id('usRate').textContent = '$' + usRate.min + ' - $' + usRate.max + '/hr';
    id('inHouseMonthly').textContent = '~' + formatCurrency(inHouseMonthly);
    id('inHouseBenefits').textContent = formatCurrency(inHouseMonthly * 0.25);
    id('inHouseInfra').textContent = formatCurrency(inputData.agentCount * 500);
    id('inHouseTotal').textContent = '~' + formatCurrency(inHouseAnnual + benefitsSavings + infrastructureSavings);
    
    id('outsourcedCountry').textContent = recommendations[0].country;
    id('outsourcedRate').textContent = '$' + recommendations[0].rateRange.min + ' - $' + recommendations[0].rateRange.max + '/hr';
    id('outsourcedMonthly').textContent = formatCurrencyRange(outsourcedMonthlyMin, outsourcedMonthlyMax);
    id('outsourcedTotal').textContent = formatCurrencyRange(outsourcedMonthlyMin * 12, outsourcedMonthlyMax * 12);
    
    // Savings breakdown
    id('totalSavingsDisplay').textContent = '~' + formatCurrency(totalPotentialSavings);
    id('savingsPercentDisplay').textContent = savingsPercent + '%';
    id('laborSavingsDisplay').textContent = '~' + formatCurrency(annualSavings);
    id('benefitsSavingsDisplay').textContent = '~' + formatCurrency(benefitsSavings);
    id('infrastructureSavingsDisplay').textContent = '~' + formatCurrency(infrastructureSavings);
}

export function showForm() {
    const heroSection = id('heroSection');
    const inputSection = id('inputSection');
    const resultsSection = id('resultsSection');

    heroSection.style.display = 'block';
    inputSection.style.display = 'block';
    resultsSection.classList.remove('results--visible');
}

export function showLoading() {
    const heroSection = id('heroSection');
    const inputSection = id('inputSection');
    const resultsSection = id('resultsSection');
    const loadingState = id('loadingState');

    heroSection.style.display = 'none';
    inputSection.style.display = 'none';
    resultsSection.classList.remove('results--visible');
    loadingState.classList.add('loading--visible');
}
