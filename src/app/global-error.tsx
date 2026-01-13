'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({
    error,
}: {
    error: Error & { digest?: string }
}) {
    useEffect(() => {
        Sentry.captureException(error)
    }, [error])

    return (
        <html>
            <body>
                {/* `NextError` is the default Next.js error page component. Its type definition is 
            fixed to only have `statusCode`, but it also accepts `title`. */}
                <NextError statusCode={0} />
            </body>
        </html>
    )
}
