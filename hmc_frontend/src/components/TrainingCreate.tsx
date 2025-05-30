// src/components/TrainingCreate.tsx
import React, { useState } from 'react';
import api from '../services/api'; // Ensure your api.ts is correctly configured
import { TrainingRequest } from '../types/Types';
import styles from './CSSComponents/TrainingCreate.module.css'; // Import CSS for this component

interface TrainingCreateProps {
    onTrainingCreated: () => void; // Callback to refresh list or navigate
    onCancel: () => void; // Callback to cancel creation
}

const TrainingCreate: React.FC<TrainingCreateProps> = ({ onTrainingCreated, onCancel }) => {
    const [formData, setFormData] = useState<TrainingRequest>({
        type: '',
        positionName: '',
        description: '',
        trainingHours: 0,
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'trainingHours' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic client-side validation
        if (!formData.type || !formData.positionName || formData.trainingHours <= 0) {
            setError('Please fill in all required fields and ensure Training Hours is a positive number.');
            setLoading(false);
            return;
        }

        try {
            // The payload structure directly matches TrainingRequest (NO ID in payload for creation)
            await api.post('/Training', formData);
            alert('Training created successfully!');
            onTrainingCreated(); // Notify parent to refresh list or close form
        } catch (err: any) {
            console.error('Error creating training:', err.response?.data || err.message);
            let errorMessage = 'Failed to create training. An unknown error occurred.';
            if (err.response) {
                // More detailed error handling for API responses from your backend (e.g., Conflict, BadRequest)
                if (typeof err.response.data === 'string') {
                    errorMessage = `Failed to create training: ${err.response.data}`;
                } else if (err.response.data && err.response.data.message) {
                    errorMessage = `Failed to create training: ${err.response.data.message}`;
                } else if (err.response.data && err.response.data.errors) {
                    // ASP.NET Core ModelState validation errors often come in this format
                    const errors = err.response.data.errors;
                    const errorMessages: string[] = [];
                    for (const key in errors) {
                        if (errors.hasOwnProperty(key)) {
                            errorMessages.push(`${key}: ${errors[key].join(', ')}`);
                        }
                    }
                    errorMessage = `Validation Errors: ${errorMessages.join('; ')}`;
                } else {
                    errorMessage = `Server responded with status ${err.response.status}.`;
                }
            } else if (err.request) {
                errorMessage = 'Failed to create training: No response from server. Check network connection.';
            } else {
                errorMessage = `Failed to create training: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles['form-container']}>
            <h2 className={styles['section-header']}>Create New Training</h2>
            <form onSubmit={handleSubmit}>
                <div className={styles['form-group']}>
                    <label htmlFor="type">Type:</label>
                    <input
                        type="text"
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="positionName">Position Name:</label>
                    <input
                        type="text"
                        id="positionName"
                        name="positionName"
                        value={formData.positionName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                    />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="trainingHours">Training Hours:</label>
                    <input
                        type="number"
                        id="trainingHours"
                        name="trainingHours"
                        value={formData.trainingHours}
                        onChange={handleChange}
                        required
                        min="1"
                    />
                </div>

                {error && <p className={styles['error-text']}>{error}</p>}

                <div className={styles['form-buttons']}>
                    <button type="submit" className={`action-button primary ${styles['create-button']}`} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Training'}
                    </button>
                    <button type="button" onClick={onCancel} className={`action-button secondary ${styles['cancel-button']}`} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TrainingCreate;
