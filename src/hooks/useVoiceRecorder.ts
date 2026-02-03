import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Voice recorder state type
 */
type RecorderStatus =
    | 'idle'
    | 'requesting_permission'
    | 'ready'
    | 'recording'
    | 'paused'
    | 'stopped'
    | 'error'

/**
 * Voice recorder state interface
 */
interface VoiceRecorderState {
    status: RecorderStatus
    audioBlob: Blob | null
    audioUrl: string | null
    duration: number // in seconds
    errorMessage: string | null
}

/**
 * Voice recorder actions interface
 */
interface VoiceRecorderActions {
    startRecording: () => Promise<void>
    stopRecording: () => void
    pauseRecording: () => void
    resumeRecording: () => void
    resetRecording: () => void
}

/**
 * Combined return type for the hook
 */
type UseVoiceRecorderReturn = VoiceRecorderState & VoiceRecorderActions

/**
 * Maximum recording duration in seconds (5 minutes)
 */
const MAX_RECORDING_DURATION = 5 * 60 // 5 minutes

/**
 * Custom React hook for recording voice using the MediaRecorder API
 * 
 * Features:
 * - Microphone permission handling
 * - WebM/Opus codec with fallback to MP4 for Safari
 * - 5-minute maximum recording time
 * - Recording status management (idle, recording, paused, stopped, error)
 * - Audio preview with playback URL
 * - Proper cleanup of media streams and resources
 * 
 * @returns Voice recorder state and control functions
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
    const [status, setStatus] = useState<RecorderStatus>('idle')
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [duration, setDuration] = useState<number>(0)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const startTimeRef = useRef<number>(0)
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

    /**
     * Get the best supported MIME type for audio recording
     */
    const getSupportedMimeType = useCallback((): string => {
        // Prefer WebM with Opus codec (best quality/size ratio)
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            return 'audio/webm;codecs=opus'
        }
        // Fallback for Safari iOS
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            return 'audio/mp4'
        }
        // Generic WebM fallback
        if (MediaRecorder.isTypeSupported('audio/webm')) {
            return 'audio/webm'
        }
        // Last resort - let browser decide
        return ''
    }, [])

    /**
     * Start the duration timer
     */
    const startTimer = useCallback(() => {
        startTimeRef.current = Date.now() - duration * 1000
        timerIntervalRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
            setDuration(elapsed)

            // Auto-stop when reaching max duration
            if (elapsed >= MAX_RECORDING_DURATION) {
                stopRecording()
            }
        }, 100) // Update every 100ms for smooth display
    }, [duration])

    /**
     * Stop the duration timer
     */
    const stopTimer = useCallback(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
        }
    }, [])

    /**
     * Clean up media resources
     */
    const cleanup = useCallback(() => {
        // Stop all media tracks
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
        }

        // Clear media recorder
        mediaRecorderRef.current = null

        // Stop timer
        stopTimer()
    }, [stopTimer])

    /**
     * Start recording voice
     */
    const startRecording = useCallback(async () => {
        try {
            setStatus('requesting_permission')
            setErrorMessage(null)

            // Request microphone access with audio constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            })

            mediaStreamRef.current = stream

            // Get supported MIME type
            const mimeType = getSupportedMimeType()

            // Create MediaRecorder instance
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType || undefined,
                audioBitsPerSecond: 128000, // 128 kbps - good quality for voice
            })

            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            // Handle data available event
            mediaRecorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            // Handle recording stop event
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, {
                    type: mimeType || 'audio/webm',
                })
                setAudioBlob(blob)

                // Create URL for preview
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)

                setStatus('stopped')
                stopTimer()
                cleanup()
            }

            // Handle errors
            mediaRecorder.onerror = (event: Event) => {
                console.error('MediaRecorder error:', event)
                setErrorMessage('Recording error occurred. Please try again.')
                setStatus('error')
                cleanup()
            }

            // Start recording
            mediaRecorder.start(100) // Collect data every 100ms
            setStatus('recording')
            setDuration(0)
            startTimer()

        } catch (error) {
            console.error('Error starting recording:', error)

            // Handle specific error types
            if (error instanceof DOMException) {
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    setErrorMessage(
                        'Microphone access denied. Please enable microphone permissions in your browser settings.'
                    )
                } else if (error.name === 'NotFoundError') {
                    setErrorMessage('No microphone found. Please connect a microphone and try again.')
                } else if (error.name === 'NotSupportedError') {
                    setErrorMessage('Voice recording is not supported in your browser.')
                } else {
                    setErrorMessage('Failed to start recording. Please try again.')
                }
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.')
            }

            setStatus('error')
            cleanup()
        }
    }, [getSupportedMimeType, startTimer, stopTimer, cleanup])

    /**
     * Stop recording
     */
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
    }, [])

    /**
     * Pause recording
     */
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause()
            setStatus('paused')
            stopTimer()
        }
    }, [stopTimer])

    /**
     * Resume recording
     */
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume()
            setStatus('recording')
            startTimer()
        }
    }, [startTimer])

    /**
     * Reset recording state
     */
    const resetRecording = useCallback(() => {
        // Revoke the audio URL to free memory
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
        }

        setStatus('idle')
        setAudioBlob(null)
        setAudioUrl(null)
        setDuration(0)
        setErrorMessage(null)
        audioChunksRef.current = []
        cleanup()
    }, [audioUrl, cleanup])

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            cleanup()
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl)
            }
        }
    }, [audioUrl, cleanup])

    return {
        status,
        audioBlob,
        audioUrl,
        duration,
        errorMessage,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
    }
}
