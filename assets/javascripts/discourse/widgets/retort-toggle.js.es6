import { h } from 'virtual-dom'
import { emojiUrlFor } from 'discourse/lib/text'
import { createWidget } from 'discourse/widgets/widget'
import Retort from '../lib/retort'

export default createWidget('retort-toggle', {
  tagName: 'button.post-retort',

  buildKey: attrs => `retort-toggle-${attrs.emoji}-${attrs.usernames.length}`,

  defaultState({ emoji, post, usernames }) {
    return { emoji, post, usernames }
  },

  click() {
    const { post, emoji } = this.state
    Retort.updateRetort(post, emoji)
  },

  html() {
    const { emoji, usernames } = this.state
    return [
      h('img.emoji', { src: emojiUrlFor(emoji), alt: `:${emoji}:` }),
      usernames.length > 1 ? h('span.post-retort__count', usernames.length.toString()) : '',
      h('span.post-retort__tooltip', this.sentence(this.state))
    ]
  },

  sentence({ usernames, emoji }) {
    let key
    switch(usernames.length) {
      case 1: key = 'retort.reactions.one_person'; break
      case 2: key = 'retort.reactions.two_people'; break
      default: key = 'retort.reactions.many_people'; break
    }

    return I18n.t(key, {
      emoji,
      first:  usernames[0],
      second: usernames[1],
      count:  usernames.length - 2
    })
  }
})
