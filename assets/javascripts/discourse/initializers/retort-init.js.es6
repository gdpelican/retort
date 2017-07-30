import { withPluginApi } from 'discourse/lib/plugin-api'
import TopicRoute from 'discourse/routes/topic'
import Retort from '../lib/retort'
import { registerEmoji } from 'pretty-text/emoji'
import { emojiUrlFor } from 'discourse/lib/text'

function initializePlugin(api) {

  const siteSettings = api.container.lookup('site-settings:main')

  TopicRoute.on("setupTopicController", function(event) {
    let controller = event.controller
    Retort.set('topicController', controller)
    controller.messageBus.subscribe(`/retort/topics/${controller.model.id}`, (data) => { Retort.callback(data) })
  })

  api.decorateWidget('post-contents:after-cooked', helper => {
    let post = Retort.postFor(helper.getModel().id)
    Retort.storeWidget(helper)

    return _.map(post.retorts, (retort) => {
      return helper.attach('retort-toggle', {
        post:      post,
        usernames: retort.usernames,
        emoji:     retort.emoji
      })
    })
  })

  if (!Discourse.User.current() || !siteSettings.retort_enabled) { return }

  api.addPostMenuButton('retort', attrs => {
    return {
      action: 'clickRetort',
      icon: 'smile-o',
      title: 'retort.title',
      position: 'first'
    }
  })

  api.decorateWidget('post-menu:after', helper => {
    return helper.connect({ component: 'emoji-picker-wrapper' })
  })

  api.attachWidgetAction('post-menu', 'clickRetort', function() {
    let post = this.findAncestorModel()
    post.set('emojis', {
      active: !post.get('emojis.active'),
      limitOptions: siteSettings.retort_limited_emoji_set,
      onSelect: function(code) {
        post.set('emojis.active', false)
        return Retort.updateRetort(post, code)
      }
    })
  })
}

export default {
  name: 'retort-button',
  initialize: function() {
    withPluginApi('0.8.6', api => initializePlugin(api))
  }
}
