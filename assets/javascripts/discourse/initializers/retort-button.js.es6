import PostMenuComponent from 'discourse/components/post-menu';
import { Button } from 'discourse/components/post-menu';
import { default as computed, observes } from 'ember-addons/ember-computed-decorators';
import { popupAjaxError } from 'discourse/lib/ajax-error';
import { showSelector } from "discourse/lib/emoji/emoji-toolbar";

export default {
  name: 'retort-button',
  initialize: function() {
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
}
