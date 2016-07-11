import ajax from 'discourse/lib/ajax'

export default Ember.Object.create({

  callback(data) {
    this.postFor(data.id).setProperties({ retorts: data.retorts })
    this.get(`widgets.${data.id}`).scheduleRerender()
  },

  postFor(id) {
    return _.find(this.get('topicController.model.postStream.posts'), p => { return p.id == id })
  },

  storeWidget(helper) {
    if (!this.get('widgets')) { this.set('widgets', {}) }
    this.set(`widgets.${helper.getModel().id}`, helper.widget)
  },

  updateRetort(post, retort) {
    ajax(`/retorts/${post.id}.json`, {
      type: 'POST',
      data: { retort: retort }
    })
  }
})
