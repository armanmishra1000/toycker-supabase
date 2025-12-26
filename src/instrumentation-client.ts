"use client"

import { onCLS, onINP, onLCP, onTTFB, type Metric } from "web-vitals"

type LoggedMetric = {
  name: string
  id?: string
  value?: number
  rating?: string
  delta?: number
  entries?: Metric["entries"]
  navigationType?: Metric["navigationType"]
  detail?: Record<string, unknown>
}

const logMetric = (metric: LoggedMetric) => {
  const payload = {
    name: metric.name,
    label: metric.id,
    value: metric.value,
    rating: metric.rating,
    detail: metric.detail,
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[PerfMetric]", payload)
  }

  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      })
      navigator.sendBeacon("/api/cache/telemetry", blob)
    } catch (error) {
      console.error("Failed to send metric", error)
    }
  }
}

const recordInitialNavigation = () => {
  if (!("performance" in window)) {
    return
  }

  const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[]
  if (!entry) {
    return
  }

  logMetric({
    name: "nav:ttfb",
    id: `${entry.type}-${entry.startTime}`,
    rating: entry.responseStart - entry.requestStart < 300 ? "good" : "poor",
    value: entry.responseStart - entry.requestStart,
    detail: {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
      load: entry.loadEventEnd - entry.startTime,
      type: entry.type,
    },
  })
}

type NavigateEvent = Event & {
  destination: { url: string }
  navigationType?: string
  transitionWhile?: (callback: Promise<unknown>) => void
}

type ExperimentalNavigation = {
  addEventListener?: (type: "navigate", listener: (event: NavigateEvent) => void) => void
}

const watchNavigationAPI = () => {
  const nav = (window as Window & { navigation?: ExperimentalNavigation }).navigation
  if (!nav?.addEventListener) {
    return
  }

  nav.addEventListener("navigate", (event) => {
    const start = performance.now()
    const target = event.destination.url || "unknown"

    event.transitionWhile?.(
      Promise.resolve().finally(() => {
        const duration = performance.now() - start
        logMetric({
          name: "nav:transition",
          id: target,
          value: duration,
          rating: duration < 500 ? "good" : duration < 1500 ? "needs-improvement" : "poor",
          detail: {
            target,
            navigationType: event.navigationType,
          },
        })
      }),
    )
  })
}

export function register() {
  if (typeof window === "undefined") {
    return
  }

  onLCP(logMetric)
  onCLS(logMetric)
  onINP(logMetric)
  onTTFB(logMetric)

  recordInitialNavigation()
  watchNavigationAPI()
}
