import { useState } from "react";

export function useNotification() {
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const showError = (message) => {
        setError(message);
        setSuccess(null); // Clear success when showing error
    };

    const showSuccess = (message) => {
        setSuccess(message);
        setError(null); // Clear error when showing success
    };

    const clearNotifications = () => {
        setError(null);
        setSuccess(null);
    };

    return {
        error,
        success,
        showError,
        showSuccess,
        clearNotifications
    };
}

export default useNotification;