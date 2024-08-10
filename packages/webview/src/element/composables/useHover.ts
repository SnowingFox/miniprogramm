import { ref, Ref, watch, computed, onMounted, onUnmounted } from "vue"

interface Props {
  hoverClass: string
  hoverStopPropagation: boolean
  hoverStartTime: number
  hoverStayTime: number
  disabled?: boolean
  loading?: boolean
}

export function useHover(el: Ref<HTMLElement | undefined>, props: Props) {
  const hovering = ref(false)

  let hoverStartTimer: ReturnType<typeof setTimeout>
  let hoverStayTimer: ReturnType<typeof setTimeout>

  watch(
    () => props.hoverClass,
    () => {
      checkBindHover()
    }
  )

  onMounted(() => {
    checkBindHover()
  })

  onUnmounted(() => {
    unbindHover()
  })

  const finalHoverClass = computed(() => {
    if (hovering.value && props.hoverClass !== "none") {
      return props.hoverClass
    }
    return ""
  })

  const checkBindHover = () => {
    if (props.hoverClass === "none") {
      unbindHover()
    } else {
      bindHover()
    }
  }

  const bindHover = () => {
    if (el.value) {
      el.value.addEventListener("touchstart", hoverTouchStart)
      el.value.addEventListener("canceltap", hoverCancel)
      el.value.addEventListener("touchcancel", hoverCancel)
      el.value.addEventListener("touchend", hoverTouchEnd)
    }
  }

  const unbindHover = () => {
    if (el.value) {
      el.value.removeEventListener("touchstart", hoverTouchStart)
      el.value.removeEventListener("canceltap", hoverCancel)
      el.value.removeEventListener("touchcancel", hoverCancel)
      el.value.removeEventListener("touchend", hoverTouchEnd)
    }
  }

  const hoverTouchStart = (e: TouchEvent) => {
    props.hoverStopPropagation && e.stopPropagation()

    if (props.disabled || props.loading || e.touches.length > 1 || hovering.value) {
      return
    }

    hoverStartTimer = setTimeout(() => {
      hovering.value = true
    }, props.hoverStartTime)
  }

  const hoverTouchEnd = (e: Event) => {
    props.hoverStopPropagation && e.stopPropagation()

    clearTimeout(hoverStayTimer)
    hoverStayTimer = setTimeout(() => {
      hovering.value = false
    }, props.hoverStayTime)
  }

  const hoverCancel = (e: Event) => {
    props.hoverStopPropagation && e.stopPropagation()

    hovering.value = false
    clearTimeout(hoverStartTimer)
    clearTimeout(hoverStayTimer)
  }

  return {
    finalHoverClass,
    bindHover,
    unbindHover
  }
}
