export function loadAllData() {
    return Promise.all([
        fetch('./data/locations.json').then(r => r.json()),
        fetch('./data/service-types.json').then(r => r.json()),
        fetch('./data/us-hourly-rates.json').then(r => r.json()),
        fetch('./data/service-location-strengths.json').then(r => r.json()),
        fetch('./data/regions.json').then(r => r.json())
    ]).then(([locations, serviceTypes, usHourlyRates, serviceLocationStrengths, regions]) => {
        return {
            locations,
            serviceTypes,
            usHourlyRates,
            serviceLocationStrengths,
            regions
        };
    }).catch(error => {
        console.error('Failed to load data:', error);
        throw new Error('Failed to load data');
    });
}