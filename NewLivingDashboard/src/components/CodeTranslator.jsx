import React, { useState } from 'react';

const CodeTranslator = () => {
  const [task, setTask] = useState('generate');
  const [language, setLanguage] = useState('python');
  const [instructions, setInstructions] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('http://localhost:8006/tools/code-translator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task,
          language,
          instructions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch (err) {
      setError('Failed to connect to the translator service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-translator">
      <h2>Temple Code Translator</h2>
      <p>Under the Blood of Jesus Christ - Sovereign Code Generation</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Task:</label>
          <select value={task} onChange={(e) => setTask(e.target.value)}>
            <option value="generate">Generate</option>
            <option value="translate">Translate</option>
            <option value="refactor">Refactor</option>
          </select>
        </div>
        <div>
          <label>Language:</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
          </select>
        </div>
        <div>
          <label>Instructions:</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe what code you need..."
            rows={4}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Translating...' : 'Translate'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <h3>Generated Code:</h3>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default CodeTranslator;