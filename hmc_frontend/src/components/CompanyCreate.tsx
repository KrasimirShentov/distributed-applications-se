// src/components/CompanyCreate.tsx
import React, { useState } from 'react';
import api from '../services/api';
import { Company, Address } from '../types/Types';
import styles from './CSSComponents/CompanyCreate.module.css'; // Keep this import

interface CompanyCreateProps {
    onCompanyCreated: () => void;
    onCancel: () => void;
}

const CompanyCreate: React.FC<CompanyCreateProps> = ({ onCompanyCreated, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Company, 'id' | 'addresses' | 'departments'>>({
        name: '',
        email: '',
        phoneNumber: '',
        description: '',
    });
    const [addressName, setAddressName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddressName(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.name || !addressName) {
            setError('Company Name and Address are required.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                addresses: addressName ? [{ addressName: addressName }] : [],
            };
            await api.post('/Company', payload);
            alert('Company created successfully!');
            onCompanyCreated();
        } catch (err: any) {
            console.error('Error creating company:', err.response?.data || err.message);
            let errorMessage = 'Failed to create company. An unknown error occurred.';
            if (err.response) {
                errorMessage = typeof err.response.data === 'string' ? `Failed to create company: ${err.response.data}` : (err.response.data?.message ? `Failed to create company: ${err.response.data.message}` : `Server responded with status ${err.response.status}.`);
            } else if (err.request) {
                errorMessage = 'Failed to create company: No response from server. Check network connection.';
            } else {
                errorMessage = `Failed to create company: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles['form-container']}> {/* Assuming 'form-container' is used in DepartmentCreate */}
            <h2 className={styles['form-header']}>Create New Company</h2> {/* Assuming 'form-header' is used */}
            {error && <p className={styles['error-message']}>{error}</p>} {/* Assuming 'error-message' is used */}
            <form onSubmit={handleSubmit}>
                <div className={styles['form-group']}> {/* Assuming 'form-group' is used */}
                    <label htmlFor="name" className={styles['form-label']}>Company Name:</label> {/* Assuming 'form-label' */}
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={styles['form-input']} required /> {/* Assuming 'form-input' */}
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="email" className={styles['form-label']}>Email:</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={styles['form-input']} />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="phoneNumber" className={styles['form-label']}>Phone Number:</label>
                    <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={styles['form-input']} />
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="description" className={styles['form-label']}>Description:</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className={styles['form-textarea']} /> {/* Assuming 'form-textarea' */}
                </div>
                <div className={styles['form-group']}>
                    <label htmlFor="addressName" className={styles['form-label']}>Address:</label>
                    <input type="text" id="addressName" name="addressName" value={addressName} onChange={handleAddressChange} className={styles['form-input']} required />
                </div>
                <div className={styles['form-actions']}> {/* Assuming 'form-actions' for buttons */}
                    <button type="submit" className={styles['action-button']} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Company'}
                    </button>
                    <button type="button" onClick={onCancel} className={styles['cancel-button']} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyCreate;