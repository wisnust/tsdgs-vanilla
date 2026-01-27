export const appState = {
    data: null,
    isDataLoaded: false,
    recommendations: null,
    inputData: null,
    isLoading: false
};

const SESSION_KEY = 'outsourcing-tool-user-input';

export function getUserInput() {
    try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

export function saveUserInput(input) {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(input));
    } catch (error) {
        console.error('Failed to save user input:', error);
    }
}

export function clearUserInput() {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error('Failed to clear user input:', error);
    }
}
