import { withPluginApi } from 'discourse/lib/plugin-api'
import TopicRoute from 'discourse/routes/topic'
import { default as Retort, applyTextEmojiClass } from '../lib/retort'
import { registerEmoji } from 'pretty-text/emoji'
import { emojiUrlFor } from 'discourse/lib/text'
import { on } from 'ember-addons/ember-computed-decorators';

function initializePlugin(api) {

  const siteSettings = api.container.lookup('site-settings:main')

  TopicRoute.on("setupTopicController", function(event) {
    let controller = event.controller
    Retort.set('topicController', controller)
    controller.messageBus.subscribe(`/retort/topics/${controller.model.id}`, (data) => { Retort.callback(data) })
  })

  api.decorateWidget('post-contents:after-cooked', helper => {
    let postId = helper.getModel().id
    let post   = Retort.postFor(postId)

    if (Retort.disabledFor(postId)) { return }

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
    if (Retort.disabledFor(attrs.id)) { return }
    return {
      action: 'clickRetort',
      icon: 'smile-o',
      title: 'retort.title',
      position: 'first'
    }
  })

  api.attachWidgetAction('post-menu', 'clickRetort', function() {
    Retort.openPicker(this.findAncestorModel())
  });

  api.modifyClass('component:emoji-picker', {
    @on("didUpdateAttrs")
    hideTextEmojis() {
      if (this.get("active")) {
        applyTextEmojiClass();
      }
    }
  });

  api.decorateCooked($elem => {
    applyTextEmojiClass();
  });
}

export default {
  name: 'retort-button',
  initialize: function() {
    withPluginApi('0.8.6', api => initializePlugin(api))
  }
}
