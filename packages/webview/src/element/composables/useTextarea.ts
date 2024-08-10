import { onUnmounted } from "vue"
import { JSBridge } from "../../bridge"
import { addEvent, removeEvent, dispatchEvent } from "@evoker/shared"

enum SubscribeKeys {
  HEIGHT_CHANGE = "WEBVIEW_TEXTAREA_HEIGHT_CHANGE"
}

Object.values(SubscribeKeys).forEach(key => {
  JSBridge.subscribe(key, data => {
    dispatchEvent(key, data)
  })
})

export function useTextArea(inputId: number) {
  const ids = new Map<string, number>()

  function createListener(key: SubscribeKeys, callback: (data: any) => void) {
    const id = addEvent<{ inputId: number }>(key, data => {
      if (data.inputId === inputId) {
        callback(data)
      }
    })
    ids.set(key, id)
    return id
  }

  function onTextAreaHeightChange(
    callback: (data: { inputId: number; height: number; lineCount: number }) => void
  ) {
    return createListener(SubscribeKeys.HEIGHT_CHANGE, callback)
  }

  function removaAllListener() {
    ids.forEach((id, event) => removeEvent(event, id))
  }

  onUnmounted(() => {
    removaAllListener()
  })

  return {
    onTextAreaHeightChange,
    removaAllListener
  }
}
