import { useEffect, useRef, useState } from "react"

interface UseAudioRecorderOptions {
  onAudioChunk: (audioBlob: Blob) => void
  chunkDuration?: number // milliseconds, default 5000 (5 seconds)
}

export function useAudioRecorder(options: UseAudioRecorderOptions) {
  const { onAudioChunk, chunkDuration = 5000 } = options
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      // Request tab audio capture permission
      // Note: This requires the tabCapture permission in manifest.json
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      streamRef.current = stream

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      // Handle stop event - send accumulated chunks
      mediaRecorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType })
          onAudioChunk(audioBlob)
          chunksRef.current = []
        }
      }

      // Start recording with time slices
      mediaRecorder.start(chunkDuration)
      setIsRecording(true)
      setError(null)

      console.log('Audio recording started')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording'
      setError(errorMessage)
      console.error('Failed to start audio recording:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    setIsRecording(false)
    console.log('Audio recording stopped')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  return {
    isRecording,
    error,
    startRecording,
    stopRecording
  }
}
