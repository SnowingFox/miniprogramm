import { getLocalImage } from "../../bridge/api/image"

export interface ImageLoadResult {
  src: string
  width: number
  height: number
}

export const enum ImageLoadState {
  PENDING = 0,
  COMPLETED,
  FAILED
}

export interface ImageLazyLoadInfo {
  el: HTMLElement
  src: string
  state: ImageLoadState
  attempt: number
  callback: (result: ImageLoadResult) => void
}

export const imageLazyLoadInfos: ImageLazyLoadInfo[] = []

export function loadImage(src: string): Promise<ImageLoadResult> {
  return new Promise((resolve, reject) => {
    if (!src) {
      const err = new Error("load image src is required")
      return reject(err)
    }

    const image = new Image()

    image.onload = () => {
      resolve({
        src: image.src,
        width: image.naturalWidth,
        height: image.naturalHeight
      })
    }

    image.onerror = e => reject(e)

    if (/^webp/.test(src)) {
      image.src = src
    } else if (/^https?:\/\//.test(src)) {
      image.src = src
    } else if (/^\s*data:image\//.test(src)) {
      image.src = src
    } else {
      getLocalImage(src)
        .then(res => {
          image.src = res
        })
        .catch(reject)
    }
  })
}
