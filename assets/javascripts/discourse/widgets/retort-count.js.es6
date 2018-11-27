import { createWidget } from 'discourse/widgets/widget'
import Retort from '../lib/retort'

export default createWidget('retort-toggle', {
  tagName: 'span.post-retort-count',
  buildKey: (attrs) => `retort-count-${attrs.emoji}-${attrs.usernames.length}`,

  defaultState(attrs) {
    return {
      emoji:          attrs.emoji,
      usernames:      attrs.usernames,
      alternateCount: attrs.alternateCount
    }
  },

  click() {
    this.sendWidgetAction('showAvatarsFor', this.state.emoji);
  },

  html() { return template.render(this) }
})
