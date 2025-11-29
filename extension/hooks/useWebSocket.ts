import { useEffect, useRef, useState } from "react"
import type { WSMessage, TranscriptSegment, QuestionPrompt } from "~types"

interface UseWebSocketOptions {
  onTranscriptSegment: (segment: TranscriptSegment) => void
  onChecklistUpdated: (update: { itemId: number; completed: boolean; extractedInfo?: string }) => void
  onQuestionSuggested: (prompt: QuestionPrompt) => void
}

export function useWebSocket(options: UseWebSocketOptions) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = () => {
    const wsUrl = process.env.PLASMO_PUBLIC_WS_URL || 'ws://localhost:3000/api/websocket'

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)

          switch (message.type) {
            case 'transcript_segment':
              options.onTranscriptSegment(message.payload)
              break
            case 'checklist_updated':
              options.onChecklistUpdated(message.payload)
              break
            case 'question_suggested':
              options.onQuestionSuggested(message.payload)
              break
            case 'error':
              console.error('WebSocket error:', message.payload)
              break
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setConnected(false)
        wsRef.current = null

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...')
          connect()
        }, 3000)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const sendMessage = (message: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  return {
    connected,
    sendMessage
  }
}
