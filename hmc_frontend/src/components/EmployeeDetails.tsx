// src/components/EmployeeDetail.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Employee, GenderType, Training } from '../types/Types';

const EmployeeDetail: React.FC = () => {
    const { companyId, departmentId, employeeId } = useParams<{ companyId: string; departmentId: string; employeeId: string }>();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editFormData, setEditFormData] = useState<Employee | null>(null);
    const [availableTrainings, setAvailableTrainings] = useState<Training[]>([]);

    // For delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    const fetchEmployeeDetails = useCallback(async () => {
        if (!employeeId) {
            setMessage({text: 'Employee ID is missing.', type: 'error'});
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setMessage(null); // Clear previous messages

            // Fetch employee details
            const employeeResponse = await api.get<Employee>(`/Employee/${employeeId}`);
            setEmployee(employeeResponse.data);
            setEditFormData(JSON.parse(JSON.stringify(employeeResponse.data))); // Deep copy for form editing

            // Fetch all available trainings for the dropdown
            const trainingsResponse = await api.get<Training[]>('/Training');
            setAvailableTrainings(trainingsResponse.data);

        } catch (err: any) {
            console.error('Error fetching employee details or trainings:', err);
            let errorMsg = 'An unexpected error occurred.';
            if (err.response) {
                if (err.response.status === 404) {
                    errorMsg = 'Employee or associated data not found.';
                } else {
                    errorMsg = `Failed to load data: ${err.response.data?.message || err.message}`;
                }
            } else if (err.request) {
                errorMsg = 'No response from server. Check network connection.';
            } else {
                errorMsg = 'Error setting up request.';
            }
            setMessage({text: errorMsg, type: 'error'});
            // If employee not found, navigate back or show a specific UI
            if (err.response?.status === 404 && departmentId && companyId) {
                 setTimeout(() => navigate(`/companies/${companyId}/departments/${departmentId}`), 3000);
            }
        } finally {
            setLoading(false);
        }
    }, [employeeId, companyId, departmentId, navigate]);

    useEffect(() => {
        fetchEmployeeDetails();
    }, [fetchEmployeeDetails]);

    const handleEditClick = () => {
        setIsEditing(true);
        // Ensure editFormData is a deep copy of the latest employee data
        setEditFormData(employee ? JSON.parse(JSON.stringify(employee)) : null);
        setMessage(null); // Clear messages when entering edit mode
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditFormData(employee ? JSON.parse(JSON.stringify(employee)) : null); // Revert any changes made in the form
        setMessage(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setMessage(null);
        setEditFormData(prev => {
            if (!prev) return null;

            let newFormData = { ...prev };

            if (name === "age") {
                newFormData = { ...newFormData, [name]: parseInt(value) || 0 };
            }
            else if (name === "gender") {
                newFormData = { ...newFormData, [name]: GenderType[value as keyof typeof GenderType] };
            } 
            else if (name === "trainingIdDropdown") {
                const selectedTraining = availableTrainings.find(t => t.id === value);
                newFormData = {
                    ...newFormData,
                    trainingDetails: selectedTraining || null, // Store the full training object or null
                };
            } else {
                newFormData = { ...newFormData, [name]: value };
            }
            return newFormData;
        });
    };

    const handleUpdateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editFormData || !employeeId) {
            setMessage({text: "Form data or Employee ID is missing for update.", type: 'error'});
            return;
        }
        
        setLoading(true);
        setMessage(null);

        try {
            // Construct the payload. Backend expects 'name' and 'surname'.
            // trainingID should be the ID string or null.
            const updatePayload = {
                id: editFormData.id,
                name: editFormData.firstName,
                surname: editFormData.lastName,
                age: editFormData.age,
                email: editFormData.email,
                position: editFormData.position,
                gender: GenderType[editFormData.gender], // Send string representation e.g., "Male"
                departmentId: editFormData.departmentId,
                trainingID: editFormData.trainingDetails?.id || null // Access the ID from trainingDetails
            };

            console.log("Sending Update Payload:", updatePayload); // For debugging

            await api.put(`/Employee/${employeeId}`, updatePayload);
            setIsEditing(false); // Exit edit mode
            await fetchEmployeeDetails(); // Re-fetch data to display updated details
            setMessage({text: 'Employee updated successfully!', type: 'success'});
        } catch (err: any) {
            console.error('Error updating employee:', err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || err.response?.data || err.message || 'Unknown error during update.';
            setMessage({text: `Failed to update employee: ${errorMsg}`, type: 'error'});
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEmployee = () => {
        if (!employeeId) return;
        setShowDeleteConfirm(true); // Show confirmation UI
        setMessage(null);
    };

    const confirmDeleteEmployee = async () => {
        setShowDeleteConfirm(false);
        if (!employeeId) return;
        
        setLoading(true);
        setMessage(null);
        try {
            await api.delete(`/Employee/${employeeId}`);
            setMessage({text: 'Employee deleted successfully!', type: 'success'});
            // Redirect after a short delay to allow message to be seen
            setTimeout(() => {
                if (companyId && departmentId) {
                    navigate(`/companies/${companyId}/departments/${departmentId}`);
                } else {
                    navigate(-1); // Go back if context is lost
                }
            }, 2000);
        } catch (err: any) {
            console.error('Error deleting employee:', err);
            setMessage({text: `Failed to delete employee: ${err.response?.data?.message || err.message}`, type: 'error'});
            setLoading(false);
        }
        // No setLoading(false) here if navigation occurs, to prevent state updates on unmounted component
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    if (loading && !employee) { // Show loading only if there's no employee data yet
        return <p className="loading-text">Loading employee details...</p>;
    }

    if (!employee || !editFormData) { // If error occurred and employee is null or not found
        return (
            <div className="company-list-container">
                {message && (
                    <div className={`message-container ${message.type === 'success' ? 'success-text' : 'error-text'}`}>
                        {message.text}
                    </div>
                )}
                {!message && <p className="no-data-text">No employee data available or employee not found.</p>}
                 <button onClick={() => navigate(`/companies/${companyId}/departments/${departmentId}`)} className="form-button" style={{ marginTop: '20px' }}>
                    Back to Department
                </button>
            </div>
        );
    }
    
    return (
        <div className="company-list-container">
            {/* Display Success/Error Messages */}
            {message && (
                <div className={`message-container ${message.type === 'success' ? 'success-text' : 'error-text'}`}>
                    {message.text}
                </div>
            )}

            {isEditing ? (
                <form onSubmit={handleUpdateEmployee} className="form-container">
                    <h2 className="section-header">Edit Employee: {employee.firstName} {employee.lastName}</h2>
                    
                    <div className="form-group">
                        <label htmlFor="firstName">First Name:</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={editFormData.firstName || ''}
                            onChange={handleFormChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">Last Name:</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={editFormData.lastName || ''}
                            onChange={handleFormChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="age">Age:</label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            value={editFormData.age || ''}
                            onChange={handleFormChange}
                            required
                            min="18"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={editFormData.email || ''}
                            onChange={handleFormChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="position">Position:</label>
                        <input
                            type="text"
                            id="position"
                            name="position"
                            value={editFormData.position || ''}
                            onChange={handleFormChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="gender">Gender:</label>
                        <select
                            id="gender"
                            name="gender"
                            value={editFormData.gender} // Bind to the numeric enum value
                            onChange={handleFormChange}
                            required
                        >
                            <option value="">Select Gender</option>
                            {Object.keys(GenderType)
                                .filter(key => !isNaN(Number(GenderType[key as keyof typeof GenderType])))
                                .map(key => (
                                    <option key={GenderType[key as keyof typeof GenderType]} value={GenderType[key as keyof typeof GenderType]}>
                                        {key}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Training Dropdown */}
                    <div className="form-group">
                        <label htmlFor="trainingIdDropdown">Assigned Training:</label>
                        <select
                            id="trainingIdDropdown"
                            name="trainingIdDropdown"
                            value={editFormData.trainingDetails?.id || ''} // Reflects current selection's ID
                            onChange={handleFormChange}
                            disabled={availableTrainings.length === 0 && loading}
                        >
                            <option value="">No Training Assigned</option>
                            {availableTrainings.map(training => (
                                <option key={training.id} value={training.id}>
                                    {training.type} - {training.positionName} ({training.trainingHours} hrs)
                                </option>
                            ))}
                        </select>
                        {availableTrainings.length === 0 && !loading && <small className="form-text text-muted">No trainings available to assign.</small>}
                    </div>

                    <div className="form-buttons">
                        <button type="submit" className="action-button primary" disabled={loading}>Save Changes</button>
                        <button type="button" onClick={handleCancelEdit} className="action-button secondary" disabled={loading}>Cancel</button>
                    </div>
                </form>
            ) : (
                <>
                    <h2 className="section-header">Employee Details: {employee.firstName} {employee.lastName}</h2>
                    <p><strong>Age:</strong> {employee.age}</p>
                    <p><strong>Email:</strong> {employee.email}</p>
                    <p><strong>Position:</strong> {employee.position}</p>
                    <p><strong>Gender:</strong> {GenderType[employee.gender]}</p>
                    <p>
                        <strong>Department:</strong>{' '}
                        {employee.departmentDetails ? (
                            <Link to={`/companies/${companyId}/departments/${employee.departmentDetails.id}`}>
                                {employee.departmentDetails.name}
                            </Link>
                        ) : 'N/A'}
                    </p>

                    <div className="detail-actions" style={{ marginBottom: '20px', marginTop: '20px' }}>
                        <button onClick={handleEditClick} className="action-button edit">Edit Employee</button>
                        <button onClick={handleDeleteEmployee} className="action-button danger">Delete Employee</button>
                    </div>

                    <h3 className="section-header" style={{ marginTop: '30px' }}>Assigned Training Details</h3>
                    {employee.trainingDetails ? (
                        <div className="training-details-box" style={{border: '1px solid #eee', padding: '15px', borderRadius: '4px', backgroundColor: '#f9f9f9'}}>
                            <p><strong>Type:</strong> {employee.trainingDetails.type}</p>
                            <p><strong>Position Name:</strong> {employee.trainingDetails.positionName}</p>
                            <p><strong>Description:</strong> {employee.trainingDetails.description}</p>
                            <p><strong>Training Hours:</strong> {employee.trainingDetails.trainingHours}</p>
                        </div>
                    ) : (
                        <p className="no-data-text">No training assigned to this employee.</p>
                    )}
                </>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="confirmation-dialog-overlay">
                    <div className="confirmation-dialog">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete employee: {employee.firstName} {employee.lastName}? This action cannot be undone.</p>
                        <div className="confirmation-dialog-buttons">
                            <button onClick={confirmDeleteEmployee} className="action-button danger" disabled={loading}>
                                {loading ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                            <button onClick={cancelDelete} className="action-button secondary" disabled={loading}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button 
                onClick={() => navigate(`/companies/${companyId}/departments/${departmentId}`)} 
                className="form-button" 
                style={{ marginTop: '30px', display: 'inline-block', padding: '10px 15px' }}
            >
                Back to Department
            </button>
        </div>
    );
};

export default EmployeeDetail;