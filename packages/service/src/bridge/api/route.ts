import { InnerJSBridge } from "../bridge"
import {
  AsyncReturn,
  SuccessResult,
  GeneralCallbackResult,
  invokeCallback,
  invokeFailure,
  invokeSuccess,
  wrapperAsyncAPI,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_CANNOT_EMPTY
} from "@evoker/bridge"
import { innerAppData } from "../../app"
import { isString } from "@vue/shared"

function parseURL(url: string) {
  const [path, query] = url.split("?")
  return {
    path,
    query: queryToObject(query)
  }
}

function queryToObject(queryString: string) {
  const query: Record<string, any> = {}

  if (!queryString) {
    return query
  }

  const pl = /\+/g
  function decode(s: string) {
    return decodeURIComponent(s.replace(pl, " "))
  }

  const search = /([^&=]+)=?([^&]*)/g

  let match: RegExpExecArray | null
  while ((match = search.exec(queryString))) {
    query[decode(match[1])] = decode(match[2])
  }
  return query
}

export function pathIsTabBar(path: string) {
  if (globalThis.__Config.tabBar) {
    return (
      globalThis.__Config.tabBar.list.find(item => {
        return item.path == path
      }) !== undefined
    )
  }
  return false
}

function pathResolve(relativePath: string, url: string) {
  if (url.indexOf("/") === 0) {
    return url.substring(1)
  } else if (url.indexOf("./") === 0) {
    return pathResolve(relativePath, url.substring(2))
  }
  const components = url.split("/")
  let i = 0
  for (; i < components.length && components[i] === ".."; i++);
  components.splice(0, i)

  const relativePathComponents = relativePath.length > 0 ? relativePath.split("/") : []
  relativePathComponents.splice(relativePathComponents.length - i - 1, i + 1)
  return [...relativePathComponents, ...components].join("/")
}

export function pathIsExist(path: string) {
  return (
    globalThis.__Config.pages.find(page => {
      return page.path === path
    }) !== undefined
  )
}

const enum Events {
  NAVIGATE_TO = "navigateTo",
  NAVIGATE_BACK = "navigateBack",
  REDIRECT_TO = "redirectTo",
  RE_LAUNCH = "reLaunch",
  SWITCH_TAB = "switchTab"
}

interface NavigateToOptions {
  /** 需要跳转的应用内非 tabBar 的页面的路径 (代码包路径), 路径后可以带参数 */
  url: string
  /** 接口调用成功的回调函数 */
  success?: NavigateToSuccessCallback
  /** 接口调用失败的回调函数 */
  fail?: NavigateToFailCallback
  /** 接口调用结束的回调函数（调用成功、失败都会执行）*/
  complete?: NavigateToCompleteCallback
}

type NavigateToSuccessCallback = (res: GeneralCallbackResult) => void

type NavigateToFailCallback = (res: GeneralCallbackResult) => void

type NavigateToCompleteCallback = (res: GeneralCallbackResult) => void

/** 保留当前页面，跳转到应用内的某个页面。但是不能跳到 tabBar 页面 */
export function navigateTo<T extends NavigateToOptions = NavigateToOptions>(
  options: T
): AsyncReturn<T, NavigateToOptions> {
  return wrapperAsyncAPI(options => {
    const event = Events.NAVIGATE_TO
    if (innerAppData.routerLock) {
      invokeFailure(
        Events.NAVIGATE_TO,
        options,
        "防止重复多次打开页面，需要在新页面打开完成后才能调用。"
      )
      return
    }

    if (!isString(options.url)) {
      invokeFailure(event, options, ERR_INVALID_ARG_TYPE("options.url", "string", options.url))
      return
    }

    if (!options.url) {
      invokeFailure(
        event,
        options,
        ERR_INVALID_ARG_VALUE("options.url", options.url, ERR_CANNOT_EMPTY)
      )
      return
    }

    const relativePath = (options as any).relativePath
      ? (options as any).relativePath
      : innerAppData.lastRoute
    options.url = pathResolve(relativePath, options.url)

    const { path, query } = parseURL(options.url)

    if (pathIsTabBar(path)) {
      invokeFailure(event, options, "cannot navigate to tabbar page")
      return
    }

    if (!pathIsExist(path)) {
      invokeFailure(event, options, `${options.url} is not found`)
      return
    }

    innerAppData.routerLock = true
    InnerJSBridge.invoke(event, options, result => {
      innerAppData.routerLock = false
      if (result.errMsg) {
        invokeFailure(event, options, result.errMsg)
      } else {
        innerAppData.query = query
        invokeSuccess(event, options, {})
      }
    })
  }, options)
}

