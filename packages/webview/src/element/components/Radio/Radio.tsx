import {
  watch,
  nextTick,
  onMounted,
  getCurrentInstance,
  defineComponent,
  withDirectives,
  VNode
} from "vue"
import Icon from "../icon"
import { vTap } from "../../directive/tap"
import { useParent, ParentProvide } from "../../composables/useRelation"
import { RADIO_GROUP_KEY, RadioProvide } from "./constant"

const props = {
  value: { type: String },
  checked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  color: { type: String, default: "#1989fa" }
}

export default defineComponent({
  name: "ek-radio",
  props,
  setup(props, { expose }) {
    const instance = getCurrentInstance()!

    let group: ParentProvide<RadioProvide> | undefined

    onMounted(async () => {
      await nextTick()
      group = useParent(instance, RADIO_GROUP_KEY)
      props.checked && onChecked(false)
    })

    watch(
      () => props.checked,
      () => {
        props.checked && onChecked(false)
      }
    )

    const onClick = () => {
      if (props.disabled) {
        return
      }
      !props.checked && onChecked(true)
    }

    const onChecked = (dispatch: boolean) => {
      props.value && group && group.onChecked(props.value, dispatch)
    }

    expose({
      value: props.value,
      getChecked: () => props.checked,
      setChecked: (checked: boolean) => {
        instance.props.checked = checked
      },
      onTapLabel: () => {
        onClick()
      }
    })

    return () => {
      const node = (
        <ek-radio class={{ "ek-radio--disabled": props.disabled }}>
          <Icon type={props.checked ? "success" : "circle"} color={props.color} />
          <span class="ek-radio__label"></span>
        </ek-radio>
      )
      return withDirectives(node as VNode, [[vTap, onClick, "", { stop: true }]])
    }
  }
})
