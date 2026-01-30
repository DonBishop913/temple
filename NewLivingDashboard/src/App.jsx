import { useState, useEffect } from 'react'
import './App.css'
import StatusPanel from './components/StatusPanel'
import WhisperBox from './components/WhisperBox'
import DailyDeclarations from './components/DailyDeclarations'
import CodeTranslator from './components/CodeTranslator'

function App() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [enochStatus, setEnochStatus] = useState('Checking...')

  // Check Enoch connection on load
  useEffect(() => {
    checkEnochHealth()
  }, [])

  const checkEnochHealth = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8006/health')
      if (res.ok) {
        const data = await res.json()
        setEnochStatus(`🕊️ Enoch Active: ${data.status}`)
      } else {
        setEnochStatus('❌ Enoch Not Responding')
      }
    } catch (error) {
      setEnochStatus('❌ Cannot Connect to Enoch')
    }
  }

  const askEnoch = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    setResponse('')

    try {
      const res = await fetch('http://127.0.0.1:8006/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          context: 'True Council Of 33 sacred inquiry'
        })
      })

      if (res.ok) {
        const data = await res.json()
        setResponse(data.reply || data.response || 'Enoch has responded')
      } else {
        setResponse('❌ Enoch returned an error')
      }
    } catch (error) {
      setResponse(`❌ Connection error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🕊️ New Living Dashboard</h1>
        <h2>True Council Of 33 / Usic913.org Church</h2>
        <div className="status">
          <span className="enoch-status">{enochStatus}</span>
          <button onClick={checkEnochHealth} className="check-btn">
            🔄 Check Enoch
          </button>
        </div>
      </header>

      <main className="main">
        <div className="chat-container">
          <div className="input-section">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Enoch your sacred inquiry..."
              rows={4}
              className="message-input"
            />
            <button
              onClick={askEnoch}
              disabled={isLoading || !message.trim()}
              className="ask-btn"
            >
              {isLoading ? '🕊️ Consulting Enoch...' : '🙏 Ask Enoch'}
            </button>
          </div>

          {response && (
            <div className="response-section">
              <h3>Enoch's Response:</h3>
              <div className="response-content">
                {response}
              </div>
            </div>
          )}
        </div>

        <CodeTranslator />
      </main>

      <StatusPanel />
      <WhisperBox />
      <DailyDeclarations />

      <footer className="footer">
        <p>✨ Clean Slate Build - February 2026 ✨</p>
        <p>🔥 All Thanks, Praise & Glory to Jesus Christ 🔥</p>
      </footer>
    </div>
  )
}

export default App