interface NavigateBackOptions {
  /** 返回的页面数，如果 delta 大于现有页面数，则返回到首页 */
  delta?: number
  /** 接口调用成功的回调函数 */
  success?: NavigateBackSuccessCallback
  /** 接口调用失败的回调函数 */
  fail?: NavigateBackFailCallback
  /** 接口调用结束的回调函数（调用成功、失败都会执行）*/
  complete?: NavigateBackCompleteCallback
}

type NavigateBackSuccessCallback = (res: GeneralCallbackResult) => void

type NavigateBackFailCallback = (res: GeneralCallbackResult) => void

type NavigateBackCompleteCallback = (res: GeneralCallbackResult) => void

/** 关闭当前页面，返回上一页面或多级页面 */
export function navigateBack<T extends NavigateBackOptions = NavigateBackOptions>(
  options: T
): AsyncReturn<T, NavigateBackOptions> {
  return wrapperAsyncAPI(
    options => {
      const event = Events.NAVIGATE_BACK
      if (innerAppData.routerLock) {
        invokeFailure(event, options, "防止重复多次打开页面，需要在新页面打开完成后才能调用。")
        return
      }

      innerAppData.routerLock = true
      InnerJSBridge.invoke<SuccessResult<T>>(event, options, result => {
        innerAppData.routerLock = false
        invokeCallback(event, options, result)
      })
    },
    options,
    { delta: 1 }
  )
}

interface RedirectToOptions {
  /** 需要跳转的应用内非 tabBar 的页面的路径 (代码包路径), 路径后可以带参数 */
  url: string
  /** 接口调用成功的回调函数 */
  success?: RedirectToSuccessCallback
  /** 接口调用失败的回调函数 */
  fail?: RedirectToFailCallback
  /** 接口调用结束的回调函数（调用成功、失败都会执行）*/
  complete?: RedirectToCompleteCallback
}

type RedirectToSuccessCallback = (res: GeneralCallbackResult) => void

type RedirectToFailCallback = (res: GeneralCallbackResult) => void

type RedirectToCompleteCallback = (res: GeneralCallbackResult) => void

/** 关闭当前页面，跳转到应用内的某个页面。但是不允许跳转到 tabBar 页面 */
export function redirectTo<T extends RedirectToOptions = RedirectToOptions>(
  options: T
): AsyncReturn<T, RedirectToOptions> {
  return wrapperAsyncAPI(options => {
    const event = Events.REDIRECT_TO
    if (!isString(options.url)) {
      invokeFailure(event, options, ERR_INVALID_ARG_TYPE("options.url", "string", options.url))
      return
    }

    if (!options.url) {
      invokeFailure(
        event,
        options,
        ERR_INVALID_ARG_VALUE("options.url", options.url, ERR_CANNOT_EMPTY)
      )
      return
    }

    const relativePath = (options as any).relativePath
      ? (options as any).relativePath
      : innerAppData.lastRoute
    options.url = pathResolve(relativePath, options.url)

    const { path, query } = parseURL(options.url)

    if (pathIsTabBar(path)) {
      invokeFailure(event, options, "cannot redirectTo tabbar page")
      return
    }

    if (!pathIsExist(path)) {
      invokeFailure(event, options, `${options.url} is not found`)
      return
    }

    InnerJSBridge.invoke<SuccessResult<T>>(event, options, result => {
      if (result.errMsg) {
        invokeFailure(event, options, result.errMsg)
      } else {
        innerAppData.query = query
        invokeSuccess(event, options, {})
      }
    })
  }, options)
}

