import { isEvokerElement } from "./element"
import { EvokerEventListenerOptions } from "./vnode"
import { sync } from "@evoker/bridge"
import { SyncFlags } from "@evoker/shared"

interface Event {
  type: string
  args: any
}

export function dispatchEvent(nodeId: number, event: string | Event) {
  const message = [SyncFlags.DISPATCH_EVENT, window.webViewId, nodeId, event]
  sync(message, window.webViewId)
}

let singleTouch = -1

export const enum TouchEventType {
  START = "touchstart",
  MOVE = "touchmove",
  END = "touchend",
  CANCEL = "touchcancel"
}

export const touchEvents = ["touchstart", "touchmove", "touchend", "touchcancel"]

export const tapEvents = ["click", "longpress"]

export function addTouchEvent(
  nodeId: number,
  el: any,
  type: string,
  options: EvokerEventListenerOptions
) {
  const listenerOptions: Record<string, EvokerEventListenerOptions> =
    el.__listenerOptions || (el.__listenerOptions = {})

  listenerOptions[type] = options

  el.addEventListener(
    type,
    (ev: TouchEvent) => {
      const listener = listenerOptions[type]
      if (listener && listener.modifiers) {
        if (listener.modifiers.includes("stop")) {
          ev.stopPropagation()
        }
        if (listener.modifiers.includes("prevent")) {
          ev.preventDefault()
        }
      }

      const event = createCustomTouchEvent(el, ev, type)
      dispatchEvent(nodeId, { type, args: [event] })
    },
    {
      capture: false,
      passive: true
    }
  )
}

export function addClickEvent(el: any, onClick?: (ev: TouchEvent, isLongPress: boolean) => void) {
  const listenerOptions: Record<string, EvokerEventListenerOptions> =
    el.__listenerOptions || (el.__listenerOptions = {})

  let touchStartTimestamp = 0
  let isTouch = true
  let isMoved = false

  const isDisabled = () => {
    let result = false
    if (isEvokerElement(el)) {
      const { disabled, loading } = el.__instance.props as {
        disabled: boolean
        loading: boolean
      }
      result = disabled || loading
    }
    return result
  }

  const onStart = (ev: TouchEvent) => {
    touchStartTimestamp = ev.timeStamp
    isTouch = true
    if (isDisabled()) {
      ev.stopPropagation()
      ev.preventDefault()
      isMoved = false
      return
    }

    const firstTouch = ev.changedTouches[0]
    if (singleTouch === -1 && firstTouch) {
      singleTouch = firstTouch.identifier
    }
  }

  const onMove = (ev: TouchEvent) => {
    isTouch && (isMoved = true)
  }

  const onEnd = (ev: TouchEvent) => {
    const firstTouch = ev.changedTouches[0]
    if (firstTouch.identifier !== singleTouch) {
      isMoved = false
      return
    }

    if (isDisabled()) {
      ev.stopPropagation()
      ev.preventDefault()
      isMoved = false
      return
    }

    singleTouch = -1

    if (!isMoved) {
      const isLongPress = ev.timeStamp - touchStartTimestamp > 350
      onClick && onClick(ev, isLongPress)

      const listener = isLongPress ? listenerOptions["longpress"] : listenerOptions["click"]
      if (listener && listener.modifiers) {
        if (listener.modifiers.includes("stop")) {
          ev.stopPropagation()
        }
        if (listener.modifiers.includes("prevent")) {
          ev.preventDefault()
        }
      }
    }
    isTouch = false
    isMoved = false
  }

  const onCancel = (ev: TouchEvent) => {
    isTouch = false
    isMoved = false
    singleTouch = -1
  }

  el.addEventListener("touchstart", onStart, {
    capture: false,
    passive: true
  })

  el.addEventListener("touchmove", onMove, {
    capture: false,
    passive: true
  })

  el.addEventListener("touchend", onEnd, {
    capture: false,
    passive: true
  })

  el.addEventListener("touchcancel", onCancel, {
    capture: false,
    passive: true
  })

  const remove = () => {
    el.removeEventListener("touchstart", onStart)
    el.removeEventListener("touchmove", onMove)
    el.removeEventListener("touchend", onEnd)
    el.removeEventListener("touchcancel", onCancel)
  }

  return remove
}

export function addTapEvent(
  nodeId: number,
  el: any,
  type: string,
  options: EvokerEventListenerOptions
) {
  const listenerOptions: Record<string, EvokerEventListenerOptions> =
    el.__listenerOptions || (el.__listenerOptions = {})
  listenerOptions[type] = options

  if (el.__touchEvent) {
    return el.__touchEvent as () => void
  }

  el.__touchEvent = addClickEvent(el, (ev, isLongPress) => {
    const type = listenerOptions["longpress"] && isLongPress ? "longpress" : "click"
    const event = createCustomTouchEvent(el, ev, type)
    dispatchEvent(nodeId, { type, args: [event] })
  })
  return el.__touchEvent as () => void
}

function createCustomTouchEvent(currentTarget: HTMLElement, ev: TouchEvent, type: string) {
  const target = ev.target as HTMLElement

  const changedTouches: EvokerTouch[] = []

  for (let i = 0; i < ev.changedTouches.length; i++) {
    const touch = ev.changedTouches.item(i)!
    changedTouches.push({
      identifier: touch.identifier,
      force: touch.force,
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY
    })
  }

  const touch = ev.changedTouches.item(0)!

  const event: EvokerTouchEvent & EvokerCustomEvent = {
    type: type,
    timestamp: Date.now(),
    target: {
      id: target.id,
      offsetLeft: target.offsetLeft,
      offsetTop: target.offsetTop
    },
    currentTarget: {
      id: currentTarget.id,
      offsetLeft: currentTarget.offsetLeft,
      offsetTop: currentTarget.offsetTop
    },
    touches: changedTouches,
    changedTouches,
    detail: {
      x: touch.pageX,
      y: touch.pageY
    }
  }
  return event
}

export function createCustomEvent(
  currentTarget: HTMLElement,
  type: string,
  detail: Record<string, any>
) {
  const target = {
    id: currentTarget.id,
    offsetLeft: currentTarget.offsetLeft,
    offsetTop: currentTarget.offsetTop
  }
  const event: EvokerCustomEvent = {
    type: type,
    timestamp: Date.now(),
    target,
    currentTarget: target,
    detail
  }
  return event
}

interface EvokerEventTarget {
  id: string
  offsetLeft: number
  offsetTop: number
}

interface EvokerTouch {
  identifier: number
  clientX: number
  clientY: number
  force: number
  pageX: number
  pageY: number
}

interface EvokerBaseEvent {
  type: string
  timestamp: number
  target: EvokerEventTarget
  currentTarget: EvokerEventTarget
}

interface EvokerTouchEvent extends EvokerBaseEvent {
  touches: EvokerTouch[]
  changedTouches: EvokerTouch[]
}

interface EvokerCustomEvent extends EvokerBaseEvent {
  detail: Record<string, any>
}
