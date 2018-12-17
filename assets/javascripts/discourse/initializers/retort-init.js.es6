import { withPluginApi } from 'discourse/lib/plugin-api'
import TopicRoute from 'discourse/routes/topic'
import Retort from '../lib/retort'
import { registerEmoji } from 'pretty-text/emoji'
import { emojiUrlFor } from 'discourse/lib/text'
import { ajax } from 'discourse/lib/ajax';
import { avatarAtts } from "discourse/widgets/actions-summary";

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
      let { usernames, emoji } = retort;
      let contents = [];

      if (siteSettings.retort_standard_count && usernames.length > 0) {
        contents.push(helper.attach('retort-count', {
          emoji,
          count: usernames.length
        }));
      }

      contents.push(
        helper.attach('retort-toggle', {
          post:           post,
          usernames:      usernames,
          emoji:          retort.emoji
        })
      )

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

  api.reopenWidget('post-menu', {
    toggleWhoLiked() {
      this.sendWidgetAction('clearWhoRetorted');
      return this._super();
    },

    retortName(retort) {
      let fragments = retort.split('_');

      let namespaceIndex = fragments.indexOf('retort');
      if (namespaceIndex !== -1) fragments.splice(namespaceIndex, 1);

      fragments = fragments.map(frag => {
        return frag.charAt(0).toUpperCase() + frag.slice(1);
      });

      return fragments.join(' ');
    },

    html(attrs, state) {
      if (attrs.showingRetortsFor) {
        state.likedUsers = [];
      }

      let contents = this._super(attrs, state);

      if (attrs.showingRetortsFor) {
        contents.push(
          this.attach("small-user-list", {
            users: attrs.retortedUsers,
            addSelf: false,
            listClassName: "who-retorted",
            description: "post.actions.people.retort",
            count: this.retortName(attrs.showingRetortsFor)
          })
        );
      }

      return contents;
    }
  });

  api.reopenWidget('post', {
    toggleWhoRetorted(retort) {
      if (this.state.showingRetortsFor == retort) {
        this.state.retortedUsers = [];
        this.state.showingRetortsFor = null;
      } else {
        this.getWhoRetorted(retort);
      }
      this.scheduleRerender();
    },

    getWhoRetorted(retort) {
      const { attrs, state } = this;

      return ajax(`/retorts/${attrs.id}/users`, {
        data: {
          retort
        }
      }).then(users => {
        if (users && users.length) {
          state.retortedUsers = users.map(avatarAtts);
          state.showingRetortsFor = retort;
          this.scheduleRerender();
        }
      });
    },

    clearWhoRetorted() {
      this.state.retortedUsers = [];
      this.state.showingRetortsFor = null;
      this.scheduleRerender();
    },

    html(attrs, state) {
      if (state.showingRetortsFor) {
        attrs['showingRetortsFor'] = state.showingRetortsFor;
        attrs['retortedUsers'] = state.retortedUsers;
      }
      return this._super(attrs, state);
    },
  });
}

export default {
  name: 'retort-button',
  initialize: function() {
    withPluginApi('0.8.6', api => initializePlugin(api))
  }
}
