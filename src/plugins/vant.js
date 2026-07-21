// Vant 按需注册：仅注册实际使用的组件，配合打包器 tree-shaking，显著减小首屏 JS。
// 函数式调用（showToast / showConfirmDialog）依赖下方全量样式；其组件亦一并注册以防样式缺失。
import {
  NavBar,
  Icon,
  Button,
  Field,
  Cell,
  CellGroup,
  Popup,
  Radio,
  RadioGroup,
  Stepper,
  Dialog,
  Toast,
  ConfigProvider
} from 'vant'
import 'vant/lib/index.css'

const components = [
  ConfigProvider,
  NavBar,
  Icon,
  Button,
  Field,
  Cell,
  CellGroup,
  Popup,
  Radio,
  RadioGroup,
  Stepper,
  Dialog,
  Toast
]

export function installVant(app) {
  components.forEach((c) => app.use(c))
}
