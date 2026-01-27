export function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

export function formatCurrencyRange(min, max) {
    return formatCurrency(min) + ' - ' + formatCurrency(max);
}

export function id(elementId) {
    return document.getElementById(elementId);
}

export function query(selector) {
    return document.querySelector(selector);
}

export function queryAll(selector) {
    return document.querySelectorAll(selector);
}
