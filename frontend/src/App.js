import React, { useState, useEffect } from 'react';
import './App.css';

// Use environment variable or fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    // Meeting state
    const [meetings, setMeetings] = useState([]);
    const [title, setTitle] = useState('');
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [expandedMeeting, setExpandedMeeting] = useState(null);

    // Check for saved token on load
    useEffect(() => {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
            fetchMeetings(savedToken);
        }
    }, []);

    // Auth functions
    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');

        try {
            const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup';
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            localStorage.setItem('auth_token', data.session.access_token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            setToken(data.session.access_token);
            setUser(data.user);
            setIsAuthenticated(true);
            setEmail('');
            setPassword('');
            await fetchMeetings(data.session.access_token);

        } catch (error) {
            setAuthError(error.message);
        }

        setAuthLoading(false);
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/signout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setMeetings([]);
    };

    // Meeting functions
    const fetchMeetings = async (authToken) => {
        try {
            const res = await fetch(`${API_URL}/api/meetings`, {
                headers: {
                    'Authorization': `Bearer ${authToken || token}`
                }
            });
            const data = await res.json();
            setMeetings(data.meetings || []);
        } catch (error) {
            console.error('Error fetching meetings:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/meetings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, transcript }),
            });

            if (res.ok) {
                setTitle('');
                setTranscript('');
                fetchMeetings(token);
            }
        } catch (error) {
            console.error('Error creating meeting:', error);
        }

        setLoading(false);
    };

    const handleProcessAI = async (id) => {
        setProcessingId(id);
        try {
            const res = await fetch(`${API_URL}/api/meetings/${id}/process`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                fetchMeetings(token);
                setExpandedMeeting(id);
            }
        } catch (error) {
            console.error('Error processing meeting:', error);
        }
        setProcessingId(null);
    };

    const handleDownloadPDF = async (id, title) => {
        try {
            const res = await fetch(`${API_URL}/api/meetings/${id}/pdf`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    const toggleExpand = (id) => {
        setExpandedMeeting(expandedMeeting === id ? null : id);
    };

    // Auth Screen
    if (!isAuthenticated) {
        return (
            <div className="app auth-screen">
                <div className="auth-container">
                    <h1>📋 AI Meeting Assistant</h1>
                    <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
                    
                    <form onSubmit={handleAuth}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password (min 6 chars)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        {authError && <p className="auth-error">{authError}</p>}
                        <button type="submit" disabled={authLoading}>
                            {authLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>
                    
                    <p className="auth-switch">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}>
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    // Main App
    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <h1>📋 AI Meeting Assistant</h1>
                    <div className="user-info">
                        <span>👤 {user?.email}</span>
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </div>
                </div>
                <p className="subtitle">Upload transcripts → AI extracts summaries, decisions, and action items</p>
            </header>

            <main className="app-main">
                <section className="create-section">
                    <h2>Create New Meeting</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Meeting title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <textarea
                            placeholder="Paste meeting transcript here..."
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            rows={6}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Meeting'}
                        </button>
                    </form>
                </section>

                <section className="list-section">
                    <h2>Meetings ({meetings.length})</h2>
                    {meetings.length === 0 ? (
                        <p className="empty">No meetings yet. Create one above!</p>
                    ) : (
                        <ul className="meeting-list">
                            {meetings.map((m) => (
                                <li key={m.id} className="meeting-item">
                                    <div className="meeting-header" onClick={() => toggleExpand(m.id)}>
                                        <div>
                                            <strong>{m.title}</strong>
                                            <span className="date">
                                                {new Date(m.created_at).toLocaleDateString()}
                                            </span>
                                            {m.summary && (
                                                <span className="badge">✅ AI Processed</span>
                                            )}
                                        </div>
                                        <button 
                                            className="expand-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpand(m.id);
                                            }}
                                        >
                                            {expandedMeeting === m.id ? '▼' : '▶'}
                                        </button>
                                    </div>

                                    {expandedMeeting === m.id && (
                                        <div className="meeting-details">
                                            <p className="transcript-preview">
                                                {m.transcript.slice(0, 200)}...
                                            </p>
                                            
                                            {m.summary ? (
                                                <>
                                                    <div className="ai-results">
                                                        <div className="result-section">
                                                            <h4>📝 Summary</h4>
                                                            <p>{m.summary}</p>
                                                        </div>
                                                        {m.decisions && JSON.parse(m.decisions || '[]').length > 0 && (
                                                            <div className="result-section">
                                                                <h4>✅ Decisions</h4>
                                                                <ul>
                                                                    {JSON.parse(m.decisions || '[]').map((d, i) => (
                                                                        <li key={i}>{d}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        className="pdf-btn"
                                                        onClick={() => handleDownloadPDF(m.id, m.title)}
                                                    >
                                                        📄 Download PDF Report
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    className="process-btn"
                                                    onClick={() => handleProcessAI(m.id)}
                                                    disabled={processingId === m.id}
                                                >
                                                    {processingId === m.id ? '⏳ Processing...' : '🧠 Process with AI'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}

export default App;
