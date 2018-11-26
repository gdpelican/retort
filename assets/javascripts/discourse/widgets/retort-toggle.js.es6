import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/retort-toggle'
import Retort from '../lib/retort'

export default createWidget('retort-toggle', {
  tagName: 'button.post-retort',

  buildKey: (attrs) => `retort-toggle-${attrs.emoji}-${attrs.usernames.length}`,

  buildClasses(attrs) {
    let classes = '';

    const allowedEmojis = this._allowedEmojis();
    if (allowedEmojis.length) {
      const textEmojis = this._textEmojis();
      if (textEmojis.length && textEmojis.indexOf(attrs.emoji) > -1) {
        classes += ' text';
      }
    }

    return classes;
  },

  _allowedEmojis() {
    return Discourse.SiteSettings.retort_allowed_emojis.split('|');
  },

  _textEmojis() {
    return this._allowedEmojis().filter(e => e.indexOf(':text') > -1)
      .map(e => e.split(':')[0]);
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
