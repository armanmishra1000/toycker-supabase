import { useState, useEffect, useRef } from "react"

interface UseAnimatedPlaceholderOptions {
  phrases: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  enabled?: boolean
}

export const useAnimatedPlaceholder = ({
  phrases,
  typingSpeed = 70,
  deletingSpeed = 40,
  pauseDuration = 2500,
  enabled = true,
}: UseAnimatedPlaceholderOptions): string => {
  const [currentText, setCurrentText] = useState("")
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled || phrases.length === 0) {
      setCurrentText(phrases[0] || "")
      return
    }

    const currentPhrase = phrases[currentPhraseIndex]

    const animate = () => {
      if (!isDeleting && currentText === currentPhrase) {
        timeoutRef.current = setTimeout(() => {
          setIsDeleting(true)
        }, pauseDuration)
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false)
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length)
      } else if (isDeleting) {
        timeoutRef.current = setTimeout(() => {
          setCurrentText(currentPhrase.substring(0, currentText.length - 1))
        }, deletingSpeed)
      } else {
        timeoutRef.current = setTimeout(() => {
          setCurrentText(currentPhrase.substring(0, currentText.length + 1))
        }, typingSpeed)
      }
    }

    animate()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [currentText, currentPhraseIndex, isDeleting, phrases, typingSpeed, deletingSpeed, pauseDuration, enabled])

  return currentText
}
