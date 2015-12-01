export default Ember.Component.extend({
  retorts: function() {
    return _.where(Discourse.Retort.retorts, { post_id: this.get('post.id') })
  }.property('Discourse.Retort.retorts')
});
