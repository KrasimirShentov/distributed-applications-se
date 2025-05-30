// src/components/CompanyDetail.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Company, Department, Employee } from '../types/Types';
import DepartmentList from './DepartmentList';
import styles from './CSSComponents/CompanyDetail.module.css';

interface FoundEmployee {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    departmentName: string;
}

const CompanyDetail: React.FC = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditingCompany, setIsEditingCompany] = useState<boolean>(false);
    const [editCompanyFormData, setEditCompanyFormData] = useState<Omit<Company, 'id' | 'addresses' | 'departments'> | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const isDepartmentsPage = location.pathname.endsWith('/departments');

    // Search functionality state (employee)
    const [searchFirstName, setSearchFirstName] = useState<string>('');
    const [searchLastName, setSearchLastName] = useState<string>('');
    const [foundEmployee, setFoundEmployee] = useState<FoundEmployee | null>(null);
    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);

    // Search functionality state (department)
    const [searchDepartmentName, setSearchDepartmentName] = useState<string>('');
    const [searchDepartmentDescription, setSearchDepartmentDescription] = useState<string>('');
    const [foundDepartment, setFoundDepartment] = useState<Department | null>(null);
    const [isDepartmentPopupVisible, setIsDepartmentPopupVisible] = useState<boolean>(false);

    const fetchCompanyDetails = useCallback(async () => {
        if (!companyId) {
            setError('Company ID is missing.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await api.get<any>(`/Company/${companyId}`);
            const companyData = response.data;

            const mappedCompany: Company = {
                id: companyData.id,
                name: companyData.name,
                description: companyData.description || '',
                email: companyData.email || '',
                phoneNumber: companyData.phoneNumber || '',
                addresses: companyData.addresses?.map((addr: any) => ({ addressName: addr.addressName })) || [],
                departments: companyData.departments?.map((dept: any) => ({
                    id: dept.id,
                    name: dept.name,
                    description: dept.description || '',
                    email: dept.email || '',
                    phoneNumber: dept.phoneNumber || '',
                    type: dept.type || '',
                    companyId: dept.companyID,
                    companyName: dept.companyName || '',
                    companyDescription: dept.companyDescription || '',
                    addresses: dept.addresses?.map((addr: any) => ({ addressName: addr.addressName })) || [],
                    employees: dept.employees?.map((emp: any) => ({
                        id: emp.id,
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        age: emp.age,
                        email: emp.email,
                        position: emp.position,
                        gender: emp.gender,
                        departmentId: dept.id,
                        departmentDetails: emp.departmentDetails ? {
                            id: emp.departmentDetails.id,
                            name: emp.departmentDetails.name,
                            email: emp.departmentDetails.email,
                            type: emp.departmentDetails.type,
                            phoneNumber: emp.departmentDetails.phoneNumber,
                            description: emp.departmentDetails.description,
                        } : undefined,
                        trainingDetails: emp.trainingDto ? {
                            id: emp.trainingDto.id,
                            type: emp.trainingDto.type,
                            positionName: emp.trainingDto.positionName,
                            description: emp.trainingDto.description,
                            trainingHours: emp.trainingDto.trainingHours,
                        } : null,
                    })) || [],
                })) || [],
            };
            setCompany(mappedCompany);
            setEditCompanyFormData({
                name: mappedCompany.name,
                description: mappedCompany.description,
                email: mappedCompany.email,
                phoneNumber: mappedCompany.phoneNumber,
            });
        } catch (err: any) {
            console.error('Error fetching company details:', err);
            let errorMessage = 'Failed to load company details.';
            if (err.response) {
                errorMessage += ` Status: ${err.response.status}`;
                if (err.response.data) {
                    errorMessage += ` - ${JSON.stringify(err.response.data)}`;
                }
            } else if (err.request) {
                errorMessage += ' No response from server.';
            } else {
                errorMessage += ` ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [companyId, refreshTrigger]);

    useEffect(() => {
        fetchCompanyDetails();
    }, [fetchCompanyDetails]);

    const handleDepartmentChange = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleEditCompanyClick = () => {
        setIsEditingCompany(true);
    };

    const handleCancelEditCompany = () => {
        setIsEditingCompany(false);
        if (company) {
            setEditCompanyFormData({
                name: company.name,
                description: company.description,
                email: company.email,
                phoneNumber: company.phoneNumber,
            });
        }
    };

    const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditCompanyFormData(prev => ({
            ...prev!,
            [name]: value
        }));
    };

    const handleUpdateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editCompanyFormData || !companyId) return;

        try {
            await api.put(`/Company/${companyId}`, editCompanyFormData);
            alert('Company updated successfully!');
            setIsEditingCompany(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (err: any) {
            console.error('Error updating company:', err);
            let errorMessage = 'Failed to update company.';
            if (err.response) {
                errorMessage += ` Status: ${err.response.status}`;
                if (err.response.data) {
                    errorMessage += ` - ${JSON.stringify(err.response.data)}`;
                }
            } else if (err.request) {
                errorMessage += ' No response from server.';
            } else {
                errorMessage += ` ${err.message}`;
            }
            setError(errorMessage);
        }
    };

    const handleDeleteCompany = async () => {
        if (!companyId) return;

        if (window.confirm('Are you sure you want to delete this company and all its associated departments and employees? This action cannot be undone.')) {
            try {
                await api.delete(`/Company/${companyId}`);
                alert('Company deleted successfully!');
                navigate('/companies');
            } catch (err: any) {
                console.error('Error deleting company:', err);
                let errorMessage = 'Failed to delete company.';
                if (err.response) {
                    errorMessage += ` Status: ${err.response.status}`;
                    if (err.response.data) {
                        errorMessage += ` - ${JSON.stringify(err.response.data)}`;
                    }
                } else if (err.request) {
                    errorMessage += ' No response from server.';
                } else {
                    errorMessage += ` ${err.message}`;
                }
                setError(errorMessage);
            }
        }
    };

    // Employee search handlers
    const handleSearchFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchFirstName(e.target.value);
    };

    const handleSearchLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchLastName(e.target.value);
    };

    const handleSearchEmployee = () => {
        console.log('--- Starting Employee Search (Iterating ALL Departments and Employees) ---');
        console.log('Current Company State:', company);

        if (company && company.departments) {
            console.log('Departments Array:', company.departments);

            let foundEmployeeResult: FoundEmployee | null = null;

            for (const dept of company.departments) {
                console.log(`-- Checking Department: ${dept.name} (ID: ${dept.id}) --`);
                if (dept.employees) {
                    console.log('Employees in this Department:', dept.employees);
                    for (const emp of dept.employees) {
                        console.log('--- Checking Employee ---');
                        console.log('Employee First Name:', emp.firstName);
                        console.log('Search First Name:', searchFirstName);
                        console.log('Employee Last Name:', emp.lastName);
                        console.log('Search Last Name:', searchLastName);

                        const firstNameMatch = searchFirstName.toLowerCase().trim() === '' || emp.firstName.toLowerCase().trim().includes(searchFirstName.toLowerCase().trim());
                        const lastNameMatch = searchLastName.toLowerCase().trim() === '' || emp.lastName.toLowerCase().trim().includes(searchLastName.toLowerCase().trim());

                        if (firstNameMatch && lastNameMatch) {
                            console.log('*** EMPLOYEE FOUND ***:', emp);
                            foundEmployeeResult = {
                                firstName: emp.firstName,
                                lastName: emp.lastName,
                                email: emp.email,
                                position: emp.position,
                                departmentName: dept.name,
                            };
                            break; // Break out of the inner employee loop once found
                        } else {
                            console.log('No match for this employee.');
                        }
                    }
                } else {
                    console.log('No employees in this department.');
                }
                if (foundEmployeeResult) break; // Break out of the outer department loop once found (optimization)
            }

            if (foundEmployeeResult) {
                setFoundEmployee(foundEmployeeResult);
                setIsPopupVisible(true);
            } else {
                alert('No employee found with that first and last name.');
                setFoundEmployee(null);
                setIsPopupVisible(false);
            }
        } else {
            console.log('Company data or departments are not available.');
        }
        console.log('--- Employee Search End ---');
    };

    const closePopup = () => {
        setIsPopupVisible(false);
        setFoundEmployee(null);
    };

    // Department search handlers
    const handleSearchDepartmentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchDepartmentName(e.target.value);
    };

    const handleSearchDepartmentDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchDepartmentDescription(e.target.value);
    };

    const handleSearchDepartment = () => {
        console.log('--- Starting Department Search (by Name and Description) ---');
        console.log('Current Company State:', company);

        if (company && company.departments) {
            console.log('Departments Array:', company.departments);

            const foundDept = company.departments.find(dept => {
                const nameMatch = searchDepartmentName.toLowerCase().trim() === '' || dept.name.toLowerCase().trim().includes(searchDepartmentName.toLowerCase().trim());
                const descriptionMatch = searchDepartmentDescription.toLowerCase().trim() === '' || (dept.description || '').toLowerCase().trim().includes(searchDepartmentDescription.toLowerCase().trim());
                return nameMatch && descriptionMatch;
            });

            if (foundDept) {
                console.log('*** DEPARTMENT FOUND ***:', foundDept);
                setFoundDepartment(foundDept);
                setIsDepartmentPopupVisible(true);
            } else {
                alert('No department found with that name and description.');
                setFoundDepartment(null);
                setIsDepartmentPopupVisible(false);
            }
        } else {
            console.log('Company data or departments are not available.');
        }
        console.log('--- Department Search End ---');
    };

    const closeDepartmentPopup = () => {
        setIsDepartmentPopupVisible(false);
        setFoundDepartment(null);
    };

    if (loading) {
        return <p className={styles['loading-text']}>Loading company details...</p>;
    }

    if (error) {
        return <p className={styles['error-text']}>Error: {error}</p>;
    }

    if (!company) {
        return <p className={styles['no-data-text']}>No company data available.</p>;
    }

    return (
        <div className={styles['company-detail-container']}>
            {isEditingCompany ? (
                <form onSubmit={handleUpdateCompany} className={styles['form-container']}>
                    <h2 className={styles['section-header']}>Edit Company: {company.name}</h2>
                    <div className={styles['form-group']}>
                        <label htmlFor="name">Name:</label>
                        <input type="text" id="name" name="name" value={editCompanyFormData?.name || ''} onChange={handleCompanyFormChange} required />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="description">Description:</label>
                        <textarea id="description" name="description" value={editCompanyFormData?.description || ''} onChange={handleCompanyFormChange} />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" value={editCompanyFormData?.email || ''} onChange={handleCompanyFormChange} />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="phoneNumber">Phone Number:</label>
                        <input type="tel" id="phoneNumber" name="phoneNumber" value={editCompanyFormData?.phoneNumber || ''} onChange={handleCompanyFormChange} />
                    </div>
                    <div className={styles['form-buttons']}>
                        <button type="submit" className={`action-button primary`} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={handleCancelEditCompany} className={`action-button secondary`} disabled={loading}>
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    {isDepartmentsPage ? (
                        <div className={styles['departments-only-view']}>
                            <h2 className={styles['section-header']}>Departments for {company.name}</h2>
                            <DepartmentList
                                companyId={company.id}
                                departments={company.departments || []}
                                onDepartmentChange={handleDepartmentChange}
                            />
                            <button onClick={() => navigate(`/companies/${company.id}`)} className={styles['back-button']}>
                                Back to Company Details
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={styles['detail-header']}>
                                <h2 className={styles['section-header']}>{company.name}</h2>
                                <div className={styles['header-buttons']}>
                                    <button onClick={handleEditCompanyClick} className={`${styles['action-button']} ${styles['edit-company-button']}`}>
                                        Edit Company
                                    </button>
                                    <button onClick={handleDeleteCompany} className={`${styles['action-button']} ${styles['delete-company-button']}`}>
                                        Delete Company
                                    </button>
                                </div>
                            </div>

                            <div className={styles['detail-info']}>
                                <p><strong>Description:</strong> {company.description || 'N/A'}</p>
                                <p><strong>Email:</strong> {company.email || 'N/A'}</p>
                                <p><strong>Phone Number:</strong> {company.phoneNumber || 'N/A'}</p>
                            </div>

                            <h3 className={styles['section-subheader']}>Addresses</h3>
                            {company.addresses && company.addresses.length > 0 ? (
                                <ul className={styles['address-list']}>
                                    {company.addresses.map((address, index) => (
                                        <li key={index}>{address.addressName}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles['no-data-text']}>No addresses found for this company.</p>
                            )}

                            {/* Search Bar for First and Last Name */}
                            <div className={styles['search-bar']}>
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={searchFirstName}
                                    onChange={handleSearchFirstNameChange}
                                    className={styles['search-input']}
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={searchLastName}
                                    onChange={handleSearchLastNameChange}
                                    className={styles['search-input']}
                                />
                                <button onClick={handleSearchEmployee} className={styles['search-button']}>
                                    Search Employee
                                </button>
                            </div>

                            {/* Search Bar for Department Name and Description */}
                            <div className={styles['search-bar']}>
                                <input type="text"
                                    placeholder="Department Name"
                                    value={searchDepartmentName}
                                    onChange={handleSearchDepartmentNameChange}
                                    className={styles['search-input']}
                                />
                                <input
                                    type="text"
                                    placeholder="Department Description"
                                    value={searchDepartmentDescription}
                                    onChange={handleSearchDepartmentDescriptionChange}
                                    className={styles['search-input']}
                                />
                                <button onClick={handleSearchDepartment} className={styles['search-button']}>
                                    Search Department
                                </button>
                            </div>

                            <DepartmentList
                                companyId={company.id}
                                departments={company.departments || []}
                                onDepartmentChange={handleDepartmentChange}
                            />
                        </>
                    )}
                </>
            )}

            {!isDepartmentsPage && (
                <button onClick={() => navigate('/companies')} className={styles['back-button']}>
                    Back to Companies List
                </button>
            )}

            {/* Pop-up for displaying found employee */}
            {isPopupVisible && foundEmployee && (
                <div className={styles['popup-overlay']}>
                    <div className={styles['popup-content']}>
                        <h3 className={styles['popup-header']}>Found Employee</h3>
                        <p><strong>Name:</strong> {foundEmployee.firstName} {foundEmployee.lastName}</p>
                        <p><strong>Email:</strong> {foundEmployee.email}</p>
                        <p><strong>Position:</strong> {foundEmployee.position}</p>
                        <p><strong>Department:</strong> {foundEmployee.departmentName}</p>
                        <button onClick={closePopup} className={styles['popup-close-button']}>Close</button>
                    </div>
                </div>
            )}

            {/* Pop-up for displaying found department */}
            {isDepartmentPopupVisible && foundDepartment && (
                <div className={styles['popup-overlay']}>
                    <div className={styles['popup-content']}>
                        <h3 className={styles['popup-header']}>Found Department</h3>
                        <p><strong>Name:</strong> {foundDepartment.name}</p>
                        <p><strong>Description:</strong> {foundDepartment.description || 'N/A'}</p>
                        <p><strong>Email:</strong> {foundDepartment.email || 'N/A'}</p>
                        <p><strong>Phone Number:</strong> {foundDepartment.phoneNumber || 'N/A'}</p>
                        <button onClick={closeDepartmentPopup} className={styles['popup-close-button']}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDetail;