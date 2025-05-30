// src/components/CompanyList.tsx
import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Company } from '../types/Types';
import CompanyCreate from './CompanyCreate';
import styles from './CSSComponents/CompanyList.module.css';
import { Link } from 'react-router-dom'; // Import Link

const CompanyList: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Omit<Company, 'id' | 'addresses' | 'departments'>>({
        name: '',
        email: '',
        phoneNumber: '',
        description: '',
    });
    const [viewingId, setViewingId] = useState<string | null>(null);
    const [viewFormData, setViewFormData] = useState<Omit<Company, 'addresses' | 'departments'>>({
        id: '',
        name: '',
        email: '',
        phoneNumber: '',
        description: '',
    });

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<Company[]>('/Company');
            setCompanies(response.data);
        } catch (err: any) {
            console.error('Error fetching companies:', err.response?.data || err.message);
            let errorMessage = 'Failed to load companies. An unknown error occurred.';
            if (err.response) {
                errorMessage = `Failed to load companies: ${err.response.data.message || err.response.statusText}`;
            } else if (err.request) {
                errorMessage = 'Failed to load companies: No response from server. Check network connection.';
            } else {
                errorMessage = `Failed to load companies: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const handleCompanyCreated = () => {
        setShowCreateForm(false);
        fetchCompanies();
    };

    const handleEditClick = (company: Company) => {
        setEditingId(company.id);
        setEditFormData({
            name: company.name,
            email: company.email || '',
            phoneNumber: company.phoneNumber || '',
            description: company.description || '',
        });
        setViewingId(null);
        setShowCreateForm(false);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleUpdateCompany = async (id: string, e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!editFormData.name) {
            setError('Company Name is required.');
            setLoading(false);
            return;
        }

        try {
            await api.put(`/Company/${id}`, editFormData);
            alert('Company updated successfully!');
            setEditingId(null);
            fetchCompanies();
        } catch (err: any) {
            console.error('Error updating company:', err.response?.data || err.message);
            let errorMessage = 'Failed to update company. An unknown error occurred.';
            if (err.response) {
                if (typeof err.response.data === 'string') {
                    errorMessage = `Failed to update company: ${err.response.data}`;
                } else if (err.response.data && err.response.data.message) {
                    errorMessage = `Failed to update company: ${err.response.data.message}`;
                } else if (err.response.data && err.response.data.errors) {
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
                errorMessage = 'Failed to update company: No response from server. Check network connection.';
            } else {
                errorMessage = `Failed to update company: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleDeleteCompany = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await api.delete(`/Company/${id}`);
            alert('Company deleted successfully!');
            fetchCompanies();
        } catch (err: any) {
            console.error('Error deleting company:', err.response?.data || err.message);
            let errorMessage = 'Failed to delete company. An unknown error occurred.';
            if (err.response) {
                errorMessage = `Failed to delete company: ${err.response.data.message || err.response.statusText}`;
            } else if (err.request) {
                errorMessage = 'Failed to delete company: No response from server. Check network connection.';
            } else {
                errorMessage = `Failed to delete company: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleViewClick = (company: Company) => {
        setViewingId(company.id);
        setViewFormData({
            id: company.id,
            name: company.name,
            email: company.email || '',
            phoneNumber: company.phoneNumber || '',
            description: company.description || '',
        });
        setEditingId(null);
        setShowCreateForm(false);
    };

    const handleCancelView = () => {
        setViewingId(null);
    };

    const handleCancelCreate = () => {
        setShowCreateForm(false);
    };

    if (loading) {
        return <div className={styles['loading-text']}>Loading companies...</div>;
    }

    if (error) {
        return <div className={styles['error-text']}>Error: {error}</div>;
    }

    const isFormActive = showCreateForm || editingId || viewingId;

    return (
        <div className={styles['list-container']}>
            <h2 className={styles['section-header']}>Companies</h2>

            {!isFormActive && (
                <button className={`action-button primary ${styles['add-button']}`} onClick={() => setShowCreateForm(true)}>
                    Add New Company
                </button>
            )}

            {showCreateForm && (
                <CompanyCreate
                    onCompanyCreated={handleCompanyCreated}
                    onCancel={handleCancelCreate}
                />
            )}

            {viewingId && (
                <div className={styles['edit-form']}> {/* Reusing edit-form styles */}
                    <h3 className={styles['section-subheader']}>View Company</h3>
                    <div className={styles['form-group']}>
                        <label>Name:</label>
                        <input type="text" value={viewFormData.name} readOnly />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Email:</label>
                        <input type="text" value={viewFormData.email || 'N/A'} readOnly />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Phone Number:</label>
                        <input type="text" value={viewFormData.phoneNumber || 'N/A'} readOnly />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Description:</label>
                        <textarea value={viewFormData.description || 'N/A'} readOnly rows={3} />
                    </div>
                    <div className={styles['form-buttons']}>
                        <button type="button" onClick={handleCancelView} className={`action-button secondary`}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {editingId && (
                <div className={styles['edit-form']}>
                    <h3 className={styles['section-subheader']}>Edit Company</h3>
                    <form onSubmit={(e) => handleUpdateCompany(editingId, e)} className={styles['edit-form']}>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-name-${editingId}`}>Name:</label>
                            <input
                                type="text"
                                id={`edit-name-${editingId}`}
                                name="name"
                                value={editFormData.name}
                                onChange={handleEditFormChange}
                                required
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-email-${editingId}`}>Email:</label>
                            <input
                                type="email"
                                id={`edit-email-${editingId}`}
                                name="email"
                                value={editFormData.email}
                                onChange={handleEditFormChange}
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-phoneNumber-${editingId}`}>Phone Number:</label>
                            <input
                                type="tel"
                                id={`edit-phoneNumber-${editingId}`}
                                name="phoneNumber"
                                value={editFormData.phoneNumber}
                                onChange={handleEditFormChange}
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-description-${editingId}`}>Description:</label>
                            <textarea
                                id={`edit-description-${editingId}`}
                                name="description"
                                value={editFormData.description}
                                onChange={handleEditFormChange}
                                rows={3}
                            />
                        </div>
                        {error && <p className={styles['error-text']}>{error}</p>}
                        <div className={styles['form-buttons']}>
                            <button type="submit" className={`action-button primary`} disabled={loading}>
                                {loading ? 'Updating...' : 'Update'}
                            </button>
                            <button type="button" onClick={handleCancelEdit} className={`action-button secondary`} disabled={loading}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {companies.length > 0 && !isFormActive && (
                <div className={styles['table-wrapper']}>
                    <table className={styles['data-table']}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone Number</th>
                                <th>Description</th>
                                <th>Actions</th>
                                <th>Departments</th> {/* Departments Column */}
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map(company => (
                                <tr key={company.id}>
                                    <td>{company.name}</td>
                                    <td>{company.email|| 'N/A'}</td>
                                    <td>{company.phoneNumber || 'N/A'}</td>
                                    <td className={styles['description-cell']}>{company.description || 'N/A'}</td>
                                    <td className={styles['actions-cell']}>
                                        <button
                                            className={`action-button primary ${styles['view-button']} ${styles['small-margin-right']}`}
                                            onClick={() => handleViewClick(company)}
                                            disabled={loading}
                                        >
                                            View
                                        </button>
                                        <button
                                            className={`action-button primary ${styles['edit-button']} ${styles['small-margin-right']}`}
                                            onClick={() => handleEditClick(company)}
                                            disabled={loading}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className={`action-button danger ${styles['delete-button']}`}
                                            onClick={() => handleDeleteCompany(company.id)}
                                            disabled={loading}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                    <td>
                                        <Link to={`/companies/${company.id}/departments`} className={styles['view-departments-link']}>
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {companies.length === 0 && !isFormActive && (
                <p>No companies found.</p>
            )}
        </div>
    );
};

export default CompanyList;