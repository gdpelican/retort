import isElementScrolledToBottom from "../lib/is-element-scrolled-to-bottom"
import lastVisiblePostInScrollableDiv from "../lib/last-visible-post-in-scrollable-div"
import debounce from 'discourse/lib/debounce'
import { observes } from 'ember-addons/ember-computed-decorators'

export default Ember.Component.extend({
  retorts: function() {
    return _.where(Discourse.Retort.retorts, { post_id: this.get('post.id') })
  }.property('Discourse.Retort.retorts')
});
