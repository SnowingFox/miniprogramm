import { DefineComponent } from "vue"
import { InnerJSBridge } from "./bridge/bridge"
import { LifecycleHooks } from "./lifecycle/hooks"

export const routes = new Map<string, DefineComponent>()

export function defineRouter(path: string, component: DefineComponent) {
  routes.set(path, component.isWrapper ? component : wrapper(component))
}

export function getPageComponentFormRoute(route: string) {
  return routes.get(route)
}

export function decodeURL(url: string) {
  const arr = url.split("?")
  let query: Record<string, any> = {}
  if (arr) {
    const path = arr[0]
    const queryStr = arr[1]
    if (queryStr) {
      const s = decodeURI(queryStr).replace(/"/g, `\\"`).replace(/&/g, `","`).replace(/=/g, `":"`)
      query = JSON.parse(`{"${s}"}`)
    }
    return { path, query }
  } else {
    return { path: url, query }
  }
}

function wrapper(component: DefineComponent) {
  const { setup } = component
  component.inheritAttrs = false
  component.isWrapper = true
  component.setup = (props, ctx) => {
    const {
      __pageId: pageId,
      __route: route,
      __query: query
    } = ctx.attrs as {
      __pageId: number
      __route: string
      __query: Record<string, any>
    }

    if (!setup) {
      return
    }

    const render = setup(props, ctx)

    InnerJSBridge.subscribeHandler(LifecycleHooks.PAGE_ON_LOAD, {
      pageId,
      query
    })

    InnerJSBridge.subscribeHandler(LifecycleHooks.PAGE_ON_SHOW, { pageId, route })
    return render
  }
  return component
}
