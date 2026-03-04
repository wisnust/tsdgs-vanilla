export function getRecommendations(input, data) {
    const { locations, serviceTypes, usHourlyRates, serviceLocationStrengths, regions } = data;
    
    const monthlyHours = 173;
    const usRate = usHourlyRates[input.serviceType] || usHourlyRates['customer-service'];
    const usMonthlyMidpoint = usRate.midpoint * monthlyHours * input.agentCount;

    let allowedLocationIds = [];
    if (input.selectedRegions.length === 0 || input.selectedRegions.includes('on')) {
        allowedLocationIds = locations.map(loc => loc.id);
    } else {
        input.selectedRegions.forEach(regionId => {
            const region = regions.find(r => r.id === regionId);
            if (region) {
                allowedLocationIds.push(...region.locationIds);
            }
        });
    }

    const filteredLocations = locations.filter(loc => allowedLocationIds.includes(loc.id));

    const scored = filteredLocations.map(location => {
        let score = 50;
        const matchReasons = [];

        const strengthLocations = serviceLocationStrengths[input.serviceType] || [];
        if (strengthLocations.includes(location.id)) {
            score += 25;
            const serviceLabel = serviceTypes.find(s => s.value === input.serviceType)?.label || input.serviceType;
            matchReasons.push('Top performer for ' + serviceLabel);
        }

        if (location.englishProficiency === 'Native') {
            score += 20;
            matchReasons.push('Native English speakers');
        } else if (location.englishProficiency === 'High') {
            score += 15;
            matchReasons.push('High English proficiency');
        }

        const rateMidpoint = (location.rateRange.min + location.rateRange.max) / 2;
        const costScore = Math.max(0, 25 - rateMidpoint);
        score += costScore;

        score += location.infrastructureRating * 3;

        if ((input.serviceType === 'sales' || input.serviceType === 'customer-service') &&
            ['Latin America', 'Central America', 'Caribbean'].includes(location.region)) {
            score += 10;
            if (!matchReasons.some(r => r.includes('time zone'))) {
                matchReasons.push('Nearshore location with US timezone alignment');
            }
        }

        if (matchReasons.length < 4 && location.pros) {
            location.pros.slice(0, 4 - matchReasons.length).forEach(pro => {
                if (!matchReasons.includes(pro)) {
                    matchReasons.push(pro);
                }
            });
        }

        const monthlyMin = location.rateRange.min * monthlyHours * input.agentCount;
        const monthlyMax = location.rateRange.max * monthlyHours * input.agentCount;
        const monthlyMidpoint = rateMidpoint * monthlyHours * input.agentCount;
        
        let savingsPercentageMin, savingsPercentageMax;
        if (location.id === 'united-states') {
            savingsPercentageMin = 0;
            savingsPercentageMax = 0;
        } else if (location.savingsRange) {
            savingsPercentageMin = location.savingsRange.min;
            savingsPercentageMax = location.savingsRange.max;
        } else {
            savingsPercentageMin = Math.round(((usRate.midpoint - location.rateRange.max) / usRate.midpoint) * 100);
            savingsPercentageMax = Math.round(((usRate.midpoint - location.rateRange.min) / usRate.midpoint) * 100);
        }

        return {
            ...location,
            score,
            matchReasons,
            estimatedMonthlyCostRange: { min: monthlyMin, max: monthlyMax },
            estimatedAnnualSavingsRange: {
                min: (usMonthlyMidpoint * 12) - (monthlyMax * 12),
                max: (usMonthlyMidpoint * 12) - (monthlyMin * 12)
            },
            savingsPercentageMin,
            savingsPercentageMax,
            rateMidpoint
        };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 4);
}
