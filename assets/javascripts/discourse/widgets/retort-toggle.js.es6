import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/retort-toggle'
import Retort from '../lib/retort'

export default createWidget('retort-toggle', {
  tagName: 'button.post-retort',

  buildKey: (attrs) => `retort-toggle-${attrs.emoji}-${attrs.usernames.length}`,

  defaultState(attrs) {
    return {
      emoji:     attrs.emoji,
      post:      attrs.post,
      usernames: attrs.usernames
    }
  },

  click() {
    const { emoji, post, usernames } = this.state;
    this.sendWidgetAction('toggledRetort', emoji);
    Retort.updateRetort(post.id, emoji)
  },

  html() { return template.render(this) }
})
