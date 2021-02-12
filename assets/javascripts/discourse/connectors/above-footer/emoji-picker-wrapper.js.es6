import Retort from '../../lib/retort'

export default {
  setupComponent(args, component) {
    Retort.setPicker(component)
  }
}
