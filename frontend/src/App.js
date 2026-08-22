import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [meetings, setMeetings] = useState([]);
    const [title, setTitle] = useState('');
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [expandedMeeting, setExpandedMeeting] = useState(null);

    const fetchMeetings = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/meetings');
            const data = await res.json();
            setMeetings(data.meetings || []);
        } catch (error) {
            console.error('Error fetching meetings:', error);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3001/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, transcript }),
            });

            if (res.ok) {
                setTitle('');
                setTranscript('');
                fetchMeetings();
            }
        } catch (error) {
            console.error('Error creating meeting:', error);
        }

        setLoading(false);
    };

    const handleProcessAI = async (id) => {
        setProcessingId(id);
        try {
            const res = await fetch(`http://localhost:3001/api/meetings/${id}/process`, {
                method: 'POST',
            });

            if (res.ok) {
                fetchMeetings();
                // Auto-expand the meeting after processing
                setExpandedMeeting(id);
            }
        } catch (error) {
            console.error('Error processing meeting:', error);
        }
        setProcessingId(null);
    };

    const toggleExpand = (id) => {
        setExpandedMeeting(expandedMeeting === id ? null : id);
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>📋 AI Meeting Assistant</h1>
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
