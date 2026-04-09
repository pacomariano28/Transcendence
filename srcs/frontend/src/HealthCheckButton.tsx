import { useState } from 'react';

export const HealthCheckButton = () => {
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const checkHealth = async () => {
        setLoading(true);
        setStatus(null);

        try {
            // Make sure your API Gateway is running on port 4000
            const response = await fetch('/api/health?q=healthy');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Assuming your health endpoint returns JSON (e.g., { status: 'ok' })
            const data = await response.json();
            setStatus(`Success: ${JSON.stringify(data)}`);

        } catch (error: any) {
            setStatus(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #444', borderRadius: '8px', maxWidth: '400px' }}>
            <h3>API Gateway Health Check</h3>
            <button
                onClick={checkHealth}
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    backgroundColor: '#646cff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                }}
            >
                {loading ? 'Checking...' : 'Ping API Gateway'}
            </button>

            {status && (
                <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: status.startsWith('Error') ? '#ffebee' : '#e8f5e9',
                    color: status.startsWith('Error') ? '#c62828' : '#2e7d32',
                    borderRadius: '4px'
                }}>
                    {status}
                </div>
            )}
        </div>
    );
};
