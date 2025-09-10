import React, { useState, useEffect } from 'react';

const PhoneNumberManagement = () => {
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searching, setSearching] = useState(false);
    const [availableNumbers, setAvailableNumbers] = useState([]);
    const [buying, setBuying] = useState(false);

    // Search form state
    const [areaCode, setAreaCode] = useState('');
    const [country, setCountry] = useState('US');

    // Buy form state
    const [selectedNumber, setSelectedNumber] = useState('');
    const [friendlyName, setFriendlyName] = useState('');

    useEffect(() => {
        loadPhoneNumbers();
    }, []);

    const loadPhoneNumbers = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch('/api/twilio/my-numbers', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });

            if (!response.ok) throw new Error('Failed to load phone numbers');

            const data = await response.json();
            setPhoneNumbers(data.phoneNumbers || []);
            setStats(data.stats || {});

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load phone numbers');
        } finally {
            setLoading(false);
        }
    };

    const searchAvailableNumbers = async (e) => {
        e.preventDefault();

        if (!areaCode.trim()) {
            setError('Please enter an area code');
            return;
        }

        try {
            setSearching(true);
            setError('');

            const response = await fetch(`/api/twilio/available-numbers?areaCode=${areaCode}&country=${country}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });

            if (!response.ok) throw new Error('Failed to search available numbers');

            const data = await response.json();
            setAvailableNumbers(data.availableNumbers || []);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search available numbers');
        } finally {
            setSearching(false);
        }
    };

    const buyPhoneNumber = async (phoneNumber) => {
        try {
            setBuying(true);
            setError('');

            const response = await fetch('/api/twilio/buy-number', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber,
                    country: country
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to buy phone number');
            }

            setSuccess(`Phone number ${phoneNumber} purchased successfully!`);
            setSelectedNumber('');
            setFriendlyName('');
            setAvailableNumbers([]);
            await loadPhoneNumbers();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to buy phone number');
        } finally {
            setBuying(false);
        }
    };

    const updatePhoneNumber = async (id, updates) => {
        try {
            setError('');

            const response = await fetch(`/api/twilio/my-numbers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update phone number');
            }

            setSuccess('Phone number updated successfully!');
            await loadPhoneNumbers();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update phone number');
        }
    };

    const releasePhoneNumber = async (id, phoneNumber) => {
        if (!window.confirm(`Are you sure you want to release phone number ${phoneNumber}? This action cannot be undone.`)) {
            return;
        }

        try {
            setError('');

            const response = await fetch(`/api/twilio/my-numbers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to release phone number');
            }

            setSuccess(`Phone number ${phoneNumber} released successfully!`);
            await loadPhoneNumbers();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to release phone number');
        }
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1000px' }}>
            <h2>📞 Phone Number Management</h2>

            {error && (
                <div style={{ color: 'red', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                    ❌ {error}
                </div>
            )}

            {success && (
                <div style={{ color: 'green', backgroundColor: '#e6ffe6', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                    ✅ {success}
                </div>
            )}

            {/* Stats */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '30px' }}>
                <h3>📊 Phone Number Statistics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{stats.total_numbers || 0}</div>
                        <div>Total Numbers</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{stats.active_numbers || 0}</div>
                        <div>Active Numbers</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>${stats.total_monthly_cost || 0}</div>
                        <div>Monthly Cost</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>${stats.total_purchase_cost || 0}</div>
                        <div>Purchase Cost</div>
                    </div>
                </div>
            </div>

            {/* Search and Buy */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h3>🔍 Search & Buy Phone Numbers</h3>
                
                <form onSubmit={searchAvailableNumbers} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                        <div>
                            <label htmlFor="areaCode" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Area Code:
                            </label>
                            <input
                                id="areaCode"
                                type="text"
                                value={areaCode}
                                onChange={(e) => setAreaCode(e.target.value)}
                                placeholder="555"
                                required
                                style={{ width: '100px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label htmlFor="country" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Country:
                            </label>
                            <select
                                id="country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                            >
                                <option value="US">US</option>
                                <option value="CA">Canada</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={searching}
                            style={{
                                backgroundColor: searching ? '#ccc' : '#007bff',
                                color: 'white',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: searching ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {searching ? 'Searching...' : 'Search Numbers'}
                        </button>
                    </div>
                </form>

                {availableNumbers.length > 0 && (
                    <div>
                        <h4>Available Numbers:</h4>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {availableNumbers.map(number => (
                                <div key={number.phoneNumber} style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    padding: '10px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <strong>{number.phoneNumber}</strong>
                                        {number.locality && <span style={{ color: '#666', marginLeft: '10px' }}>({number.locality}, {number.region})</span>}
                                    </div>
                                    <button
                                        onClick={() => buyPhoneNumber(number.phoneNumber)}
                                        disabled={buying}
                                        style={{
                                            backgroundColor: buying ? '#ccc' : '#28a745',
                                            color: 'white',
                                            padding: '5px 15px',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: buying ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {buying ? 'Buying...' : 'Buy'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Current Phone Numbers */}
            <div>
                <h3>📱 Your Phone Numbers</h3>
                {phoneNumbers.length === 0 ? (
                    <p style={{ color: '#666' }}>You don't have any phone numbers yet. Search and buy one above!</p>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {phoneNumbers.map(phone => (
                            <div key={phone.id} style={{
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '15px',
                                backgroundColor: phone.is_active ? '#f8fff8' : '#fff8f8'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0' }}>
                                            {phone.phone_number}
                                            <span style={{
                                                color: phone.is_active ? 'green' : 'red',
                                                fontSize: '12px',
                                                marginLeft: '10px',
                                                fontWeight: 'normal'
                                            }}>
                                                {phone.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </h4>
                                        <p style={{ margin: '0', color: '#666' }}>
                                            {phone.friendly_name || 'No friendly name set'}
                                        </p>
                                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                                            {phone.locality && phone.region && `${phone.locality}, ${phone.region}`}
                                            {phone.purchase_price && ` • Purchase: $${phone.purchase_price}`}
                                            {phone.monthly_cost && ` • Monthly: $${phone.monthly_cost}`}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            onClick={() => updatePhoneNumber(phone.id, { is_active: !phone.is_active })}
                                            style={{
                                                backgroundColor: phone.is_active ? '#dc3545' : '#28a745',
                                                color: 'white',
                                                padding: '5px 10px',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            {phone.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => releasePhoneNumber(phone.id, phone.phone_number)}
                                            style={{
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                padding: '5px 10px',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Release
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhoneNumberManagement;
