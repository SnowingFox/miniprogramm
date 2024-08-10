import { InnerJSBridge } from "../bridge/bridge"
import { LifecycleHooks } from "./hooks"
import { addEvent, removeEvent } from "@evoker/shared"
import type {
  AppShowCallback,
  AppHideCallback,
  AppErrorCallback,
  AppThemeChangeCallback
} from "./useApp"

export function invokeAppOnError(error: unknown) {
  InnerJSBridge.subscribeHandler(LifecycleHooks.APP_ON_ERROR, error)
}

export function onShow(callback: AppShowCallback) {
  addEvent(LifecycleHooks.APP_ON_SHOW, callback)
}

export function offShow(callback: AppShowCallback) {
  removeEvent(LifecycleHooks.APP_ON_SHOW, callback)
}

export function onHide(callback: AppHideCallback) {
  addEvent(LifecycleHooks.APP_ON_HIDE, callback)
}

export function offHide(callback: AppHideCallback) {
  removeEvent(LifecycleHooks.APP_ON_HIDE, callback)
}

export function onError(callback: AppErrorCallback) {
  addEvent(LifecycleHooks.APP_ON_ERROR, callback)
}

export function offError(callback: AppErrorCallback) {
  removeEvent(LifecycleHooks.APP_ON_ERROR, callback)
}

export function onThemeChange(callback: AppThemeChangeCallback) {
  addEvent(LifecycleHooks.APP_THEME_CHANGE, callback)
}

export function offThemeChange(callback: AppThemeChangeCallback) {
  removeEvent(LifecycleHooks.APP_THEME_CHANGE, callback)
}

export function onAudioInterruptionBegin(callback: () => void) {
  addEvent(LifecycleHooks.APP_ON_AUDIO_INTERRUPTION_BEGIN, callback)
}

export function offAudioInterruptionBegin(callback: () => void) {
  removeEvent(LifecycleHooks.APP_ON_AUDIO_INTERRUPTION_BEGIN, callback)
}

export function onAudioInterruptionEnd(callback: () => void) {
  addEvent(LifecycleHooks.APP_ON_AUDIO_INTERRUPTION_END, callback)
}

export function offAudioInterruptionEnd(callback: () => void) {
  removeEvent(LifecycleHooks.APP_ON_AUDIO_INTERRUPTION_END, callback)
}
