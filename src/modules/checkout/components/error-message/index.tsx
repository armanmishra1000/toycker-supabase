const ErrorMessage = ({
  error,
  variant = "error",
  'data-testid': dataTestid
}: {
  error?: string | null,
  variant?: "error" | "info",
  'data-testid'?: string
}) => {
  if (!error) {
    return null
  }

  return (
    <div
      className={`pt-2 text-small-regular ${variant === "error" ? "text-rose-500" : "text-blue-600"}`}
      data-testid={dataTestid}
    >
      <span>{error}</span>
    </div>
  )
}

export default ErrorMessage
