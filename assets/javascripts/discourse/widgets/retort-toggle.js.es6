import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/retort-toggle'
import { default as Retort, allowedTextEmojis } from '../lib/retort'

export default createWidget('retort-toggle', {
  tagName: 'button.post-retort',

  buildKey: (attrs) => `retort-toggle-${attrs.emoji}-${attrs.usernames.length}`,

  buildClasses(attrs) {
    let classes = '';

    const textEmojis = allowedTextEmojis();
    if (textEmojis.length && textEmojis.indexOf(attrs.emoji) > -1) {
      classes += ' text';
    }

    return classes;
  },

  defaultState(attrs) {
    return {
      emoji:     attrs.emoji,
      post:      attrs.post,
      usernames: attrs.usernames
    }
  },

  click() {
    Retort.updateRetort(this.state.post.id, this.state.emoji)
  },

  html() { return template.render(this) }
})
