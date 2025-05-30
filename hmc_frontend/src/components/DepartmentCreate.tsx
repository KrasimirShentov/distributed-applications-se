// src/components/DepartmentCreate.tsx
import React, { useState } from 'react';
import api from '../services/api';
import { DepartmentRequest } from '../types/Types';
import styles from './CSSComponents/DepartmentCreate.module.css'; // Create this CSS file if you haven't

interface DepartmentCreateProps {
    companyId: string;
    onDepartmentCreated: () => void;
    onCancel: () => void;
}

const DepartmentCreate: React.FC<DepartmentCreateProps> = ({ companyId, onDepartmentCreated, onCancel }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [description, setDescription] = useState('');
    const [addressName, setAddressName] = useState(''); // For a single address input
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const newDepartment: DepartmentRequest = {
            companyId: companyId,
            name: name,
            type: type,
            email: email,
            phoneNumber: phoneNumber,
            description: description,
            DepartmentAddresses: addressName ? [{ addressName }] : [], // Changed key to DepartmentAddresses (PascalCase)
        };

        try {
            await api.post('/Department', newDepartment);
            onDepartmentCreated();
        } catch (err: any) {
            console.error('Error creating department:', err.response?.data || err.message);
            setError('Failed to create department. Please check the form data.');
            if (err.response?.data?.errors?.DepartmentAddresses) {
                setError(`Validation Error: Department Addresses - ${err.response.data.errors.DepartmentAddresses.join(', ')}`);
            } else if (err.response?.data?.message) {
                setError(`Validation Error: ${err.response.data.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles['form-container']}>
            <h2 className={styles['section-header']}>Create New Department</h2>
            <form onSubmit={handleSubmit}>
                <div className={styles['form-group']}>
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="type">Type:</label>
                    <input
                        type="text"
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="phoneNumber">Phone Number:</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="addressName">Address:</label>
                    <input
                        type="text"
                        id="addressName"
                        value={addressName}
                        onChange={(e) => setAddressName(e.target.value)}
                        required
                    />
                </div>
                {error && <p className={styles['error-message']}>{error}</p>}
                <div className={styles['form-buttons']}>
                    <button type="submit" className={styles['action-button']} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Department'}
                    </button>
                    <button type="button" onClick={onCancel} className={styles['secondary-button']} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DepartmentCreate;