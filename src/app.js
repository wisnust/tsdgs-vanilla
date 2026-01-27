// Data storage
const appState = {
    data: null,
    isDataLoaded: false,
    recommendations: null,
    inputData: null,
    isLoading: false
};

// Format currency helper
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatCurrencyRange(min, max) {
    return formatCurrency(min) + ' - ' + formatCurrency(max);
}

// Data loading
function loadAllData() {
    return $.when(
        $.getJSON('./data/locations.json'),
        $.getJSON('./data/service-types.json'),
        $.getJSON('./data/us-hourly-rates.json'),
        $.getJSON('./data/service-location-strengths.json'),
        $.getJSON('./data/regions.json')
    ).done(function(locationsData, serviceTypesData, usHourlyRatesData, serviceLocationStrengthsData, regionsData) {
        appState.data = {
            locations: locationsData[0],
            serviceTypes: serviceTypesData[0],
            usHourlyRates: usHourlyRatesData[0],
            serviceLocationStrengths: serviceLocationStrengthsData[0],
            regions: regionsData[0]
        };
        appState.isDataLoaded = true;
    }).fail(function() {
        console.error('Failed to load data');
        throw new Error('Failed to load data');
    });
}

// Session Storage helpers
function getUserInput() {
    try {
        const saved = sessionStorage.getItem('userInput');
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

function saveUserInput(input) {
    try {
        sessionStorage.setItem('outsourcing-tool-user-input', JSON.stringify(input));
    } catch (error) {
        console.error('Failed to save user input:', error);
    }
}

function clearUserInput() {
    try {
        sessionStorage.removeItem('outsourcing-tool-user-input');
    } catch (error) {
        console.error('Failed to clear user input:', error);
    }
}

// Recommendation engine
function getRecommendations(input, data) {
    const { locations, serviceTypes, usHourlyRates, serviceLocationStrengths, regions } = data;
    
    const monthlyHours = 173;
    const usRate = usHourlyRates[input.serviceType] || usHourlyRates['customer-service'];
    const usMonthlyMidpoint = usRate.midpoint * monthlyHours * input.agentCount;

    // Map selected regions to location IDs
    let allowedLocationIds = [];
    if (input.selectedRegions.length === 0 || input.selectedRegions.includes('all')) {
        allowedLocationIds = locations.map(loc => loc.id);
    } else {
        input.selectedRegions.forEach(regionId => {
            const region = regions.find(r => r.id === regionId);
            if (region) {
                allowedLocationIds.push(...region.locationIds);
            }
        });
    }

    // Filter and score locations
    const filteredLocations = locations.filter(loc => allowedLocationIds.includes(loc.id));

    const scored = filteredLocations.map(location => {
        let score = 50;
        const matchReasons = [];

        // Service type strength matching
        const strengthLocations = serviceLocationStrengths[input.serviceType] || [];
        if (strengthLocations.includes(location.id)) {
            score += 25;
            const serviceLabel = serviceTypes.find(s => s.value === input.serviceType)?.label || input.serviceType;
            matchReasons.push('Top performer for ' + serviceLabel);
        }

        // English proficiency bonus
        if (location.englishProficiency === 'Native') {
            score += 20;
            matchReasons.push('Native English speakers');
        } else if (location.englishProficiency === 'High') {
            score += 15;
            matchReasons.push('High English proficiency');
        }

        // Cost effectiveness
        const rateMidpoint = (location.rateRange.min + location.rateRange.max) / 2;
        const costScore = Math.max(0, 25 - rateMidpoint);
        score += costScore;
        
        const savingsVsUS = Math.round(((usRate.midpoint - rateMidpoint) / usRate.midpoint) * 100);
        if (savingsVsUS >= 70) {
            matchReasons.push(savingsVsUS + '% cost savings vs US rates');
        } else if (savingsVsUS >= 50) {
            matchReasons.push(savingsVsUS + '% cost savings vs US rates');
        }

        // Infrastructure rating bonus
        score += location.infrastructureRating * 3;

        // Nearshore bonus
        if ((input.serviceType === 'sales' || input.serviceType === 'customer-service') &&
            ['Latin America', 'Central America', 'Caribbean'].includes(location.region)) {
            score += 10;
            if (!matchReasons.some(r => r.includes('time zone'))) {
                matchReasons.push('Nearshore location with US timezone alignment');
            }
        }

        // Add top pros as match reasons if we don't have enough
        if (matchReasons.length < 4) {
            location.pros.slice(0, 4 - matchReasons.length).forEach(pro => {
                if (!matchReasons.includes(pro)) {
                    matchReasons.push(pro);
                }
            });
        }

        // Calculate costs
        const monthlyMin = location.rateRange.min * monthlyHours * input.agentCount;
        const monthlyMax = location.rateRange.max * monthlyHours * input.agentCount;
        const monthlyMidpoint = rateMidpoint * monthlyHours * input.agentCount;
        const annualMidpoint = monthlyMidpoint * 12;
        const savingsPercentage = Math.round(((usMonthlyMidpoint - monthlyMidpoint) / usMonthlyMidpoint) * 100);

        return $.extend({}, location, {
            score,
            matchReasons,
            estimatedMonthlyCostRange: { min: monthlyMin, max: monthlyMax },
            estimatedAnnualSavingsRange: {
                min: (usMonthlyMidpoint * 12) - (monthlyMax * 12),
                max: (usMonthlyMidpoint * 12) - (monthlyMin * 12)
            },
            savingsPercentage,
            rateMidpoint
        });
    });

    // Sort by score (highest first)
    return scored.sort((a, b) => b.score - a.score).slice(0, 4);
}

// UI Rendering functions

function renderServiceTypes(serviceTypes) {
    const $dropdown = $('#serviceDropdown');
    const selectedValue = $('#service').val();
    $dropdown.empty();
    
    serviceTypes.forEach(service => {
        const isSelected = service.value === selectedValue;
        const $option = $('<div>')
            .addClass('px-1.5 py-1.5 cursor-pointer text-sm flex items-center gap-1 rounded-md transition-colors')
            .toggleClass('bg-accent text-accent-foreground', isSelected)
            .data('value', service.value)
            .on('click', function() {
                selectService(service.value, service.label);
            })
            .on('mouseenter', function() {
                $dropdown.find('> div').removeClass('bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground');
                $option.addClass('bg-accent text-accent-foreground');
            })
            .on('mouseleave', function() {
                $dropdown.find('> div').removeClass('bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground');
                const currentSelected = $('#service').val();
                $dropdown.find('> div').each(function() {
                    if ($(this).data('value') === currentSelected) {
                        $(this).addClass('bg-accent text-accent-foreground');
                    }
                });
            });
        
        // Add fixed-width checkmark container
        $('<span>')
            .addClass('text-sm font-semibold w-4 text-center')
            .text(isSelected ? '✓' : '')
            .appendTo($option);
        
        $('<span>')
            .text(service.label)
            .appendTo($option);
        
        $option.appendTo($dropdown);
    });
}

function renderRegions(regions) {
    const $container = $('#regionsContainer');
    $container.empty();

    // All Regions option
    const $allLabel = $('<label>')
        .addClass('flex items-start space-x-3 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50 cursor-pointer')
        .html(`
            <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" class="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" id="all"></button>
            <div class="checkbox-text space-y-1">
                <div class="checkbox-text-main flex items-center gap-2 text-sm font-medium">🌍 All Regions</div>
                <div class="checkbox-text-desc text-xs text-muted-foreground">Compare options across all available regions</div>
            </div>
        `);
    $container.append($allLabel);

    // Individual regions
    regions.forEach(region => {
        const $label = $('<label>')
            .addClass('flex items-start space-x-3 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50 cursor-pointer')
            .attr('id', 'region-' + region.id)
            .html(`
                <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="${region.id}" class="peer region-checkbox h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></button>
                <div class="checkbox-text space-y-1">
                    <div class="checkbox-text-main flex items-center gap-2 text-sm font-medium">${region.flag} ${region.label}</div>
                    <div class="checkbox-text-desc text-xs text-muted-foreground">${region.description}</div>
                </div>
            `);
        $container.append($label);
    });

    // Add event listeners
    $('#all').on('click', function(e) {
        e.preventDefault();
        const isChecked = $(this).attr('data-state') === 'checked';
        $(this).attr('aria-checked', !isChecked).attr('data-state', isChecked ? 'unchecked' : 'checked');
        
        if (!isChecked) {
            $(this).html('<span data-state="checked" class="flex items-center justify-center text-current" style="pointer-events: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4"><path d="M20 6 9 17l-5-5"></path></svg></span>');
        } else {
            $(this).html('');
        }
        
        handleRegionToggle({ target: $(this)[0] });
    });

    $('.region-checkbox').on('click', function(e) {
        e.preventDefault();
        const isChecked = $(this).attr('data-state') === 'checked';
        $(this).attr('aria-checked', !isChecked).attr('data-state', isChecked ? 'unchecked' : 'checked');
        
        if (!isChecked) {
            $(this).html('<span data-state="checked" class="flex items-center justify-center text-current" style="pointer-events: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4"><path d="M20 6 9 17l-5-5"></path></svg></span>');
        } else {
            $(this).html('');
        }
        
        handleRegionToggle({ target: $(this)[0] });
    });
}

function handleRegionToggle(e) {
    const $allCheckbox = $('#all');
    const $regionCheckboxes = $('.region-checkbox');
    const $regionLabels = $('[id^="region-"]');

    if ($(e.target).attr('id') === 'all' || $(e.target).closest('button').attr('id') === 'all') {
        const isChecked = $allCheckbox.attr('data-state') === 'checked';
        
        // Toggle all region checkboxes
        $regionCheckboxes.each(function() {
            if (isChecked) {
                // Check all regions (when "all" is checked)
                $(this).attr('aria-checked', 'true').attr('data-state', 'checked');
                $(this).html('<span data-state="checked" class="flex items-center justify-center text-current" style="pointer-events: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4"><path d="M20 6 9 17l-5-5"></path></svg></span>');
            } else {
                // Uncheck all regions (when "all" is unchecked)
                $(this).attr('aria-checked', 'false').attr('data-state', 'unchecked');
                $(this).html('');
            }
        });
        
        // Disable/enable region labels
        if (isChecked) {
            $regionLabels.addClass('opacity-60 cursor-not-allowed').removeClass('cursor-pointer').find('button').prop('disabled', true);
        } else {
            $regionLabels.removeClass('opacity-60 cursor-not-allowed').addClass('cursor-pointer').find('button').prop('disabled', false);
        }
    } else {
        // Uncheck "all" checkbox when clicking individual regions
        $allCheckbox.attr('aria-checked', 'false').attr('data-state', 'unchecked');
        $allCheckbox.html('');
        
        $regionLabels.removeClass('opacity-60 cursor-not-allowed').addClass('cursor-pointer');
        $regionCheckboxes.prop('disabled', false);
    }
}

function renderLocationCard(location, rank) {
    const isTopPick = rank === 1;
    const ringClass = isTopPick ? 'ring-2' : '';
    const shadowClass = isTopPick ? 'rounded-lg border bg-card text-card-foreground relative overflow-hidden transition-all duration-300 hover:shadow-card-hover ring-2 ring-secondary shadow-lg' : 'shadow-card rounded-lg border bg-card text-card-foreground shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-card-hover shadow-card';
    const topBadge = isTopPick ? '<div class="absolute top-0 right-0 gradient-accent px-3 py-1 text-xs font-semibold text-accent-foreground rounded-bl-lg">Top Recommendation</div>' : '';

    const $div = $('<div>')
        .addClass('animate-slide-up')
        .css('animation-delay', (rank - 1) * 100 + 'ms')
        .html(`
            <div class="${ringClass} ${shadowClass} transition-all duration-300 hover:shadow-card-hover">
                ${topBadge}
                
                <div class="flex flex-col space-y-1.5 p-6 pb-3">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-4xl">${location.flag}</span>
                            <div>
                                <h3 class="font-display text-xl font-bold text-foreground">${location.country}</h3>
                                <p class="text-sm text-muted-foreground flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin h-3 w-3"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg> ${location.region}</p>
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
                            <div class="text-muted-foreground text-xs mb-1 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock h-3 w-3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Timezone</div>
                            <div class="font-semibold text-foreground">${location.timezone}</div>
                        </div>
                        <div class="rounded-lg bg-muted/50 p-3">
                            <div class="text-muted-foreground text-xs mb-1 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star h-3 w-3"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg> Infrastructure</div>
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
                                <div class="text-xs text-muted-foreground flex items-center gap-1 justify-end"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-down h-3 w-3 text-success"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg> Est. Annual Savings</div>
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
        `);

    return $div;
}

function showResults(recommendations, inputData) {
    const $heroSection = $('#heroSection');
    const $inputSection = $('#inputSection');
    const $resultsSection = $('#resultsSection');
    const $loadingState = $('#loadingState');

    $heroSection.addClass('hidden');
    $inputSection.addClass('hidden');
    $loadingState.addClass('hidden');
    $resultsSection.removeClass('hidden');

    // Render recommendations
    const $container = $('#recommendationsContainer');
    $container.empty();
    recommendations.forEach((location, index) => {
        $container.append(renderLocationCard(location, index + 1));
    });

    // Update ROI calculator
    const usRate = appState.data.usHourlyRates[inputData.serviceType] || appState.data.usHourlyRates['customer-service'];
    const monthlyHours = 173;
    const serviceLabel = (appState.data.serviceTypes.find(s => s.value === inputData.serviceType)?.label) || inputData.serviceType;
    
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

    $('#agentCountDisplay').text(inputData.agentCount);
    $('#serviceTypeDisplay').text(serviceLabel);
    $('#usRate').text('$' + usRate.min + ' - $' + usRate.max + '/hr');
    $('#inHouseMonthly').text('~' + formatCurrency(inHouseMonthly));
    $('#inHouseBenefits').text(formatCurrency(inHouseMonthly * 0.25));
    $('#inHouseInfra').text(formatCurrency(inputData.agentCount * 500));
    $('#inHouseTotal').text('~' + formatCurrency(inHouseAnnual + benefitsSavings + infrastructureSavings));
    
    $('#outsourcedCountry').text(recommendations[0].country);
    $('#outsourcedRate').text('$' + recommendations[0].rateRange.min + ' - $' + recommendations[0].rateRange.max + '/hr');
    $('#outsourcedMonthly').text(formatCurrencyRange(outsourcedMonthlyMin, outsourcedMonthlyMax));
    $('#outsourcedTotal').text(formatCurrencyRange(outsourcedMonthlyMin * 12, outsourcedMonthlyMax * 12));
    
    // Savings breakdown
    $('#totalSavingsDisplay').text('~' + formatCurrency(totalPotentialSavings));
    $('#savingsPercentDisplay').text(savingsPercent + '%');
    $('#laborSavingsDisplay').text('~' + formatCurrency(annualSavings));
    $('#benefitsSavingsDisplay').text('~' + formatCurrency(benefitsSavings));
    $('#infrastructureSavingsDisplay').text('~' + formatCurrency(infrastructureSavings));
}

function showForm() {
    const $heroSection = $('#heroSection');
    const $inputSection = $('#inputSection');
    const $resultsSection = $('#resultsSection');

    $heroSection.removeClass('hidden');
    $inputSection.removeClass('hidden');
    $resultsSection.addClass('hidden');

    appState.recommendations = null;
    appState.inputData = null;
}

function handleFormSubmit(e) {
    e.preventDefault();
    const agents = parseInt($('#agents').val()) || 50;
    const serviceType = $('#service').val();
    const selectedRegions = $('.region-checkbox[data-state="checked"]').map(function() {
        return $(this).attr('value');
    }).get();

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

    // Set loading state
    appState.isLoading = true;
    const $submitBtn = $('#submitBtn');
    $submitBtn.prop('disabled', true).text('Analyzing...');

    // Simulate loading delay
    setTimeout(() => {
        const recommendations = getRecommendations(input, appState.data);
        appState.recommendations = recommendations;
        showResults(recommendations, input);
    }, 800);
}

function handleReset() {
    clearUserInput();
    showForm();
    
    // Reset loading state
    appState.isLoading = false;
    const $submitBtn = $('#submitBtn');
    $submitBtn.text('Get Recommendations').prop('disabled', true);
    
    // Reset form
    $('#agents').val('50');
    $('#service').val('');
    $('#serviceValue').text('Select a service type');
    $('#serviceValue').addClass('text-muted-foreground');
    $('#serviceDropdown').addClass('hidden');
    $('.region-checkbox, #all').attr('aria-checked', 'false').attr('data-state', 'unchecked').html('').prop('disabled', false);
    $('[id^="region-"]').removeClass('opacity-60 cursor-not-allowed disabled').addClass('cursor-pointer').find('button').prop('disabled', false);
}

// Service dropdown handlers
function selectService(value, label) {
    $('#service').val(value);
    $('#serviceValue').text(label);
    $('#serviceValue').removeClass('text-muted-foreground');
    $('#serviceDropdown').addClass('hidden');
    renderServiceTypes(appState.data.serviceTypes);
    validateForm();
}

function toggleServiceDropdown() {
    $('#serviceDropdown').toggleClass('hidden');
}

// Validate form and enable/disable submit button
function validateForm() {
    const serviceValue = $('#service').val();
    const submitBtn = $('#submitBtn');
    if (serviceValue) {
        submitBtn.prop('disabled', false);
    } else {
        submitBtn.prop('disabled', true);
    }
}

// Close dropdown when clicking outside
$(document).on('click', function(event) {
    const $serviceButton = $('#serviceButton');
    const $serviceDropdown = $('#serviceDropdown');
    if ($serviceButton.length && $serviceDropdown.length && 
        !$serviceButton.is(event.target) && !$serviceButton.has(event.target).length &&
        !$serviceDropdown.is(event.target) && !$serviceDropdown.has(event.target).length) {
        $serviceDropdown.addClass('hidden');
    }
});

// Initialize app
$(document).ready(function() {
    $('#year').text(new Date().getFullYear());

    loadAllData().done(function() {
        // Render UI components
        renderServiceTypes(appState.data.serviceTypes);
        renderRegions(appState.data.regions);

        // Attach dropdown listener
        $('#serviceButton').on('click', toggleServiceDropdown);

        // Restore user input from session storage
        const savedInput = getUserInput();
        if (savedInput) {
            $('#service').val(savedInput.serviceType);
            // Find and display the saved service label
            const serviceTypes = appState.data.serviceTypes;
            const savedService = serviceTypes.find(s => s.value === savedInput.serviceType);
            if (savedService) {
                $('#serviceValue').text(savedService.label);
                $('#serviceValue').removeClass('text-muted-foreground');
            }
            
            // Check saved regions
            savedInput.selectedRegions.forEach(regionId => {
                const $button = $('button[value="' + regionId + '"]');
                if ($button.length) {
                    $button.attr('aria-checked', 'true').attr('data-state', 'checked');
                    $button.html('<span data-state="checked" class="flex items-center justify-center text-current" style="pointer-events: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4"><path d="M20 6 9 17l-5-5"></path></svg></span>');
                }
            });

            // If "all" regions was restored, sync the disabled state
            if (savedInput.selectedRegions.includes('on')) {
                handleRegionToggle({ target: $('#all')[0] });
            }
        }

        // Attach event listeners
        $('#inputForm').on('submit', handleFormSubmit);
        $('#resetBtn').on('click', handleReset);
        
        // Enable/disable submit button based on service selection
        $('#service').on('change', function() {
            const submitBtn = $('#submitBtn');
            const serviceValue = $(this).val();
            if (serviceValue) {
                submitBtn.prop('disabled', false);
            } else {
                submitBtn.prop('disabled', true);
            }
        });

    }).fail(function() {
        console.error('Failed to initialize app');
        $('main').html(`
            <div class="text-center py-12">
                <p class="text-destructive">Failed to load data. Please refresh the page.</p>
            </div>
        `);
    });
});
