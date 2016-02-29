import { withPluginApi } from 'discourse/lib/plugin-api';
import PostMenuComponent from 'discourse/components/post-menu';
import { Button } from 'discourse/components/post-menu';
import { default as computed, observes } from 'ember-addons/ember-computed-decorators';
import { showSelector } from "discourse/lib/emoji/emoji-toolbar";

function priorToApi(container)
{
  PostMenuComponent.registerButton(function(visibleButtons) {
    if (!Discourse.User.current() || !this.siteSettings.retort_enabled) { return }
    return visibleButtons.splice(0, 0, new Button('retort', 'retort.title', 'smile-o'))
  })

  PostMenuComponent.reopen({
    clickRetort: function(post) {
      const self = this
      showSelector({
        container: self.container,
        onSelect: function(retort) {
          Discourse.ajax('/retorts/' + self.get('post.id') + '.json', {
            type: 'POST',
            data: { retort: retort }
          })
          return false
        }
      })
    }
  })
}

function initializePlugin(api)
{
  api.includePostAttributes('retorts');

  api.decorateWidget('post-contents:after-cooked', dec => {
    const post = dec.getModel();
    if (post.retorts.length === 0) { return; }

    var sentenceFor = function(retort) {
      switch(retort.usernames.length) {
        case 1:  return `${retort.usernames[0]} reacted with :${retort.retort}:`
        case 2:  return `${retort.usernames[0]} and ${retort.usernames[1]} reacted with :${retort.retort}:`
        default: return `${retort.usernames[0]}, ${retort.usernames[1]}, and ${retort.usernames.length - 2} others reacted with :${retort.retort}:`
      }
    }
    var urlFor = Discourse.Emoji.urlFor

    var html = '<div class="post-retorts">';

    post.retorts.forEach(function (item) {
      html += '<div class="post-retort">';
      html +=   `<img src="${urlFor(item.retort)}" class="emoji" alt=":${item.retort}:">`;
      html +=   `<span class="post-retort-tooltip">${sentenceFor(item)}</span>`;
      html += '</div>';
    });

    html += '</div>';
    return dec.rawHtml(html);
  })

  const siteSettings = api.container.lookup('site-settings:main');
  if (!api._currentUser || !siteSettings.retort_enabled) { return; }

  api.addPostMenuButton('retort', attrs => {
    return {
      action: 'clickRetort',
      icon: 'smile-o',
      title: 'retort.title',
      position: 'first'
    };
  });

  api.attachWidgetAction('post-menu', 'clickRetort', function() {
    const post = this.findAncestorModel();
    const self = this;
    showSelector({
      container: self.container,
      onSelect: function(retort) {
        Discourse.ajax('/retorts/' + post.id + '.json', {
          type: 'POST',
          data: { retort: retort }
        })

        var thisRetort = post.retorts[retort] || {
          retort: retort,
          post_id: post.id,
          topic_id: topic.id,
          usernames: []
        }
        var index = $.inArray(thisRetort, self.currentUser.username)
        if (index > -1) {
          thisRetort.usernames.splice(index)
        } else {
          thisRetort.usernames.push(self.currentUser.username)
        }

        post.retorts[retort] = thisRetort
        post.setProperties({ retorts: post.retorts });
        self.scheduleRerender();
        return false
      },

      buildRetort: function(post, retort) {
        return {
          retort: retort,
          post_id: post.id,
          topic_id: post.topic_id,
          usernames: []
        }
      }
    })
  });
}

export default {
  name: 'retort-button',
  initialize: function() {
    withPluginApi('0.1', api => initializePlugin(api), { noApi: () => priorToApi() });
  }
}
