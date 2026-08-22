import React, { useState, useEffect } from 'react';
import './App.css';

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

    const [meetings, setMeetings] = useState([]);
    const [title, setTitle] = useState('');
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [expandedMeeting, setExpandedMeeting] = useState(null);

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

    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');

        if (!email || !email.includes('@') || !email.includes('.')) {
            setAuthError('Please enter a valid email address');
            setAuthLoading(false);
            return;
        }

        if (!password || password.length < 6) {
            setAuthError('Password must be at least 6 characters');
            setAuthLoading(false);
            return;
        }

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
                headers: { 'Authorization': `Bearer ${token}` }
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

    const fetchMeetings = async (authToken) => {
        try {
            const res = await fetch(`${API_URL}/api/meetings`, {
                headers: { 'Authorization': `Bearer ${authToken || token}` }
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
                headers: { 'Authorization': `Bearer ${token}` }
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
                headers: { 'Authorization': `Bearer ${token}` }
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

    // Auth Screen - Beautiful Modern Design
    if (!isAuthenticated) {
        return (
            <div className="auth-screen">
                <div className="auth-background">
                    <div className="auth-card">
                        <div className="auth-header">
                            <div className="auth-icon">📋</div>
                            <h1>AI Meeting Assistant</h1>
                            <p>Extract insights from your meetings instantly</p>
                        </div>
                        
                        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        
                        <form onSubmit={handleAuth}>
                            <div className="input-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            
                            {authError && <div className="auth-error">{authError}</div>}
                            
                            <button type="submit" disabled={authLoading} className="auth-btn">
                                {authLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>
                        
                        <p className="auth-switch">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}>
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                        
                        <div className="auth-demo">
                            <p>Demo: demouser789@proton.me / SecurePass123!</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main App
    return (
        <div className="app">
            <header className="header">
                <div className="header-content">
                    <div className="header-left">
                        <span className="header-icon">📋</span>
                        <h1>AI Meeting Assistant</h1>
                    </div>
                    <div className="header-right">
                        <span className="user-email">👤 {user?.email}</span>
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </div>
                </div>
                <p className="header-subtitle">Upload transcripts → AI extracts summaries, decisions, and action items</p>
            </header>

            <main className="main">
                <section className="create-section">
                    <h2>✏️ New Meeting</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Meeting title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="input-field"
                        />
                        <textarea
                            placeholder="Paste your meeting transcript here..."
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            rows={8}
                            required
                            className="textarea-field"
                        />
                        <button type="submit" disabled={loading} className="save-btn">
                            {loading ? 'Saving...' : '📥 Save Meeting'}
                        </button>
                    </form>
                </section>

                <section className="list-section">
                    <h2>📊 Your Meetings ({meetings.length})</h2>
                    {meetings.length === 0 ? (
                        <div className="empty-state">
                            <p>No meetings yet</p>
                            <p className="empty-sub">Create your first meeting to get started</p>
                        </div>
                    ) : (
                        <ul className="meeting-list">
                            {meetings.map((m) => (
                                <li key={m.id} className="meeting-item">
                                    <div className="meeting-header" onClick={() => toggleExpand(m.id)}>
                                        <div className="meeting-info">
                                            <strong>{m.title}</strong>
                                            <span className="meeting-date">
                                                {new Date(m.created_at).toLocaleDateString()}
                                            </span>
                                            {m.summary && (
                                                <span className="badge">✅ AI Processed</span>
                                            )}
                                        </div>
                                        <button className="expand-btn">
                                            {expandedMeeting === m.id ? '−' : '+'}
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
                                                        <div className="result-card">
                                                            <h4>📝 Summary</h4>
                                                            <p>{m.summary}</p>
                                                        </div>
                                                        {m.decisions && JSON.parse(m.decisions || '[]').length > 0 && (
                                                            <div className="result-card">
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
