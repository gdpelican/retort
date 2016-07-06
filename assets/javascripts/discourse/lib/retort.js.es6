export default Ember.Object.create({

  callback(data) {
    let post       = this.postFor(data.post_id)
    let existing   = _.findIndex(post.retorts, r => { return r.emoji == data.emoji })

    if (existing == -1) {
      if (!post.retorts) { post.setProperties({ retorts: [] }) }
      post.retorts.addObject(data)
    } else if (data.usernames.length > 0) {
      post.retorts[existing] = data
    } else {
      post.retorts.splice(existing, 1)
    }

    post.setProperties({ retorts: post.retorts })
    this.get(`widgets.${post.id}`).scheduleRerender()
  },

  postFor(id) {
    return _.find(this.get('topicController.model.postStream.posts'), p => { return p.id == id })
  },

  storeWidget(helper) {
    if (!this.get('widgets')) { this.set('widgets', {}) }
    this.set(`widgets.${helper.getModel().id}`, helper.widget)
  },

  updateRetort(post, retort) {
    Discourse.ajax(`/retorts/${post.id}.json`, {
      type: 'POST',
      data: { retort: retort }
    })
  }
})
