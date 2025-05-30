// src/components/EmployeeCreate.tsx
import React, { useState, useEffect } from 'react';
import { EmployeeRequest, GenderType, Training } from '../types/Types';
import api from '../services/api';
import styles from './CSSComponents/EmployeeCreate.module.css'; // Assuming you have a shared form style

interface EmployeeCreateProps {
    departmentId: string;
    onEmployeeCreated: () => void;
    onCancel: () => void;
}

const EmployeeCreate: React.FC<EmployeeCreateProps> = ({ departmentId, onEmployeeCreated, onCancel }) => {
    const [formData, setFormData] = useState<Omit<EmployeeRequest, 'departmentId'>>({
        name: '',
        surname: '',
        email: '',
        position: '',
        age: 18,
        gender: GenderType.Male,
        trainingId: '', // We'll store the ID here based on the selected name
    });
    const [availableTrainings, setAvailableTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrainings = async () => {
            try {
                const response = await api.get<Training[]>('/Training');
                setAvailableTrainings(response.data);
            } catch (err: any) {
                console.error('Error fetching trainings:', err);
                setError('Failed to load available trainings.');
            }
        };

        fetchTrainings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'trainingName') {
            // Find the training object based on the selected name
            const selectedTraining = availableTrainings.find(training => `${training.type} - ${training.positionName} (${training.trainingHours} hrs)` === value);
            // Update formData with the training ID if found, otherwise set to empty
            setFormData(prev => ({ ...prev, trainingId: selectedTraining?.id || '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload: EmployeeRequest = { ...formData, departmentId };
            await api.post('/Employee', payload);
            onEmployeeCreated();
        } catch (err: any) {
            console.error('Error creating employee:', err);
            setError('Failed to create employee.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles['form-container']}>
            <h2 className={styles['form-header']}>Create New Employee</h2>
            {error && <p className={styles['error-message']}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className={styles['form-group']}>
                    <label htmlFor="name">First Name:</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={styles['input-field']} />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="surname">Last Name:</label>
                    <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} required className={styles['input-field']} />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={styles['input-field']} />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="position">Position:</label>
                    <input type="text" id="position" name="position" value={formData.position} onChange={handleChange} required className={styles['input-field']} />
                </div>
                <div className={styles['form-group']} style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label htmlFor="age">Age:</label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            required
                            min="18"
                            className={styles['input-field']}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label htmlFor="gender">Gender:</label>
                        <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required className={styles['input-field']}>
                            <option value="">Select Gender</option>
                            <option value={GenderType.Male}>Male</option>
                            <option value={GenderType.Female}>Female</option>
                            <option value={GenderType.Other}>Other</option>
                        </select>
                    </div>
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="trainingName">Assigned Training:</label>
                    <select
                        id="trainingName"
                        name="trainingName"
                        value={availableTrainings.find(t => t.id === formData.trainingId) ? `${availableTrainings.find(t => t.id === formData.trainingId)?.type} - ${availableTrainings.find(t => t.id === formData.trainingId)?.positionName} (${availableTrainings.find(t => t.id === formData.trainingId)?.trainingHours} hrs)` : ''}
                        onChange={handleChange}
                        className={styles['input-field']}
                    >
                        <option value="">No Training Assigned</option>
                        {availableTrainings.map(training => (
                            <option
                                key={training.id}
                                value={`${training.type} - ${training.positionName} (${training.trainingHours} hrs)`}
                            >
                                {training.type} - {training.positionName} ({training.trainingHours} hrs)
                            </option>
                        ))}
                    </select>
                    {error === 'Failed to load available trainings.' && <p className={styles['error-message']}>{error}</p>}
                    {availableTrainings.length === 0 && !loading && !error && <small className={styles['form-text']}>No trainings available.</small>}
                </div>
                <div className={styles['form-actions']}>
                    <button type="submit" disabled={loading} className={styles['primary-button']}>
                        {loading ? 'Creating...' : 'Create Employee'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={loading} className={styles['secondary-button']}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeCreate;