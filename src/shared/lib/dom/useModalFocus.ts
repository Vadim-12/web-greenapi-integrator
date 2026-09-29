import { useEffect } from 'react'
import type { RefObject } from 'react'

const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useModalFocus(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!container) return undefined

    const getFocusableElements = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    const firstElement = container.querySelector<HTMLElement>('[data-autofocus]') || getFocusableElements()[0]
    firstElement?.focus()

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== 'Tab') return
      const focusableElements = getFocusableElements()
      if (!focusableElements.length) return
      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', trapFocus)
    return () => {
      container.removeEventListener('keydown', trapFocus)
      previouslyFocused?.focus()
    }
  }, [containerRef])
}
