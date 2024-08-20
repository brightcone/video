import React, { useEffect, useState } from 'react';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        // Retrieve history from local storage on component mount
        const storedHistory = JSON.parse(localStorage.getItem('history') || '[]');
        setHistory(storedHistory);
    }, []);

    return (
        <div style={styles.container}>
            <h3 style={styles.header}>History:</h3>
            {history.length > 0 ? (
                <ul style={styles.list}>
                    {history.map((entry, index) => (
                        <li key={index} style={styles.listItem}>
                            <div style={styles.entry}>
                                <strong style={styles.label}>Input:</strong> {entry.input}
                            </div>
                            <div style={styles.entry}>
                                <strong style={styles.label}>Response:</strong> {entry.response}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={styles.noHistory}>No history available.</p>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: '20px',
        fontSize: '24px',
        color: '#333333',
    },
    list: {
        listStyleType: 'none',
        padding: '0',
    },
    listItem: {
        marginBottom: '15px',
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
    },
    entry: {
        marginBottom: '5px',
    },
    label: {
        fontWeight: 'bold',
    },
    noHistory: {
        color: '#777777',
    },
};

export default HistoryPage;