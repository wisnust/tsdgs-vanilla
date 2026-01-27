import { formatCurrency, formatCurrencyRange, id, query, queryAll } from './utils.js';

export function renderServiceTypes(serviceTypes) {
    const dropdown = id('serviceDropdown');
    const selectedValue = id('service').value;
    dropdown.innerHTML = '';
    
    serviceTypes.forEach(service => {
        const isSelected = service.value === selectedValue;
        const optionDiv = document.createElement('div');
        optionDiv.className = 'px-1.5 py-1.5 cursor-pointer text-sm flex items-center gap-1 rounded-md transition-colors';
        if (isSelected) {
            optionDiv.classList.add('bg-accent', 'text-accent-foreground');
        }
        optionDiv.dataset.value = service.value;
        optionDiv.addEventListener('click', () => {
            window.selectService(service.value, service.label);
        });
        optionDiv.addEventListener('mouseenter', function() {
            queryAll('#serviceDropdown > div').forEach(el => {
                el.classList.remove('bg-accent', 'text-accent-foreground');
            });
            optionDiv.classList.add('bg-accent', 'text-accent-foreground');
        });
        optionDiv.addEventListener('mouseleave', function() {
            queryAll('#serviceDropdown > div').forEach(el => {
                el.classList.remove('bg-accent', 'text-accent-foreground');
            });
            const currentSelected = id('service').value;
            queryAll('#serviceDropdown > div').forEach(el => {
                if (el.dataset.value === currentSelected) {
                    el.classList.add('bg-accent', 'text-accent-foreground');
                }
            });
        });
        
        // Add checkmark
        const checkmark = document.createElement('span');
        checkmark.className = 'text-sm font-semibold w-4 text-center';
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
    allLabel.className = 'flex items-start space-x-3 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50 cursor-pointer';
    allLabel.innerHTML = `
        <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" class="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" id="all"></button>
        <div class="checkbox-text space-y-1">
            <div class="checkbox-text-main flex items-center gap-2 text-sm font-medium">🌍 All Regions</div>
            <div class="checkbox-text-desc text-xs text-muted-foreground">Compare options across all available regions</div>
        </div>
    `;
    container.appendChild(allLabel);

    // Individual regions
    regions.forEach(region => {
        const regionLabel = document.createElement('label');
        regionLabel.className = 'flex items-start space-x-3 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50 cursor-pointer';
        regionLabel.id = 'region-' + region.id;
        regionLabel.innerHTML = `
            <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="${region.id}" class="peer region-checkbox h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></button>
            <div class="checkbox-text space-y-1">
                <div class="checkbox-text-main flex items-center gap-2 text-sm font-medium">${region.flag} ${region.label}</div>
                <div class="checkbox-text-desc text-xs text-muted-foreground">${region.description}</div>
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
    const ringClass = isTopPick ? 'ring-2' : '';
    const topBadge = isTopPick ? '<div class="absolute top-0 right-0 gradient-accent px-3 py-1 text-xs font-semibold text-accent-foreground rounded-bl-lg">Top Recommendation</div>' : '';
    const shadowClasses = isTopPick 
        ? 'rounded-lg border bg-card text-card-foreground relative overflow-hidden transition-all duration-300 hover:shadow-card-hover ring-2 ring-secondary shadow-lg'
        : 'rounded-lg border bg-card text-card-foreground shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-card-hover shadow-card';

    const div = document.createElement('div');
    div.className = 'animate-slide-up';
    div.style.animationDelay = (rank - 1) * 100 + 'ms';
    div.innerHTML = `
        <div class="${ringClass} ${shadowClasses}">
            ${topBadge}
            
            <div class="flex flex-col space-y-1.5 p-6 pb-3">
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-4xl">${location.flag}</span>
                        <div>
                            <h3 class="font-display text-xl font-bold text-foreground">${location.country}</h3>
                            <p class="text-sm text-muted-foreground flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin h-3 w-3"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg> 
                                ${location.region}
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-success">${location.savingsPercentage}%</div>
                        <div class="text-xs text-muted-foreground">est. savings</div>
                    </div>
                </div>
            </div>

            <div class="card-content p-6 pt-0 space-y-4">
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="rounded-lg bg-muted/50 p-3">
                        <div class="text-muted-foreground text-xs mb-1">Hourly Rate Range</div>
                        <div class="font-semibold text-foreground">$${location.rateRange.min} - $${location.rateRange.max}/hr</div>
                    </div>
                    <div class="rounded-lg bg-muted/50 p-3">
                        <div class="text-muted-foreground text-xs mb-1">English Level</div>
                        <div class="font-semibold text-foreground">${location.englishProficiency}</div>
                    </div>
                    <div class="rounded-lg bg-muted/50 p-3">
                        <div class="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock h-3 w-3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> 
                            Timezone
                        </div>
                        <div class="font-semibold text-foreground">${location.timezone}</div>
                    </div>
                    <div class="rounded-lg bg-muted/50 p-3">
                        <div class="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star h-3 w-3"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg> 
                            Infrastructure
                        </div>
                        <div class="font-semibold text-foreground">
                            ${'★'.repeat(location.infrastructureRating)}${'☆'.repeat(5 - location.infrastructureRating)}
                        </div>
                    </div>
                </div>

                <div>
                    <div class="text-xs font-medium text-muted-foreground mb-2">Why this location:</div>
                    <div class="space-y-1.5">
                        ${location.matchReasons.slice(0, 3).map(reason => `
                            <div class="flex items-start gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check h-4 w-4 text-success shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                                <span class="text-foreground">${reason}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="flex flex-wrap gap-1.5">
                    ${location.specializations.slice(0, 3).map(spec => `
                        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs">${spec}</span>
                    `).join('')}
                </div>

                <div class="border-t border-border pt-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-xs text-muted-foreground">Est. Monthly Cost</div>
                            <div class="font-semibold text-foreground text-sm">
                                ${formatCurrencyRange(location.estimatedMonthlyCostRange.min, location.estimatedMonthlyCostRange.max)}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-down h-3 w-3 text-success"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg> 
                                Est. Annual Savings
                            </div>
                            <div class="font-bold text-success text-sm">
                                ${formatCurrencyRange(location.estimatedAnnualSavingsRange.min, location.estimatedAnnualSavingsRange.max)}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="rounded-lg bg-primary/5 p-3 border border-primary/10">
                    <div class="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield h-4 w-4 text-primary mt-0.5"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                        <p class="text-xs text-muted-foreground leading-relaxed">${location.description}</p>
                    </div>
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

    heroSection.classList.add('hidden');
    inputSection.classList.add('hidden');
    loadingState.classList.add('hidden');
    resultsSection.classList.remove('hidden');

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

    heroSection.classList.remove('hidden');
    inputSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
}
