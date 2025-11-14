import React, { useState } from 'react';
import './App.css';

function App() {
  const [name, setName] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`http://localhost:8051/chat?name=${encodeURIComponent(name.trim())}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setResponse(data.message);
    } catch (err) {
      setError(`Error: ${err.message}`);
      setResponse('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>APM Chat Application</h1>
        
        <form onSubmit={handleSubmit} className="chat-form">
          <div className="input-group">
            <label htmlFor="name">Enter your name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name here..."
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Sending...' : 'Submit'}
          </button>
        </form>

        {error && (
          <div className="error-panel">
            {error}
          </div>
        )}

        {response && (
          <div className="response-panel">
            <h3>Response:</h3>
            <p>{response}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
