import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AddressDTO {
  addressName: string;
}

const RegisterForm: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [surname, setSurname] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gender, setGender] = useState<number>(0); // Assuming 0 for Male, 1 for Female, etc. based on your C# enum
  const [dateOfBirth, setDateOfBirth] = useState<string>(''); // YYYY-MM-DD format
  const [addresses, setAddresses] = useState<AddressDTO[]>([{ addressName: '' }]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleAddressChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const newAddresses = addresses.map((address, i) => {
      if (index === i) {
        return { ...address, addressName: event.target.value };
      }
      return address;
    });
    setAddresses(newAddresses);
  };

  const addAddressField = () => {
    setAddresses([...addresses, { addressName: '' }]);
  };

  const removeAddressField = (index: number) => {
    const newAddresses = addresses.filter((_, i) => i !== index);
    setAddresses(newAddresses);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    setRegistrationSuccess(false);

    // Basic validation
    if (!name || !surname || !username || !password || !email || !dateOfBirth) {
      setError('Please fill in all required user fields.');
      setLoading(false);
      return;
    }

    if (addresses.some(addr => !addr.addressName.trim())) {
      setError('All address fields must be filled or removed.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        surname,
        userName: username, // Casing must match C# DTO
        password,
        email,
        gender: Number(gender), // Ensure it's a number matching your enum
        dateOfBirth: new Date(dateOfBirth).toISOString(), // Send as ISO string
        addresses: addresses.filter(addr => addr.addressName.trim() !== '') // Only send non-empty addresses
      };

      const response = await api.post('/User/register', payload);

      if (response.status === 200) {
        setRegistrationSuccess(true);
        // Optionally, automatically log in or redirect after successful registration
        // navigate('/login');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response) {
        if (err.response.status === 409) { // Conflict status for "username already exists"
          setError(err.response.data || 'Username already exists.');
        } else if (err.response.data && typeof err.response.data === 'object') {
          // Handle ASP.NET Core ModelState errors
          const errors = err.response.data.errors;
          let errorMessage = '';
          for (const key in errors) {
            if (errors.hasOwnProperty(key)) {
              errorMessage += `${key}: ${errors[key].join(', ')}\n`;
            }
          }
          setError(errorMessage || 'Registration failed with validation errors.');
        } else {
          setError(err.response.data || 'An unexpected error occurred during registration.');
        }
      } else if (err.request) {
        setError('No response from server. Check network connection.');
      } else {
        setError('Error setting up request.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Register</h2>
      {registrationSuccess && (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
          Registration successful! You can now <span onClick={() => navigate('/login')} style={{ color: '#004085', cursor: 'pointer', textDecoration: 'underline' }}>log in</span>.
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* User Details */}
        <div style={{ marginBottom: '25px', border: '1px solid #eee', padding: '15px', borderRadius: '5px' }}>
          <h3>Personal Details</h3>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="surname" style={{ display: 'block', marginBottom: '5px' }}>Surname:</label>
            <input type="text" id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="gender" style={{ display: 'block', marginBottom: '5px' }}>Gender:</label>
            <select id="gender" value={gender} onChange={(e) => setGender(Number(e.target.value))} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
              <option value={0}>Male</option>
              <option value={1}>Female</option>
              <option value={2}>Other</option>
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="dateOfBirth" style={{ display: 'block', marginBottom: '5px' }}>Date of Birth:</label>
            <input type="date" id="dateOfBirth" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Addresses */}
        <div style={{ marginBottom: '25px', border: '1px solid #eee', padding: '15px', borderRadius: '5px' }}>
          <h3>Addresses</h3>
          {addresses.map((address, index) => (
            <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={`Address ${index + 1}`}
                value={address.addressName}
                onChange={(e) => handleAddressChange(index, e)}
                style={{ flexGrow: 1, padding: '8px', boxSizing: 'border-box', marginRight: '10px' }}
              />
              {addresses.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAddressField(index)}
                  style={{ padding: '8px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addAddressField} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
            Add Address
          </button>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>Login here</span>.
      </p>
    </div>
  );
};

export default RegisterForm;