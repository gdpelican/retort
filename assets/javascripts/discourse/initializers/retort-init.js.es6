import { withPluginApi } from 'discourse/lib/plugin-api'
import { showSelector } from "discourse/lib/emoji/toolbar"
import TopicRoute from 'discourse/routes/topic'
import Retort from '../lib/retort'
import groups from 'discourse/lib/emoji/groups'

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

  if (!api._currentUser || !siteSettings.retort_enabled) { return }

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
      page:       siteSettings.retort_limited_emoji_set ? 'retort' : null,
      modalClass: siteSettings.retort_limited_emoji_set ? 'retort-selector' : null,
      perRow:     siteSettings.retort_limited_emoji_set ? parseInt(siteSettings.retort_emojis_per_row) : null,
      container:  api.container,
      onSelect:   emoji => { Retort.updateRetort(post, emoji) }
    })
  })

  if (siteSettings.retort_limited_emoji_set) {
    groups.push({
      name: 'retort',
      fullName: 'Retorts',
      tabicon: 'smiley',
      icons: siteSettings.retort_allowed_emojis.split('|')
    })
  }
}

export default {
  name: 'retort-button',
  initialize: function() {
    withPluginApi('0.1', api => initializePlugin(api))
  }
}
