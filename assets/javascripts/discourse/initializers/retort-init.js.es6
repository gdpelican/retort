import { withPluginApi } from 'discourse/lib/plugin-api'
import { showSelector } from "discourse/lib/emoji/emoji-toolbar"
import TopicRoute from 'discourse/routes/topic'
import Retort from '../lib/retort'

function initializePlugin(api) {

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

  if (!api._currentUser || !api.container.lookup('site-settings:main').retort_enabled) { return }

  api.addPostMenuButton('retort', attrs => {
    return {
      action: 'clickRetort',
      icon: 'smile-o',
      title: 'retort.title',
      position: 'first'
    }
  })

  api.attachWidgetAction('post-menu', 'clickRetort', function() {
    let post = this.findAncestorModel()
    showSelector({
      container: api.container,
      onSelect:  emoji => { Retort.updateRetort(post, emoji) }
    })
  })
}

export default {
  name: 'retort-button',
  initialize: function() {
    withPluginApi('0.1', api => initializePlugin(api))
  }
}
