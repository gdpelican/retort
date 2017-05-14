import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/retort-toggle'
import Retort from '../lib/retort'

export default createWidget('retort-toggle', {
  tagName: 'button.post-retort',

  buildKey: (attrs) => `retort-toggle-${attrs.emoji}`,

  defaultState(attrs) {
    return {
      emoji:     attrs.emoji,
      post:      attrs.post,
      usernames: attrs.usernames
    }
  },

  click() {
    Retort.updateRetort(this.state.post, this.state.emoji)
  },

  html() { return template.render(this) }
})
