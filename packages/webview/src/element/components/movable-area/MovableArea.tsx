import { defineComponent, ref, watch } from "vue"
import { useChildren } from "../../composables/useRelation"
import { MOVABLE_KEY } from "./constant"

export default defineComponent({
  name: "ek-movable-area",
  setup() {
    const container = ref<HTMLElement>()

    const { children, linkChildren } = useChildren(MOVABLE_KEY)

    linkChildren({})

    watch(
      () => [...children],
      children => {
        if (!container.value) {
          return
        }
        const rect = container.value.getBoundingClientRect()
        children.forEach(child => {
          child.exposed!.setAreaRect(rect)
        })
      }
    )

    return () => <ek-movable-area ref={container}></ek-movable-area>
  }
})
