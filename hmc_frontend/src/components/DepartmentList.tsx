// src/components/DepartmentList.tsx
import React, { useState } from 'react';
import api from '../services/api';
import { Department, DepartmentRequest } from '../types/Types';
import DepartmentCreate from './DepartmentCreate';
import styles from './CSSComponents/DepartmentList.module.css'; // Import CSS module
import { Link, useNavigate } from 'react-router-dom';

interface DepartmentListProps {
    companyId: string;
    departments: Department[];
    onDepartmentChange: () => void;
}

const DepartmentList: React.FC<DepartmentListProps> = ({ companyId, departments, onDepartmentChange }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCreatingDepartment, setIsCreatingDepartment] = useState<boolean>(false);
    const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
    const [editDepartmentFormData, setEditDepartmentFormData] = useState<Omit<DepartmentRequest, 'companyId'>>({
        name: '',
        description: '',
        email: '',
        phoneNumber: '',
        type: '',
    });
    const [editAddressName, setEditAddressName] = useState(''); // State for editing address
    const [viewingDepartmentId, setViewingDepartmentId] = useState<string | null>(null);
    const [viewDepartmentData, setViewDepartmentData] = useState<Department | null>(null);
    const navigate = useNavigate();

    const handleCreateDepartmentClick = () => {
        setIsCreatingDepartment(true);
        setEditingDepartmentId(null);
        setViewingDepartmentId(null);
    };

    const handleDepartmentCreated = () => {
        setIsCreatingDepartment(false);
        onDepartmentChange();
    };

    const handleCancelCreateDepartment = () => {
        setIsCreatingDepartment(false);
    };

    const handleEditDepartmentClick = (department: Department) => {
        setEditingDepartmentId(department.id);
        setEditDepartmentFormData({
            name: department.name,
            description: department.description || '',
            email: department.email || '',
            phoneNumber: department.phoneNumber || '',
            type: department.type || '',
        });
        if (department.addresses && department.addresses.length > 0) {
            setEditAddressName(department.addresses[0].addressName);
        } else {
            setEditAddressName('');
        }
        setIsCreatingDepartment(false);
        setViewingDepartmentId(null);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditDepartmentFormData(prev => ({ ...prev!, [name]: value }));
    };

    const handleEditAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditAddressName(e.target.value);
    };

    const handleUpdateDepartment = async (id: string, e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        if (!editDepartmentFormData.name) {
            setError('Department Name is required.');
            setLoading(false);
            return;
        }
        try {
            const payload: DepartmentRequest = {
                ...editDepartmentFormData,
                companyId: companyId,
                DepartmentAddresses: editAddressName ? [{ addressName: editAddressName }] : [],
            };
            await api.put(`/Department/${id}`, payload);
            alert('Department updated successfully!');
            setEditingDepartmentId(null);
            onDepartmentChange();
        } catch (err: any) {
            console.error('Error updating department:', err.response?.data || err.message);
            let errorMessage = 'Failed to update department. An unknown error occurred.';
            if (err.response) {
                if (typeof err.response.data === 'string') {
                    errorMessage = `Failed to update department: ${err.response.data}`;
                } else if (err.response.data && err.response.data.message) {
                    errorMessage = `Failed to update department: ${err.response.data.message}`;
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
                errorMessage = 'Failed to update department: No response from server. Check network connection.';
            } else {
                errorMessage = `Failed to update department: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEditDepartment = () => {
        setEditingDepartmentId(null);
    };

    const handleDeleteDepartment = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/Department/${id}`);
            alert('Department deleted successfully!');
            onDepartmentChange();
        } catch (err: any) {
            console.error('Error deleting department:', err.response?.data || err.message);
            let errorMessage = 'Failed to delete department. An unknown error occurred.';
            if (err.response) {
                errorMessage = `Failed to delete department: ${err.response.data.message || err.response.statusText}`;
            } else if (err.request) {
                errorMessage = 'Failed to delete department: No response from server. Check network connection.';
            } else {
                errorMessage = `Failed to delete department: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDepartmentClick = (department: Department) => {
        setViewingDepartmentId(department.id);
        setViewDepartmentData(department);
        setIsCreatingDepartment(false);
        setEditingDepartmentId(null);
    };

    const handleCancelViewDepartment = () => {
        setViewingDepartmentId(null);
        setViewDepartmentData(null);
    };

    const isDepartmentFormActive = isCreatingDepartment || editingDepartmentId || viewingDepartmentId;

    return (
        <div className={styles['department-list-container']}>
            <div className={styles['section-header']}>
                <h3>Departments</h3>
                {!isDepartmentFormActive && (
                    <button
                        onClick={handleCreateDepartmentClick}
                        className={styles['add-department-button']}
                        disabled={loading}
                    >
                        Add New Department
                    </button>
                )}
            </div>

            {error && <p className={styles['error-message']}>{error}</p>}
            {loading && <p className={styles['loading-text']}>Processing...</p>}

            {isCreatingDepartment && (
                <DepartmentCreate
                    companyId={companyId}
                    onDepartmentCreated={handleDepartmentCreated}
                    onCancel={handleCancelCreateDepartment}
                />
            )}

            {editingDepartmentId && editDepartmentFormData && (
                <div className={styles['form-container']}>
                    <h3 className={styles['section-header']}>Edit Department</h3>
                    <form onSubmit={(e) => handleUpdateDepartment(editingDepartmentId, e)}>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-dept-name-${editingDepartmentId}`}>Name:</label>
                            <input
                                type="text"
                                id={`edit-dept-name-${editingDepartmentId}`}
                                name="name"
                                value={editDepartmentFormData.name}
                                onChange={handleEditFormChange}
                                required
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-dept-type-${editingDepartmentId}`}>Type:</label>
                            <input
                                type="text"
                                id={`edit-dept-type-${editingDepartmentId}`}
                                name="type"
                                value={editDepartmentFormData.type || ''}
                                onChange={handleEditFormChange}
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-dept-email-${editingDepartmentId}`}>Email:</label>
                            <input
                                type="email"
                                id={`edit-dept-email-${editingDepartmentId}`}
                                name="email"
                                value={editDepartmentFormData.email || ''}
                                onChange={handleEditFormChange}
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-dept-phoneNumber-${editingDepartmentId}`}>Phone Number:</label>
                            <input
                                type="tel"
                                id={`edit-dept-phoneNumber-${editingDepartmentId}`}
                                name="phoneNumber"
                                value={editDepartmentFormData.phoneNumber || ''}
                                onChange={handleEditFormChange}
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-dept-description-${editingDepartmentId}`}>Description:</label>
                            <textarea
                                id={`edit-dept-description-${editingDepartmentId}`}
                                name="description"
                                value={editDepartmentFormData.description || ''}
                                onChange={handleEditFormChange}
                                rows={3}
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-dept-address-${editingDepartmentId}`}>Address:</label>
                            <input
                                type="text"
                                id={`edit-dept-address-${editingDepartmentId}`}
                                name="addressName"
                                value={editAddressName}
                                onChange={handleEditAddressChange}
                                required
                            />
                        </div>
                        <div className={styles['form-buttons']}>
                            <button type="submit" className={styles['action-button']} disabled={loading}>
                                {loading ? 'Updating...' : 'Update Department'}
                            </button>
                            <button type="button" onClick={handleCancelEditDepartment} className={styles['secondary-button']} disabled={loading}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {viewingDepartmentId && viewDepartmentData && (
                <div className={styles['form-container']}>
                    <h3 className={styles['section-header']}>View Department</h3>
                    <div className={styles['form-group']}>
                        <label>Name:</label>
                        <input type="text" value={viewDepartmentData.name} readOnly />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Type:</label>
                        <input type="text" value={viewDepartmentData.type || 'N/A'} readOnly />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Email:</label>
                        <input type="text" value={viewDepartmentData.email || 'N/A'} readOnly />
                    </div>
                    <div className={styles['form-group']}><label>Phone Number:</label>
                        <input type="text" value={viewDepartmentData.phoneNumber || 'N/A'} readOnly />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Description:</label>
                        <textarea value={viewDepartmentData.description || 'N/A'} readOnly rows={3} />
                    </div>
                    {viewDepartmentData.addresses && viewDepartmentData.addresses.length > 0 && (
                        <div className={styles['form-group']}>
                            <label>Addresses:</label>
                            <ul>
                                {viewDepartmentData.addresses.map((addr, idx) => (
                                    <li key={idx}>{addr.addressName}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {viewDepartmentData.employees && viewDepartmentData.employees.length > 0 && (
                        <div className={styles['form-group']}>
                            <label>Employees:</label>
                            <ul>
                                {viewDepartmentData.employees.map((emp) => (
                                    <li key={emp.id}>{emp.firstName} {emp.lastName} ({emp.position})</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className={styles['form-buttons']}>
                        <button type="button" onClick={handleCancelViewDepartment} className={styles['secondary-button']}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {!isDepartmentFormActive && (
                departments && departments.length > 0 ? (
                    <div className={styles['table-wrapper']}>
                        <table className={styles['data-table']}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Email</th>
                                    <th>Phone Number</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departments.map((department) => (
                                    <tr key={department.id}>
                                        <td>{department.name}</td>
                                        <td>{department.type || 'N/A'}</td>
                                        <td>{department.email || 'N/A'}</td>
                                        <td>{department.phoneNumber || 'N/A'}</td>
                                        <td>{department.description || 'N/A'}</td>
                                        <td className={styles['actions-cell']}>
                                            <button
                                                className={`${styles['action-button']} ${styles['view-button']}`}
                                                onClick={() => handleViewDepartmentClick(department)}
                                                disabled={loading}
                                            >
                                                View
                                            </button>
                                            <button
                                                className={`${styles['action-button']} ${styles['edit-button']}`}
                                                onClick={() => handleEditDepartmentClick(department)}
                                                disabled={loading}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className={`${styles['action-button']} ${styles['delete-button']}`}
                                                onClick={() => handleDeleteDepartment(department.id)}
                                                disabled={loading}
                                            >
                                                Delete
                                            </button>
                                            <Link
                                                to={`/companies/${companyId}/departments/${department.id}`}
                                                className={styles['view-employees-link']}
                                            >
                                                Employees
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className={styles['no-departments-text']}>No departments found for this company. Click "Add New Department" to create one.</p>
                )
            )}
        </div>
    );
};

export default DepartmentList;