"use client"

import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import { useToast } from "@modules/common/context/toast-context"
import { sendOtp, verifyOtp } from "@lib/data/otp"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import {
  PHONE_LOGIN_OTP_INPUT_PATTERN,
  PHONE_LOGIN_OTP_LABEL,
  PHONE_LOGIN_OTP_LENGTH,
} from "@lib/constants/phone-login-otp"

type Props = {
  next?: string
  returnUrl?: string
}

const PhoneLogin = ({ next, returnUrl }: Props) => {
  const { showToast } = useToast()
  const [phone, setPhone] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [sendState, sendAction, isSending] = useActionState(sendOtp, null)
  const [verifyState, verifyAction, isVerifying] = useActionState(verifyOtp, null)

  const startCooldown = useCallback((durationSeconds: number) => {
    setResendCooldown(durationSeconds)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }

          return 0
        }

        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!sendState) return

    if (sendState.success) {
      setOtpSent(true)
      startCooldown(sendState.data.cooldownSeconds)
      showToast("OTP sent to your WhatsApp", "success")
      return
    }

    showToast(sendState.error, "error")
  }, [sendState, showToast, startCooldown])

  useEffect(() => {
    if (!verifyState || verifyState.success) return
    showToast(verifyState.error, "error")
  }, [verifyState, showToast])

  const appendRedirectFields = useCallback(
    (formData: FormData) => {
      if (returnUrl) {
        formData.append("returnUrl", returnUrl)
      }

      if (next) {
        formData.append("next", next)
      }
    },
    [next, returnUrl]
  )

  const handleResend = () => {
    if (resendCooldown > 0) return

    const formData = new FormData()
    formData.append("phone", phone)
    appendRedirectFields(formData)
    sendAction(formData)
  }

  if (!otpSent) {
    return (
      <div className="w-full flex flex-col gap-y-6" data-testid="phone-login">
        <form className="w-full flex flex-col" action={sendAction}>
          <input type="hidden" name="returnUrl" value={returnUrl || ""} />
          <input type="hidden" name="next" value={next || ""} />
          <div className="flex flex-col w-full gap-y-3">
            <div className="flex items-center gap-x-2">
              <span className="text-sm text-ui-fg-subtle font-medium whitespace-nowrap pt-2">
                +91
              </span>
              <Input
                label="WhatsApp Number"
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                required
                disabled={isSending}
                autoComplete="tel-national"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                data-testid="phone-input"
              />
            </div>
          </div>
          <SubmitButton
            data-testid="send-otp-button"
            isLoading={isSending}
            className="w-full mt-6 rounded-xl py-4 bg-primary border-primary shadow-none hover:bg-foreground transition-all"
          >
            Send OTP
          </SubmitButton>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-y-6" data-testid="otp-verify">
      <p className="text-sm text-ui-fg-subtle text-center">
        Code sent to{" "}
        <span className="font-medium text-ui-fg-base">+91 {phone}</span>
      </p>
      <form className="w-full flex flex-col" action={verifyAction}>
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="returnUrl" value={returnUrl || ""} />
        <input type="hidden" name="next" value={next || ""} />
        <div className="flex flex-col w-full gap-y-3">
          <Input
            label={PHONE_LOGIN_OTP_LABEL}
            name="code"
            type="text"
            inputMode="numeric"
            pattern={PHONE_LOGIN_OTP_INPUT_PATTERN}
            maxLength={PHONE_LOGIN_OTP_LENGTH}
            required
            disabled={isVerifying}
            autoComplete="one-time-code"
            data-testid="otp-input"
          />
        </div>
        <SubmitButton
          data-testid="verify-otp-button"
          isLoading={isVerifying}
          className="w-full mt-6 rounded-xl py-4 bg-primary border-primary shadow-none hover:bg-foreground transition-all"
        >
          Verify
        </SubmitButton>
      </form>
      <div className="flex items-center justify-center gap-x-4 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isSending}
          className="underline font-medium text-ui-fg-subtle hover:text-black transition-colors disabled:opacity-50 disabled:no-underline"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
        </button>
        <span className="text-ui-fg-muted">|</span>
        <button
          type="button"
          onClick={() => setOtpSent(false)}
          disabled={isVerifying}
          className="underline font-medium text-ui-fg-subtle hover:text-black transition-colors disabled:opacity-50"
        >
          Change number
        </button>
      </div>
    </div>
  )
}

export default PhoneLogin
