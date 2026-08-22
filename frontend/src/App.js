import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [meetings, setMeetings] = useState([]);
    const [title, setTitle] = useState('');
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="app">
            <header className="app-header">
                <h1>📋 AI Meeting Assistant</h1>
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
                                <li key={m.id}>
                                    <strong>{m.title}</strong>
                                    <span className="date">
                                        {new Date(m.created_at).toLocaleDateString()}
                                    </span>
                                    <p className="preview">
                                        {m.transcript ? m.transcript.slice(0, 100) + '...' : ''}
                                    </p>
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
