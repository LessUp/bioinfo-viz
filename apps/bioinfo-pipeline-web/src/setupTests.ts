import '@testing-library/jest-dom'

// Polyfill ResizeObserver for ECharts usage in tests
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error - attach to window for test env
  window.ResizeObserver = ResizeObserver
}
