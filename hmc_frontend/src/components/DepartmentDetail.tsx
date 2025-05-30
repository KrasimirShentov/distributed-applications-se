import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Department, Employee, EmployeeRequest, GenderType, Training } from '../types/Types';
import styles from './CSSComponents/DepartmentDetail.module.css'; // Import the new CSS module
import EmployeeCreate from './EmployeeCreate';

const DepartmentDetail: React.FC = () => {
    const { companyId, departmentId } = useParams<{ companyId: string; departmentId: string }>();
    const navigate = useNavigate();

    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Department Edit State
    const [isEditingDepartment, setIsEditingDepartment] = useState<boolean>(false);
    const [editDepartmentFormData, setEditDepartmentFormData] = useState<Omit<Department, 'id' | 'addresses' | 'employees'> | null>(null);
    const [editDepartmentAddressName, setEditDepartmentAddressName] = useState<string>(''); // For department address

    // Employee States
    const [isCreatingEmployee, setIsCreatingEmployee] = useState<boolean>(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
    const [editEmployeeFormData, setEditEmployeeFormData] = useState<Omit<EmployeeRequest, 'departmentId'>>({
        name: '',
        surname: '',
        age: 18,
        email: '',
        position: '',
        gender: GenderType.Male,
        trainingId: '',
    });
    const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null);
    const [viewEmployeeData, setViewEmployeeData] = useState<Employee | null>(null);
    const [employeeToDeleteId, setEmployeeToDeleteId] = useState<string | null>(null);
    const [showEmployeeDeleteConfirm, setShowEmployeeDeleteConfirm] = useState<boolean>(false);
    const [availableTrainings, setAvailableTrainings] = useState<Training[]>([]);

    const fetchDepartmentDetails = useCallback(async () => {
        if (!departmentId) {
            setMessage({ text: 'Department ID is missing.', type: 'error' });
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setMessage(null);

            const departmentResponse = await api.get<any>(`/Department/${departmentId}`);
            const departmentData = departmentResponse.data;

            // Map backend DTO to frontend Employee type
            const mappedEmployees = departmentData.employees?.map((emp: any) => ({
                id: emp.id,
                firstName: emp.name, // Map 'Name' from backend to 'firstName'
                lastName: emp.surname, // Map 'Surname' from backend to 'lastName'
                age: emp.age,
                email: emp.email,
                position: emp.position,
                gender: emp.gender, // Assuming this is already mapped to GenderType enum
                departmentId: departmentData.id,
                departmentDetails: departmentData.departmentDetails ? {
                    id: departmentData.departmentDetails.id,
                    name: departmentData.departmentDetails.name,
                    email: departmentData.departmentDetails.email,
                    type: departmentData.departmentDetails.type,
                    phoneNumber: departmentData.departmentDetails.phoneNumber,
                    description: departmentData.departmentDetails.description,
                } : undefined,
                trainingDetails: emp.trainingDTO ? { // Map 'trainingDTO' to 'trainingDetails'
                    id: emp.trainingDTO.id,
                    type: emp.trainingDTO.type,
                    positionName: emp.trainingDTO.positionName,
                    description: emp.trainingDTO.description,
                    trainingHours: emp.trainingDTO.trainingHours,
                } : null,
            })) || [];

            const mappedDepartment: Department = {
                id: departmentData.id,
                name: departmentData.name,
                description: departmentData.description || '',
                email: departmentData.email || '',
                phoneNumber: departmentData.phoneNumber || '',
                type: departmentData.type || '',
                companyId: departmentData.companyID,
                companyName: departmentData.companyName || '',
                companyDescription: departmentData.companyDescription || '',
                addresses: departmentData.addresses?.map((addr: any) => ({ addressName: addr.addressName })) || [],
                employees: mappedEmployees,
            };
            setDepartment(mappedDepartment);

            setEditDepartmentFormData({
                name: mappedDepartment.name,
                description: mappedDepartment.description,
                email: mappedDepartment.email,
                phoneNumber: mappedDepartment.phoneNumber,
                type: mappedDepartment.type,
                companyId: mappedDepartment.companyId, // Add the missing companyId
                companyName: mappedDepartment.companyName, // Optional, but good to include if available
                companyDescription: mappedDepartment.companyDescription, // Optional, but good to include if available
            });
            if (mappedDepartment.addresses && mappedDepartment.addresses.length > 0) {
                setEditDepartmentAddressName(mappedDepartment.addresses[0].addressName);
            } else {
                setEditDepartmentAddressName('');
            }

            // Fetch all available trainings for the dropdowns (both employee create/edit)
            const trainingsResponse = await api.get<Training[]>('/Training');
            setAvailableTrainings(trainingsResponse.data);

        } catch (err: any) {
            console.error('Error fetching department details or trainings:', err);
            let errorMsg = 'An unexpected error occurred.';
            if (err.response) {
                if (err.response.status === 404) {
                    errorMsg = 'Department or associated data not found.';
                } else {
                    errorMsg = `Failed to load data: ${err.response.data?.message || err.message}`;
                }
            } else if (err.request) {
                errorMsg = 'No response from server. Check network connection.';
            } else {
                errorMsg = 'Error setting up request.';
            }
            setMessage({ text: errorMsg, type: 'error' });
            if (err.response?.status === 404 && companyId) {
                setTimeout(() => navigate(`/companies/${companyId}`), 3000);
            }
        } finally {
            setLoading(false);
        }
    }, [departmentId, companyId, navigate]);

    useEffect(() => {
        fetchDepartmentDetails();
    }, [fetchDepartmentDetails]);

    // Department Actions
    const handleEditDepartmentClick = () => {
        setIsEditingDepartment(true);
        setMessage(null);
    };

    const handleCancelEditDepartment = () => {
        setIsEditingDepartment(false);
        if (department) {
            setEditDepartmentFormData({
                name: department.name,
                description: department.description,
                email: department.email,
                phoneNumber: department.phoneNumber,
                type: department.type,
                companyId: department.companyId, // Add companyId here
            });
            if (department.addresses && department.addresses.length > 0) {
                setEditDepartmentAddressName(department.addresses[0].addressName);
            } else {
                setEditDepartmentAddressName('');
            }
        }
        setMessage(null);
    };

    const handleDepartmentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setMessage(null);
        if (name === "departmentAddressName") {
            setEditDepartmentAddressName(value);
        } else {
            setEditDepartmentFormData(prev => ({
                ...prev!,
                [name]: value
            }));
        }
    };

    const handleUpdateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editDepartmentFormData || !departmentId) {
            setMessage({ text: "Form data or Department ID is missing for update.", type: 'error' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const updatePayload = {
                id: departmentId,
                Name: editDepartmentFormData.name,
                Description: editDepartmentFormData.description,
                Email: editDepartmentFormData.email,
                PhoneNumber: editDepartmentFormData.phoneNumber,
                Type: editDepartmentFormData.type,
                CompanyID: department?.companyId,
                DepartmentAddresses: editDepartmentAddressName ? [{ addressName: editDepartmentAddressName }] : [],
            };

            await api.put(`/Department/${departmentId}`, updatePayload);
            setIsEditingDepartment(false);
            await fetchDepartmentDetails();
            setMessage({ text: 'Department updated successfully!', type: 'success' });
        } catch (err: any) {
            console.error('Error updating department:', err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || err.response?.data || err.message || 'Unknown error during update.';
            setMessage({ text: `Failed to update department: ${errorMsg}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDepartment = async () => {
        if (!departmentId) return;

        if (window.confirm('Are you sure you want to delete this department and all its associated employees? This action cannot be undone.')) {
            setLoading(true);
            setMessage(null);
            try {
                await api.delete(`/Department/${departmentId}`);
                setMessage({ text: 'Department deleted successfully!', type: 'success' });
                setTimeout(() => navigate(`/companies/${companyId}`), 2000);
            } catch (err: any) {
                console.error('Error deleting department:', err);
                setMessage({ text: `Failed to delete department: ${err.response?.data?.message || err.message}`, type: 'error' });
                setLoading(false);
            }
        }
    };

    // Employee Actions (Inline)
    const handleAddEmployeeClick = () => {
        setIsCreatingEmployee(true);
        setEditingEmployeeId(null);
        setViewingEmployeeId(null);
        setMessage(null);
    };

    const handleEmployeeCreated = () => {
        setIsCreatingEmployee(false);
        fetchDepartmentDetails(); // Refresh department details to get updated employee list
    };

    const handleCancelCreateEmployee = () => {
        setIsCreatingEmployee(false);
    };

    const handleEditEmployeeClick = (employee: Employee) => {
        setEditingEmployeeId(employee.id);
        setEditEmployeeFormData({
            name: employee.firstName,
            surname: employee.lastName,
            age: employee.age,
            email: employee.email,
            position: employee.position,
            gender: employee.gender,
            trainingId: employee.trainingDetails?.id || '',
        });
        setIsCreatingEmployee(false);
        setViewingEmployeeId(null);
        setMessage(null);
    };

    const handleCancelEditEmployee = () => {
        setEditingEmployeeId(null);
        setMessage(null);
    };

    const handleEditEmployeeFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setMessage(null);
        setEditEmployeeFormData(prev => {
            if (!prev) return prev;

            if (name === "age") {
                return { ...prev, [name]: parseInt(value) || 0 };
            } else if (name === "gender") {
                return { ...prev, [name]: value as GenderType }; // Cast directly as values match enum keys
            } else if (name === "trainingId") { // This is the actual ID from the select
                return { ...prev, [name]: value };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleUpdateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmployeeId || !editEmployeeFormData) {
            setMessage({ text: "Employee data or ID is missing for update.", type: 'error' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const updatePayload = {
                ...editEmployeeFormData,
                departmentId: departmentId,
                trainingId: editEmployeeFormData.trainingId || null,
            };

            await api.put(`/Employee/${editingEmployeeId}`, updatePayload);
            setIsCreatingEmployee(false);
            await fetchDepartmentDetails();
            setMessage({ text: 'Employee updated successfully!', type: 'success' });
        } catch (err: any) {
            console.error('Error updating employee:', err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || err.response?.data || err.message || 'Unknown error during update.';
            setMessage({ text: `Failed to update employee: ${errorMsg}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEmployee = (employeeId: string) => {
        setEmployeeToDeleteId(employeeId);
        setShowEmployeeDeleteConfirm(true);
        setMessage(null);
    };

    const confirmDeleteEmployee = async () => {
        setShowEmployeeDeleteConfirm(false);
        if (!employeeToDeleteId) return;

        setLoading(true);
        setMessage(null);
        try {
            await api.delete(`/Employee/${employeeToDeleteId}`);
            setMessage({ text: 'Employee deleted successfully!', type: 'success' });
            setEmployeeToDeleteId(null);
            await fetchDepartmentDetails();
        } catch (err: any) {
            console.error('Error deleting employee:', err);
            setMessage({ text: `Failed to delete employee: ${err.response?.data?.message || err.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const cancelEmployeeDelete = () => {
        setShowEmployeeDeleteConfirm(false);
        setEmployeeToDeleteId(null);
    };

    const handleViewEmployeeClick = (employee: Employee) => {
        setViewingEmployeeId(employee.id);
        setViewEmployeeData(employee);
        setIsCreatingEmployee(false);
        setEditingEmployeeId(null);
        setMessage(null);
    };

    const handleCancelViewEmployee = () => {
        setViewingEmployeeId(null);
        setViewEmployeeData(null);
    };

    const isAnyFormActive = isCreatingEmployee || isEditingDepartment || editingEmployeeId || viewingEmployeeId || showEmployeeDeleteConfirm;

    if (loading && !department) {
        return <p className={styles['loading-text']}>Loading department details...</p>;
    }

    if (!department) {
        return (
            <div className={styles['department-detail-page']}>
                {message && (
                    <div className={`${styles['message-container']} ${message.type === 'success' ? styles['success-text'] : styles['error-text']}`}>
                        {message.text}
                    </div>
                )}
                {!message && <p className={styles['no-data-text']}>No department data available or department not found.</p>}
                <Link to={`/companies/${companyId}`} className={styles['action-button']} style={{ marginTop: '20px' }}>
                    Back to Company
                </Link>
            </div>
        );
    }

    return (
        <div className={styles['department-detail-page']}>
            {message && (
                <div className={`${styles['message-container']} ${message.type === 'success' ? styles['success-text'] : styles['error-text']}`}>
                    {message.text}
                </div>
            )}

            {isEditingDepartment ? (
                <form onSubmit={handleUpdateDepartment} className={styles['form-container']}>
                    <h2 className={styles['section-header']}>Edit Department: {department.name}</h2>
                    <div className={styles['form-group']}>
                        <label htmlFor="name">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={editDepartmentFormData?.name || ''}
                            onChange={handleDepartmentFormChange}
                            required
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={editDepartmentFormData?.description || ''}
                            onChange={handleDepartmentFormChange}
                            rows={3}
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={editDepartmentFormData?.email || ''}
                            onChange={handleDepartmentFormChange}
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="phoneNumber">Phone Number:</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={editDepartmentFormData?.phoneNumber || ''}
                            onChange={handleDepartmentFormChange}
                        />
                    </div>
                    <div className={styles['form-group']}>
                    <label htmlFor="type">Type:</label> 
                    <input
                        type="text"
                        id="type"
                        name="type"
                        value={editDepartmentFormData?.type || ''}
                        onChange={handleDepartmentFormChange}
                        required
                    />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="departmentAddressName">Address:</label>
                        <input
                            type="text"
                            id="departmentAddressName"
                            name="departmentAddressName"
                            value={editDepartmentAddressName || ''}
                            onChange={handleDepartmentFormChange}
                            required
                        />
                    </div>
                    <div className={styles['form-buttons']}>
                        <button type="submit" className={`${styles['action-button']} ${styles['primary']}`} disabled={loading}>Save Changes</button>
                        <button type="button" onClick={handleCancelEditDepartment} className={`${styles['action-button']} ${styles['secondary']}`} disabled={loading}>Cancel</button>
                    </div>
                </form>
            ) : (
                <>
                    <div className={styles['section-header']}>
                        <h1>{department.name} Department</h1>
                        <div className={styles['detail-actions']}>
                            <button onClick={handleEditDepartmentClick} className={`${styles['action-button']} ${styles['edit']}`}>Edit Department</button>
                            <button onClick={handleDeleteDepartment} className={`${styles['action-button']} ${styles['danger']}`}>Delete Department</button>
                        </div>
                    </div>

                    <div className={styles['detail-info']}>
                        <p><strong>Description:</strong> {department.description || 'N/A'}</p>
                        <p><strong>Email:</strong> {department.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {department.phoneNumber || 'N/A'}</p>
                        <p><strong>Type:</strong> {department.type || 'N/A'}</p>
                        <p>
                            <strong>Company:</strong>{' '}
                            <Link to={`/companies/${companyId}`}>
                                {department.companyName || 'N/A'}
                            </Link>
                        </p>
                    </div>

                    <h3 className={styles['section-header']} style={{ marginTop: '30px', fontSize: '1.5em' }}>Addresses</h3>
                    {department.addresses && department.addresses.length > 0 ? (
                        <ul className={styles['address-list']}>
                            {department.addresses.map((address, index) => (
                                <li key={index}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                                    </svg>
                                    {address.addressName}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles['no-data-text']}>No addresses found for this department.</p>
                    )}

                    <h3 className={styles['section-header']} style={{ marginTop: '30px', fontSize: '1.5em' }}>
                        Employees
                        {!isAnyFormActive && (
                            <button onClick={handleAddEmployeeClick} className={`${styles['action-button']} ${styles['primary']}`}>
                                Add New Employee
                            </button>
                        )}
                    </h3>

                    {isCreatingEmployee && departmentId ? (
                        <div className={styles['form-container']}>
                            <EmployeeCreate
                                departmentId={departmentId}
                                onEmployeeCreated={handleEmployeeCreated}
                                onCancel={handleCancelCreateEmployee}
                            />
                        </div>
                    ) : editingEmployeeId && editEmployeeFormData ? (
                        <div className={styles['form-container']}>
                            <h3 className={styles['section-header']}>Edit Employee</h3>
                            <form onSubmit={handleUpdateEmployee}>
                                <div className={styles['form-group']}>
                                    <label htmlFor="edit-emp-name">First Name:</label>
                                    <input
                                        type="text"
                                        id="edit-emp-name"
                                        name="name"
                                        value={editEmployeeFormData.name}
                                        onChange={handleEditEmployeeFormChange}
                                        required
                                    />
                                </div>
                                <div className={styles['form-group']}>
                                    <label htmlFor="edit-emp-surname">Last Name:</label>
                                    <input
                                        type="text"
                                        id="edit-emp-surname"
                                        name="surname"
                                        value={editEmployeeFormData.surname}
                                        onChange={handleEditEmployeeFormChange}
                                        required
                                    />
                                </div>
                                <div className={styles['form-group']}>
                                    <label htmlFor="edit-emp-age">Age:</label>
                                    <input
                                        type="number"
                                        id="edit-emp-age"
                                        name="age"
                                        value={editEmployeeFormData.age}
                                        onChange={handleEditEmployeeFormChange}
                                        required
                                        min="18"
                                        max="100"
                                    />
                                </div>
                                <div className={styles['form-group']}>
                                    <label htmlFor="edit-emp-email">Email:</label>
                                    <input
                                        type="email"
                                        id="edit-emp-email"
                                        name="email"
                                        value={editEmployeeFormData.email}
                                        onChange={handleEditEmployeeFormChange}
                                        required
                                    />
                                </div>
                                <div className={styles['form-group']}>
                                    <label htmlFor="edit-emp-position">Position:</label>
                                    <input
                                        type="text"
                                        id="edit-emp-position"
                                        name="position"
                                        value={editEmployeeFormData.position}
                                        onChange={handleEditEmployeeFormChange}
                                        required
                                    />
                                </div>
                                <div className={styles['form-group']}>
                                    <label htmlFor="edit-emp-gender">Gender:</label>
                                    <select
                                        id="edit-emp-gender"
                                        name="gender"
                                        value={editEmployeeFormData.gender}
                                        onChange={handleEditEmployeeFormChange}
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        {Object.keys(GenderType)
                                            .filter(key => isNaN(Number(key)))
                                            .map(key => (
                                                <option key={key} value={key}>
                                                    {key}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className={styles['form-group']}>
                                    <label htmlFor="edit-emp-training">Assigned Training:</label>
                                    <select
                                        id="edit-emp-training"
                                        name="trainingId"
                                        value={editEmployeeFormData.trainingId || ''}
                                        onChange={handleEditEmployeeFormChange}
                                    >
                                        <option value="">No Training Assigned</option>
                                        {availableTrainings.map(training => (
                                            <option key={training.id} value={training.id}>
                                                {training.type} - {training.positionName} ({training.trainingHours} hrs)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles['form-buttons']}>
                                    <button type="submit" className={`${styles['action-button']} ${styles['primary']}`} disabled={loading}>
                                        {loading ? 'Updating...' : 'Update Employee'}
                                    </button>
                                    <button type="button" onClick={handleCancelEditEmployee} className={`${styles['action-button']} ${styles['secondary']}`} disabled={loading}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : viewingEmployeeId && viewEmployeeData ? (
                        <div className={styles['form-container']}>
                            <h3 className={styles['section-header']}>Employee Details: {viewEmployeeData.firstName} {viewEmployeeData.lastName}</h3>
                            <p><strong>Age:</strong> {viewEmployeeData.age}</p>
                            <p><strong>Email:</strong> {viewEmployeeData.email}</p>
                            <p><strong>Position:</strong> {viewEmployeeData.position}</p>
                            <p><strong>Gender:</strong> {GenderType[viewEmployeeData.gender]}</p>
                            <p>
                                <strong>Assigned Training:</strong>{' '}
                                {viewEmployeeData.trainingDetails ? (
                                    `${viewEmployeeData.trainingDetails.type} - ${viewEmployeeData.trainingDetails.positionName} (${viewEmployeeData.trainingDetails.trainingHours} hrs)`
                                ) : 'N/A'}
                            </p>
                            <div className={styles['form-buttons']}>
                                <button type="button" onClick={handleCancelViewEmployee} className={`${styles['action-button']} ${styles['secondary']}`}>
                                    Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        <ul className={styles['employee-list']}>
                            {department.employees && department.employees.map(employee => (
                                <li key={employee.id} className={styles['employee-item']}>
                                    <div className={styles['employee-info']}>
                                        <strong>{employee.firstName} {employee.lastName}</strong> ({employee.position})
                                    </div>
                                    <div className={styles['employee-actions']}>
                                        <button onClick={() => handleViewEmployeeClick(employee)} className={`${styles['action-button']} ${styles['view']}`}>View</button>
                                        <button onClick={() => handleEditEmployeeClick(employee)} className={`${styles['action-button']} ${styles['edit']}`}>Edit</button>
                                        <button onClick={() => handleDeleteEmployee(employee.id)} className={`${styles['action-button']} ${styles['danger']}`}>Delete</button>
                                    </div>
                                </li>
                            ))}
                            {department.employees && department.employees.length === 0 && (
                                <li className={styles['no-data-text']}>No employees in this department.</li>
                            )}
                        </ul>
                    )}

                    {showEmployeeDeleteConfirm && employeeToDeleteId && (
                        <div className={styles['confirmation-modal']}>
                            <p>Are you sure you want to delete employee with ID: {employeeToDeleteId}?</p>
                            <div className={styles['form-buttons']}>
                                <button onClick={confirmDeleteEmployee} className={`${styles['action-button']} ${styles['danger']}`}>Confirm Delete</button>
                                <button onClick={cancelEmployeeDelete} className={`${styles['action-button']} ${styles['secondary']}`}>Cancel</button>
                            </div>
                        </div>
                    )}

                    <Link to={`/companies/${companyId}`} className={styles['action-button']} style={{ marginTop: '20px' }}>
                        Back to Company
                    </Link>
                </>
            )}
        </div>
    );
};

export default DepartmentDetail;