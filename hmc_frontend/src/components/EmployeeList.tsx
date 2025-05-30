// src/components/EmployeeList.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Employee, EmployeeRequest, GenderType } from '../types/Types'; // Ensure GenderType is imported
import api from '../services/api';
import EmployeeCreate from './EmployeeCreate';
import styles from './CSSComponents/EmployeeList.module.css'; // Ensure this CSS file exists

interface EmployeeListProps {}

const EmployeeList: React.FC<EmployeeListProps> = () => {
    const { companyId, departmentId } = useParams<{ companyId: string; departmentId?: string }>();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCreatingEmployee, setIsCreatingEmployee] = useState<boolean>(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
    const [editEmployeeFormData, setEditEmployeeFormData] = useState<Omit<EmployeeRequest, 'departmentId'>>({
        name: '',
        surname: '',
        email: '',
        position: '',
        age: 18, // Default age
        gender: GenderType.Male, // Default gender
        trainingId: '', // Default trainingId
    });
    const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null);

    const fetchEmployees = async () => {
        setLoading(true);
        setError(null);
        if (departmentId) {
            try {
                const response = await api.get(`/Department/${departmentId}/Employees`); // Adjust API endpoint
                setEmployees(response.data);
            } catch (err: any) {
                console.error('Error fetching employees:', err);
                setError('Failed to fetch employees.');
            } finally {
                setLoading(false);
            }
        } else {
            setError('Department ID is missing.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [departmentId]);

    const handleAddEmployeeClick = () => {
        setIsCreatingEmployee(true);
        setEditingEmployeeId(null);
        setViewingEmployeeId(null);
    };

    const handleEmployeeCreated = () => {
        setIsCreatingEmployee(false);
        fetchEmployees(); // Refresh employee list
    };

    const handleCancelCreateEmployee = () => {
        setIsCreatingEmployee(false);
    };

    const handleEditEmployeeClick = (employee: Employee) => {
        setEditingEmployeeId(employee.id);
        setEditEmployeeFormData({
            name: employee.firstName,
            surname: employee.lastName,
            email: employee.email,
            position: employee.position,
            age: employee.age, // Assuming 'age' exists in your Employee interface
            gender: employee.gender, // Assuming 'gender' exists in your Employee interface
            trainingId: employee.trainingDetails?.id || '', // Assuming training details are nested
        });
        setIsCreatingEmployee(false);
        setViewingEmployeeId(null);
    };

    const handleCancelEditEmployee = () => {
        setEditingEmployeeId(null);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditEmployeeFormData(prev => ({ ...prev!, [name]: value }));
    };

    const handleUpdateEmployee = async (id: string, e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.put(`/Employee/${id}`, { ...editEmployeeFormData, departmentId }); // Adjust API endpoint
            alert('Employee updated successfully!');
            setEditingEmployeeId(null);
            fetchEmployees(); // Refresh employee list
        } catch (err: any) {
            console.error('Error updating employee:', err);
            setError('Failed to update employee.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            setLoading(true);
            setError(null);
            try {
                await api.delete(`/Employee/${id}`); // Adjust API endpoint
                alert('Employee deleted successfully!');
                fetchEmployees(); // Refresh employee list
            } catch (err: any) {
                console.error('Error deleting employee:', err);
                setError('Failed to delete employee.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleViewEmployeeClick = (employee: Employee) => {
        setViewingEmployeeId(employee.id);
        setIsCreatingEmployee(false);
        setEditingEmployeeId(null);
    };

    const handleCancelViewEmployee = () => {
        setViewingEmployeeId(null);
    };

    const isEmployeeFormActive = isCreatingEmployee || editingEmployeeId || viewingEmployeeId;

    return (
        <div className={styles['employee-list-container']}>
            <div className={styles['section-header']}>
                <h2>Employees for Department ID: {departmentId}</h2>
                {!isEmployeeFormActive && (
                    <button onClick={handleAddEmployeeClick} className={styles['add-employee-button']} disabled={loading}>
                        Add New Employee
                    </button>
                )}
            </div>

            <Link to={`/companies/${companyId}`} className={styles['back-button']}>
                Back to Company Details
            </Link>

            {error && <p className={styles['error-message']}>{error}</p>}
            {loading && <p className={styles['loading-text']}>Loading employees...</p>}

            {isCreatingEmployee && departmentId ? (
                <EmployeeCreate
                    departmentId={departmentId}
                    onEmployeeCreated={handleEmployeeCreated}
                    onCancel={handleCancelCreateEmployee}
                />
            ) : isCreatingEmployee && !departmentId ? (
                <p className={styles['error-message']}>Error: Department ID is missing.</p>
            ) : null}

            {editingEmployeeId && (
                <div className={styles['form-container']}>
                    <h3>Edit Employee</h3>
                    <form onSubmit={(e) => handleUpdateEmployee(editingEmployeeId, e)}>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-name-${editingEmployeeId}`}>First Name:</label>
                            <input
                                type="text"
                                id={`edit-name-${editingEmployeeId}`}
                                name="name"
                                value={editEmployeeFormData.name}
                                onChange={handleEditFormChange}
                                required
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-surname-${editingEmployeeId}`}>Last Name:</label>
                            <input
                                type="text"
                                id={`edit-surname-${editingEmployeeId}`}
                                name="surname"
                                value={editEmployeeFormData.surname}
                                onChange={handleEditFormChange}
                                required
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-email-${editingEmployeeId}`}>Email:</label>
                            <input
                                type="email"
                                id={`edit-email-${editingEmployeeId}`}
                                name="email"
                                value={editEmployeeFormData.email}
                                onChange={handleEditFormChange}
                                required
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-position-${editingEmployeeId}`}>Position:</label>
                            <input
                                type="text"
                                id={`edit-position-${editingEmployeeId}`}
                                name="position"
                                value={editEmployeeFormData.position}
                                onChange={handleEditFormChange}
                                required
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-age-${editingEmployeeId}`}>Age:</label>
                            <input
                                type="number"
                                id={`edit-age-${editingEmployeeId}`}
                                name="age"
                                value={editEmployeeFormData.age}
                                onChange={handleEditFormChange}
                                required
                                min="18"
                                max="100" // Assuming the same validation as create
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-gender-${editingEmployeeId}`}>Gender:</label>
                            <select
                                id={`edit-gender-${editingEmployeeId}`}
                                name="gender"
                                value={editEmployeeFormData.gender}
                                onChange={handleEditFormChange}
                                required
                            >
                                <option value={GenderType.Male}>Male</option>
                                <option value={GenderType.Female}>Female</option>
                                <option value={GenderType.Other}>Other</option>
                            </select>
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-trainingId-${editingEmployeeId}`}>Training ID (Optional):</label>
                            <input
                                type="text"
                                id={`edit-trainingId-${editingEmployeeId}`}
                                name="trainingId"
                                value={editEmployeeFormData.trainingId}
                                onChange={handleEditFormChange}
                            />
                        </div>
                        <div className={styles['form-buttons']}>
                            <button type="submit" className={styles['action-button']} disabled={loading}>
                                {loading ? 'Updating...' : 'Update Employee'}
                            </button>
                            <button type="button" onClick={handleCancelEditEmployee} className={styles['secondary-button']} disabled={loading}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {viewingEmployeeId && (
                <div>{/* Component to display employee details - You'll need to create this */}</div>
            )}

            {employees.length > 0 ? (
                <div className={styles['table-wrapper']}>
                    <table className={styles['data-table']}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Position</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((employee) => (
                                <tr key={employee.id}>
                                    <td>{employee.firstName} {employee.lastName}</td>
                                    <td>{employee.email}</td>
                                    <td>{employee.position}</td>
                                    <td className={styles['actions-cell']}>
                                        <button className={`${styles['action-button']} ${styles['view-button']}`} onClick={() => handleViewEmployeeClick(employee)} disabled={loading}>
                                            View
                                        </button>
                                        <button className={`${styles['action-button']} ${styles['edit-button']}`} onClick={() => handleEditEmployeeClick(employee)} disabled={loading}>
                                            Edit
                                        </button>
                                        <button className={`${styles['action-button']} ${styles['delete-button']}`} onClick={() => handleDeleteEmployee(employee.id)} disabled={loading}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>No employees found for this department.</p>
            )}
        </div>
    );
};

export default EmployeeList;