interface ReLaunchOptions {
  /** 需要跳转的应用内页面路径 (代码包路径)，路径后可以带参数 */
  url: string
  /** 接口调用成功的回调函数 */
  success?: ReLaunchSuccessCallback
  /** 接口调用失败的回调函数 */
  fail?: ReLaunchFailCallback
  /** 接口调用结束的回调函数（调用成功、失败都会执行）*/
  complete?: ReLaunchCompleteCallback
}

type ReLaunchSuccessCallback = (res: GeneralCallbackResult) => void

type ReLaunchFailCallback = (res: GeneralCallbackResult) => void

type ReLaunchCompleteCallback = (res: GeneralCallbackResult) => void

/** 关闭所有页面，打开到应用内的某个页面，并非真的重启应用 */
export function reLaunch<T extends ReLaunchOptions = ReLaunchOptions>(
  options: T
): AsyncReturn<T, ReLaunchOptions> {
  return wrapperAsyncAPI(options => {
    const event = Events.RE_LAUNCH
    if (!isString(options.url)) {
      invokeFailure(event, options, ERR_INVALID_ARG_TYPE("options.url", "string", options.url))
      return
    }

    if (!options.url) {
      invokeFailure(
        event,
        options,
        ERR_INVALID_ARG_VALUE("options.url", options.url, ERR_CANNOT_EMPTY)
      )
      return
    }

    const relativePath = (options as any).relativePath
      ? (options as any).relativePath
      : innerAppData.lastRoute
    options.url = pathResolve(relativePath, options.url)

    const { path, query } = parseURL(options.url)

    const exist = globalThis.__Config.pages.find(page => {
      return page.path === path
    })

    if (exist === undefined) {
      invokeFailure(event, options, `${options.url} is not found`)
      return
    }

    InnerJSBridge.invoke<SuccessResult<T>>(event, options, result => {
      if (result.errMsg) {
        invokeFailure(event, options, result.errMsg)
      } else {
        innerAppData.query = query
        invokeSuccess(event, options, {})
      }
    })
  }, options)
}

interface SwitchTabOptions {
  /** 需要跳转的 tabBar 页面的路径 (代码包路径)（需在 app.json 的 tabBar 字段定义的页面），路径后不能带参数 */
  url: string
  /** 接口调用成功的回调函数 */
  success?: SwitchTabSuccessCallback
  /** 接口调用失败的回调函数 */
  fail?: SwitchTabFailCallback
  /** 接口调用结束的回调函数（调用成功、失败都会执行）*/
  complete?: SwitchTabCompleteCallback
}

type SwitchTabSuccessCallback = (res: GeneralCallbackResult) => void

type SwitchTabFailCallback = (res: GeneralCallbackResult) => void

type SwitchTabCompleteCallback = (res: GeneralCallbackResult) => void

/** 跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面 */
export function switchTab<T extends SwitchTabOptions = SwitchTabOptions>(
  options: T
): AsyncReturn<T, SwitchTabOptions> {
  return wrapperAsyncAPI(options => {
    const event = Events.SWITCH_TAB
    if (!isString(options.url)) {
      invokeFailure(event, options, ERR_INVALID_ARG_TYPE("options.url", "string", options.url))
      return
    }

    if (!options.url) {
      invokeFailure(
        event,
        options,
        ERR_INVALID_ARG_VALUE("options.url", options.url, ERR_CANNOT_EMPTY)
      )
      return
    }
    if (globalThis.__Config.tabBar) {
      const relativePath = (options as any).relativePath
        ? (options as any).relativePath
        : innerAppData.lastRoute
      options.url = pathResolve(relativePath, options.url)

      const { path } = parseURL(options.url)
      const exist = globalThis.__Config.tabBar.list.find(item => {
        return item.path === path
      })
      if (exist === undefined) {
        invokeFailure(event, options, `${path} is not found`)
        return
      }
      InnerJSBridge.invoke<SuccessResult<T>>(event, { url: path }, result => {
        if (!result.errMsg) {
          innerAppData.lastRoute = path
        }
        invokeCallback(event, options, result)
      })
    } else {
      invokeFailure(event, options, `app.config tabBar undefined`)
      return
    }
  }, options)
}
