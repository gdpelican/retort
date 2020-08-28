import { withPluginApi } from 'discourse/lib/plugin-api'
import { emojiUrlFor } from 'discourse/lib/text'
import { schedule } from '@ember/runloop'
import computed from 'discourse-common/utils/decorators'
import { action } from "@ember/object";
import TopicRoute from 'discourse/routes/topic'
import Retort from '../lib/retort'
import User from 'discourse/models/user'

function initializePlugin(api) {
  const {
    retort_enabled,
    retort_allowed_emojis,
    retort_limited_emoji_set
  } = api.container.lookup('site-settings:main')
  const messageBus = api.container.lookup('message-bus:main')

  api.decorateWidget('post-contents:after-cooked', helper => {
    let postId = helper.getModel().id
    let post   = Retort.postFor(postId)

    if (Retort.disabledFor(postId)) { return }

    Retort.storeWidget(helper)

    return _.map(post.retorts, ({ usernames, emoji }) => {
      return helper.attach('retort-toggle', { post, usernames, emoji })
    })
  })

  if (!User.current() || !retort_enabled) { return }

  api.modifyClass('route:topic', {
    setupController(controller, model) {
      Retort.initialize(messageBus, model)

      this._super(controller, model)
    }
  })

  api.addPostMenuButton('retort', attrs => {
    if (Retort.disabledFor(attrs.id)) { return }
    return {
      action: 'clickRetort',
      icon: 'far-smile',
      title: 'retort.title',
      position: 'first'
    }
  })

  api.attachWidgetAction('post-menu', 'clickRetort', function() {
    Retort.openPicker(this.findAncestorModel())
  })

  api.modifyClass('component:emoji-picker', {
    classNameBindings: [
      'retort:emoji-picker--retort',
      'limited:emoji-picker--retort-limited',
      'activeRetort:emoji-picker--retort-active'
    ],
    
    didReceiveAttrs() {
      this._super(...arguments);
      if (this.retort) {
        this.set('tagName', 'div');
      }
    },

    @computed('retort')
    limited() {
      return this.retort && retort_limited_emoji_set
    },

    @computed('retort', 'isActive')
    activeRetort() {
      return this.retort && this.isActive
    },

    @action
    onShow() {
      if (this.limited) {
        const emojis = retort_allowed_emojis.split('|')
        const basis = (100 / this._emojisPerRow[emojis.length] || 5)

        schedule('afterRender', this, () => {
          $('.emoji-picker').html(`
            <div class='limited-emoji-set'>
              ${emojis.map(code => `<img
                src="${emojiUrlFor(code)}"
                width=20
                height=20
                title='${code}'
                class='emoji' />`).join('')}
            </div>
          `)
          $('.emoji-picker--retort').on('click', (e) => {
            if ($(e.target).hasClass('emoji')) {
              this.onEmojiSelection(e);
            } else {
              this.set('isActive', false);
              this.onClose();
            }
          });
        });
      }
      
      this._super();
    },

    _emojisPerRow: {
      0: 1,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 3,
      7: 3,
      8: 4,
      9: 3,
      10: 5,
      11: 5,
      12: 4,
      13: 5,
      14: 7,
      15: 5,
      16: 4,
      17: 5,
      18: 6,
      19: 6,
      20: 5,
      21: 7,
      22: 5,
      23: 5,
      24: 6
    }
  })
}

export default {
  name: 'retort-button',
  initialize: function() {
    withPluginApi('0.8.6', api => initializePlugin(api))
  }
}
