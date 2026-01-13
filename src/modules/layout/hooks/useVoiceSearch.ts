"use client"

import { useState, useCallback, useEffect, useRef } from "react"

export const useVoiceSearch = (onResult: (text: string) => void) => {
    const [isListening, setIsListening] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [supported, setSupported] = useState(false)
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            setSupported(!!SpeechRecognition)
        }
    }, [])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }, [])

    const startListening = useCallback(() => {
        if (isListening) {
            stopListening()
            return
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) {
            setError("Speech recognition not supported in this browser.")
            return
        }

        const recognition = new SpeechRecognition()
        recognitionRef.current = recognition
        recognition.lang = "en-US"
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            setIsListening(true)
            setError(null)
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            onResult(transcript)
        }

        recognition.onerror = (event: any) => {
            setError(event.error)
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognition.start()
    }, [onResult, isListening, stopListening])

    return { isListening, error, startListening, stopListening, supported }
}

