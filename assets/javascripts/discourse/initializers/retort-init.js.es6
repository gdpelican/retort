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
    let postId = helper.getModel().id
    let post   = Retort.postFor(postId)

    if (Retort.disabledFor(postId)) { return }

    Retort.storeWidget(helper);

    const alternateCount = siteSettings.retort_alternate_count;

    return _.map(post.retorts, (retort) => {
      let usernames = retort.usernames;
      let contents = [helper.attach('retort-toggle', {
        post:           post,
        usernames:      usernames,
        emoji:          retort.emoji,
        alternateCount: alternateCount
      })];

      if (alternateCount && usernames.length > 0) {
        contents.push(helper.attach('retort-count', {
          emoji: retort.emoji,
          count: usernames.length
        }));
      }

      return contents;
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
  });

  api.attachWidgetAction('post-menu', 'clickRetort', function() {
    Retort.openPicker(this.findAncestorModel())
  });

  api.attachWidgetAction('post-menu', 'toggleWhoRetorted', function() {
    const state = this.state;
    if (state.retortedUsers.length) {
      state.retortedUsers = [];
    } else {
      return this.getWhoRetorted();
    }
  });

  api.attachWidgetAction('post-menu', 'getWhoRetorted', function() {
    const { attrs, state } = this;

    return ajax(`/${attrs.id}/users`)
      .then(users => {
        state.retortedUsers = users;
        state.total = users.length;
      });
  });

  api.reopenWidget('post-menu', {
    defaultState() {
      let state = this._super();
      state['retortedUsers'] = [];
      return state;
    },

    html(attrs, state) {
      let contents = this._super(attrs, state);

      if (state.retortedUsers.length) {
        contents.push(
          this.attach("small-user-list", {
            users: state.retortedUsers,
            addSelf: attrs.liked && remaining === 0,
            listClassName: "who-liked",
            description:
              remaining > 0
                ? "post.actions.people.like_capped"
                : "post.actions.people.like",
          })
        );
      }

      return contents;
    }
  })
}

export default {
  name: 'retort-button',
  initialize: function() {
    withPluginApi('0.8.6', api => initializePlugin(api))
  }
}
