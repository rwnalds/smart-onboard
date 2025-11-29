import { useEffect, useState } from "react"
import type { CallSession, ChecklistItem, QuestionPrompt, TranscriptSegment } from "~types"
import TranscriptView from "./TranscriptView"
import ChecklistPanel from "./ChecklistPanel"
import QuestionPrompts from "./QuestionPrompts"
import { useCallSession } from "~hooks/useCallSession"

interface SidebarProps {
  meetingUrl: string
  onClose: () => void
}

const Sidebar = ({ meetingUrl, onClose }: SidebarProps) => {
  const {
    session,
    userId,
    isCapturing,
    transcript,
    checklist,
    currentPrompt,
    startSession,
    stopSession,
    toggleCapture
  } = useCallSession(meetingUrl)

  const [minimized, setMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<'checklist' | 'transcript'>('checklist')

  useEffect(() => {
    // Auto-start session when sidebar opens AND user ID is loaded
    if (!session && userId) {
      console.log('Starting session with user ID:', userId);
      startSession()
    }
  }, [userId, session])

  if (minimized) {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        background: '#4f46e5',
        borderRadius: '50%',
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }} onClick={() => setMinimized(false)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
    )
  }

  const completedCount = checklist?.filter(item => item.completed).length || 0
  const totalCount = checklist?.length || 0
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: 'white',
      boxShadow: '-2px 0 12px rgba(0,0,0,0.1)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>SmartOnboard AI</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setMinimized(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          {isCapturing && (
            <>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }} />
              <span style={{ color: '#374151' }}>Capturing Captions</span>
            </>
          )}
          {session && (
            <span style={{ color: '#6b7280' }}>
              • {Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000 / 60)}:{
                String(Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000 % 60)).padStart(2, '0')
              }
            </span>
          )}
        </div>
      </div>

      {/* Current Question Prompt */}
      {currentPrompt && (
        <QuestionPrompts prompt={currentPrompt} />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        <button
          onClick={() => setActiveTab('checklist')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: activeTab === 'checklist' ? 'white' : 'transparent',
            borderBottom: activeTab === 'checklist' ? '2px solid #4f46e5' : 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: activeTab === 'checklist' ? '#4f46e5' : '#6b7280'
          }}
        >
          📋 Checklist ({completedCount}/{totalCount})
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: activeTab === 'transcript' ? 'white' : 'transparent',
            borderBottom: activeTab === 'transcript' ? '2px solid #4f46e5' : 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: activeTab === 'transcript' ? '#4f46e5' : '#6b7280'
          }}
        >
          📝 Transcript
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'checklist' && checklist && (
          <ChecklistPanel items={checklist} />
        )}
        {activeTab === 'transcript' && transcript && (
          <TranscriptView segments={transcript} />
        )}
      </div>

      {/* Progress Bar */}
      {checklist && (
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
            {completedCount} of {totalCount} items completed
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: '#4f46e5',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </div>
  )
}

export default Sidebar
