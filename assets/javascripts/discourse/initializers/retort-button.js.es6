import { withPluginApi } from 'discourse/lib/plugin-api';
import PostMenuComponent from 'discourse/components/post-menu';
import { Button } from 'discourse/components/post-menu';
import { showSelector } from "discourse/lib/emoji/emoji-toolbar";
import TopicRoute from 'discourse/routes/topic';

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

  const container    = api.container
  const siteSettings = container.lookup('site-settings:main');

  TopicRoute.on("setupTopicController", function(event) {
    const controller = event.controller
    controller.messageBus.subscribe('/retort/topics/' + controller.model.id, function(retort) {
      var post = _.find(controller.get('postsToRender.posts'), function(p) { return p.id == retort.post_id })
      var existing = _.findIndex(post.retorts, function(r) { return r.retort == retort.retort })

      if (existing >= 0) {
        post.retorts[existing] = retort
      } else {
        post.retorts.addObject(retort)
      }
      post.setProperties({ retorts: post.retorts })
    })
  })

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
      if (item.usernames.length > 1) {
        html +=   `<span class="post-retort-count">${item.usernames.length}</span>`
      }
      html +=   `<span class="post-retort-tooltip">${sentenceFor(item)}</span>`;
      html += '</div>';
    });

    html += '</div>';
    return dec.rawHtml(html);
  })

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
    showSelector({
      container: container,
      onSelect: function(retort) {
        Discourse.ajax('/retorts/' + post.id + '.json', {
          type: 'POST',
          data: { retort: retort }
        })
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
