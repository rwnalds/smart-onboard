import { useState } from "react"
import type { QuestionPrompt } from "~types"

interface QuestionPromptsProps {
  prompt: QuestionPrompt
}

const QuestionPrompts = ({ prompt }: QuestionPromptsProps) => {
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (dismissed) {
    return null
  }

  return (
    <div style={{
      padding: '16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      animation: 'slideIn 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'start',
        gap: '12px'
      }}>
        <div style={{
          fontSize: '24px',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          💡
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
            opacity: 0.9
          }}>
            Suggested Question
          </div>

          <p style={{
            margin: '0 0 12px 0',
            fontSize: '15px',
            lineHeight: '1.5',
            fontWeight: 500
          }}>
            "{prompt.prompt}"
          </p>

          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={handleCopy}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy
                </>
              )}
            </button>

            <button
              onClick={() => setDismissed(true)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  )
}

export default QuestionPrompts
