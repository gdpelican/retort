import { createWidget } from 'discourse/widgets/widget'
import { h } from 'virtual-dom'

export default createWidget('retort-toggle', {
  tagName: 'div.post-retort.post-retort-count',
  buildKey: (attrs) => `retort-count-${attrs.emoji}-${attrs.count}`,

  html(attrs) {
    return this.attach('button', {
      action: 'toggleWhoRetorted',
      actionParam: attrs.emoji,
      contents: h('span', `${attrs.count}`),
      classes: 'btn-flat'
    });
  }
})
