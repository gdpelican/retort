import { h } from 'virtual-dom'
import { emojiUrlFor } from 'discourse/lib/text'

export default Ember.Object.create({
  render(widget) {
    this.state = widget.state
    return [this.emoji(), this.count(), this.tooltip()]
  },

  emoji() {
    return h('img.emoji', { src: emojiUrlFor(this.state.emoji), alt: `:${this.state.emoji}:` })
  },

  count() {
    if (this.state.usernames.length < 2) { return }
    return h('span.post-retort__count', this.state.usernames.length.toString())
  },

  tooltip() {
    return h('span.post-retort__tooltip', this.sentence())
  },

  sentence() {
    return I18n.t(this.sentenceKey(), {
      first:  this.state.usernames[0],
      second: this.state.usernames[1],
      count:  this.state.usernames.length - 2,
      emoji:  this.state.emoji
    })
  },

  sentenceKey() {
    switch(this.state.usernames.length) {
      case 1:  return 'retort.reactions.one_person'
      case 2:  return 'retort.reactions.two_people'
      default: return 'retort.reactions.many_people'
    }
  }

})
