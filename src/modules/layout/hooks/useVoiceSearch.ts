"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type SpeechRecognitionResultItem = {
  transcript?: string
}

type SpeechRecognitionResult = {
  length: number
  [index: number]: SpeechRecognitionResultItem
  isFinal?: boolean
}

type SpeechRecognitionErrorEvent = {
  error: string
}

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResult[]
  resultIndex: number
}

type SpeechRecognitionShape = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onstart?: () => void
  onerror?: (event: SpeechRecognitionErrorEvent) => void
  onend?: () => void
  onspeechend?: () => void
  onresult?: (event: SpeechRecognitionEvent) => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionShape

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor
    SpeechRecognition?: SpeechRecognitionConstructor
  }
}

type UseVoiceSearchArgs = {
  language?: string
  onResult?: (value: string) => void
}

export const useVoiceSearch = ({
  language = "en-US",
  onResult,
}: UseVoiceSearchArgs = {}) => {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionShape | null>(null)
  const onResultRef = useRef<((value: string) => void) | undefined>(undefined)
  const inactivityTimeoutRef = useRef<number | null>(null)

  const clearInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      window.clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }
  }

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
    }

    const RecognitionConstructor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition

    if (!RecognitionConstructor) {
      setIsSupported(false)
      return
    }

    const recognition = new RecognitionConstructor()
    recognition.lang = language
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript("")
      setError(null)
      clearInactivityTimer()
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message =
        event.error === "not-allowed"
          ? "Microphone permission denied"
          : event.error === "network"
            ? "Network issue while listening"
            : event.error
      setError(message)
      clearInactivityTimer()
    }

    recognition.onend = () => {
      setIsListening(false)
      clearInactivityTimer()
    }

    recognition.onspeechend = () => {
      clearInactivityTimer()
      recognition.stop()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      const currentText = finalTranscript || interimTranscript
      setTranscript(currentText)

      if (currentText && (finalTranscript || interimTranscript.length > 3)) {
        if (inactivityTimeoutRef.current) window.clearTimeout(inactivityTimeoutRef.current)

        if (finalTranscript) {
          onResultRef.current?.(finalTranscript)
        } else {
          inactivityTimeoutRef.current = window.setTimeout(() => {
            onResultRef.current?.(currentText)
          }, 500)
        }
      }

      clearInactivityTimer()
      inactivityTimeoutRef.current = window.setTimeout(() => {
        recognition.stop()
      }, 2500)
    }

    recognitionRef.current = recognition
    setIsSupported(true)

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [language])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      return
    }

    setTranscript("")
    setError(null)

    try {
      recognitionRef.current.start()
    } catch (err) {
      if (err instanceof DOMException && err.name === "InvalidStateError") {
        return
      }

      setError(err instanceof Error ? err.message : "Unable to access microphone")
    }
  }, [])

  const stopListening = useCallback(() => {
    clearInactivityTimer()
    recognitionRef.current?.stop()
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  }
}
