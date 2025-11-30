import { useEffect, useRef } from "react"
import type { TranscriptSegment } from "~types"

interface TranscriptViewProps {
  segments: TranscriptSegment[]
}

const TranscriptView = ({ segments }: TranscriptViewProps) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new segments arrive
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [segments])

  if (segments.length === 0) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 16px' }}>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
        <p>Waiting for conversation to start...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      {segments.map((segment, index) => {
        const isAgent = segment.speaker === 'agent'
        const time = new Date(segment.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })

        return (
          <div key={segment.id || index} style={{
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: index < segments.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: isAgent ? '#4f46e5' : '#059669',
                background: isAgent ? '#eef2ff' : '#d1fae5',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {isAgent ? '👤 Agent' : '👥 Client'}
              </span>
              <span style={{
                fontSize: '11px',
                color: '#9ca3af'
              }}>
                {time}
              </span>
              {segment.confidence && segment.confidence < 0.8 && (
                <span style={{
                  fontSize: '11px',
                  color: '#f59e0b',
                  background: '#fef3c7',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Low confidence
                </span>
              )}
            </div>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5'
            }}>
              {segment.text}
            </p>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

export default TranscriptView
