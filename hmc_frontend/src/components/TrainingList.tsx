// src/components/TrainingList.tsx
import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Training, TrainingRequest } from '../types/Types';
import TrainingCreate from './TrainingCreate';
import styles from './CSSComponents/TrainingList.module.css';

const TrainingList: React.FC = () => {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<TrainingRequest>({
        type: '',
        positionName: '',
        description: '',
        trainingHours: 0,
    });
    const [viewingId, setViewingId] = useState<string | null>(null);
    const [viewFormData, setViewFormData] = useState<Training>({
        id: '',
        type: '',
        positionName: '',
        description: '',
        trainingHours: 0,
    });

    const fetchTrainings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<Training[]>('/Training');
            setTrainings(response.data);
        } catch (err: any) {
            console.error('Error fetching trainings:', err.response?.data || err.message);
            let errorMessage = 'Failed to load trainings. An unknown error occurred.';
            if (err.response) {
                errorMessage = `Failed to load trainings: ${err.response.data.message || err.response.statusText}`;
            } else if (err.request) {
                errorMessage = 'Failed to load trainings: No response from server. Check network connection.';
            } else {
                errorMessage = `Failed to load trainings: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrainings();
    }, [fetchTrainings]);

    const handleTrainingCreated = () => {
        setShowCreateForm(false);
        fetchTrainings();
    };

    const handleEditClick = (training: Training) => {
        setEditingId(training.id);
        setEditFormData({
            type: training.type,
            positionName: training.positionName,
            description: training.description || '',
            trainingHours: training.trainingHours,
        });
        setViewingId(null); // Close view form if open
        setShowCreateForm(false); // Close create form if open
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: name === 'trainingHours' ? parseInt(value) || 0 : value,
        }));
    };

    const handleUpdateTraining = async (id: string, e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!editFormData.type || !editFormData.positionName || editFormData.trainingHours <= 0) {
            setError('Please fill in all required fields and ensure Training Hours is a positive number.');
            setLoading(false);
            return;
        }

        try {
            await api.put(`/Training/${id}`, editFormData);
            alert('Training updated successfully!');
            setEditingId(null);
            fetchTrainings();
        } catch (err: any) {
            console.error('Error updating training:', err.response?.data || err.message);
            let errorMessage = 'Failed to update training. An unknown error occurred.';
            if (err.response) {
                if (typeof err.response.data === 'string') {
                    errorMessage = `Failed to update training: ${err.response.data}`;
                } else if (err.response.data && err.response.data.message) {
                    errorMessage = `Failed to update training: ${err.response.data.message}`;
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
                errorMessage = 'Failed to update training: No response from server. Check network connection.';
            } else {
                errorMessage = `Failed to update training: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleDeleteTraining = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this training? This action cannot be undone.')) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await api.delete(`/Training/${id}`);
            alert('Training deleted successfully!');
            fetchTrainings();
        } catch (err: any) {
            console.error('Error deleting training:', err.response?.data || err.message);
            // Error handling as before
        } finally {
            setLoading(false);
        }
    };

    const handleViewClick = (training: Training) => {
        setViewingId(training.id);
        setViewFormData(training);
        setEditingId(null); // Close edit form if open
        setShowCreateForm(false); // Close create form if open
    };

    const handleCancelView = () => {
        setViewingId(null);
    };

    const handleCancelCreate = () => {
        setShowCreateForm(false);
    };

    if (loading) {
        return <div className={styles['loading-text']}>Loading trainings...</div>;
    }

    if (error) {
        return <div className={styles['error-text']}>Error: {error}</div>;
    }

    // Determine if any form (create, edit, view) is active
    const isFormActive = showCreateForm || editingId || viewingId;

    return (
        <div className={styles['list-container']}>
            <h2 className={styles['section-header']}>Trainings</h2>

            {/* "Add New Training" button is hidden when any form is active */}
            {!isFormActive && (
                <button className={`action-button primary ${styles['add-button']}`} onClick={() => setShowCreateForm(true)}>
                    Add New Training
                </button>
            )}

            {/* TrainingCreate form */}
            {showCreateForm && (
                <TrainingCreate
                    onTrainingCreated={handleTrainingCreated}
                    onCancel={handleCancelCreate}
                />
            )}

            {/* View Training form */}
            {viewingId && (
                <div className={styles['edit-form']}> {/* Reusing edit-form styles */}
                    <h3 className={styles['section-subheader']}>View Training</h3>
                    <div className={styles['form-group']}>
                        <label>Type:</label>
                        <input type="text" value={viewFormData.type} readOnly />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Position Name:</label>
                        <input type="text" value={viewFormData.positionName} readOnly />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Description:</label>
                        <textarea value={viewFormData.description || 'N/A'} readOnly rows={3} />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Training Hours:</label>
                        <input type="number" value={viewFormData.trainingHours} readOnly />
                    </div>
                    <div className={styles['form-buttons']}>
                        <button type="button" onClick={handleCancelView} className={`action-button secondary`}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Training form */}
            {editingId && (
                <div className={styles['edit-form']}>
                    <h3 className={styles['section-subheader']}>Edit Training</h3>
                    <form onSubmit={(e) => handleUpdateTraining(editingId, e)} className={styles['edit-form']}>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-type-${editingId}`}>Type:</label>
                            <input
                                type="text"
                                id={`edit-type-${editingId}`}
                                name="type"
                                value={editFormData.type}
                                onChange={handleEditFormChange}
                                required
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-positionName-${editingId}`}>Position Name:</label>
                            <input
                                type="text"
                                id={`edit-positionName-${editingId}`}
                                name="positionName"
                                value={editFormData.positionName}
                                onChange={handleEditFormChange}
                                required
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
                        <div className={styles['form-group']}>
                            <label htmlFor={`edit-trainingHours-${editingId}`}>Training Hours:</label>
                            <input
                                type="number"
                                id={`edit-trainingHours-${editingId}`}
                                name="trainingHours"
                                value={editFormData.trainingHours}
                                onChange={handleEditFormChange}
                                required
                                min="1"
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

            {/* List of existing trainings (table) is hidden when any form is active */}
            {trainings.length > 0 && !isFormActive && (
                <div className={styles['table-wrapper']}>
                    <table className={styles['data-table']}>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Position Name</th>
                                <th>Description</th>
                                <th>Hours</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trainings.map(training => (
                                <tr key={training.id}>
                                    <td>{training.type}</td>
                                    <td>{training.positionName}</td>
                                    <td className={styles['description-cell']}>{training.description || 'N/A'}</td>
                                    <td>{training.trainingHours}</td>
                                    <td className={styles['actions-cell']}>
                                        <button
                                            className={`action-button primary ${styles['view-button']} ${styles['small-margin-right']}`}
                                            onClick={() => handleViewClick(training)}
                                            disabled={loading}
                                        >
                                            View
                                        </button>
                                        <button
                                            className={`action-button primary ${styles['edit-button']} ${styles['small-margin-right']}`}
                                            onClick={() => handleEditClick(training)}
                                            disabled={loading}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className={`action-button danger ${styles['delete-button']}`}
                                            onClick={() => handleDeleteTraining(training.id)}
                                            disabled={loading}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* "No trainings found" message is hidden when any form is active */}
            {trainings.length === 0 && !isFormActive && (
                <p>No trainings found.</p>
            )}
        </div>
    );
};

export default TrainingList;
