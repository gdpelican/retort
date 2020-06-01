import { ajax } from 'discourse/lib/ajax'
import { popupAjaxError } from "discourse/lib/ajax-error";

export default Ember.Object.create({
  topic: { postStream: { posts: [] } },

  initialize(messageBus, topic) {
    if (this.topic.id) {
      messageBus.unsubscribe(`/retort/topics/${this.topic.id}`)
    }

    this.set('topic', topic)
    messageBus.subscribe(`/retort/topics/${this.topic.id}`, ({ id, retorts }) => {
      const post = this.postFor(id)
      if (!post) { return }

      post.setProperties({ retorts })
      this.get(`widgets.${id}`).scheduleRerender()
    })
  },

  postFor(id) {
    return (this.get('topic.postStream.posts') || []).find(p => p.id == id)
  },

  storeWidget(helper) {
    if (!this.get('widgets')) { this.set('widgets', {}) }
    this.set(`widgets.${helper.getModel().id}`, helper.widget)
  },

  updateRetort({ id }, retort) {
    return ajax(`/retorts/${id}.json`, {
      type: 'POST',
      data: { retort }
    }).catch(popupAjaxError)
  },
  
  disabledCategories() {
    return _.compact(_.invoke(Discourse.SiteSettings.retort_disabled_categories.split('|'), 'toLowerCase'));
  },

  disabledFor(postId) {
    const post = this.postFor(postId)
    if (!post) { return true }
    if (!post.topic.details.can_create_post) { return true }
    
    const disabledCategories = this.disabledCategories();
    let categoryName = _.toString(post.get('topic.category.name')).toLowerCase()
    return disabledCategories.includes(categoryName) || post.get('topic.archived')
  },

  openPicker(post) {
    this.set('picker.active', true)
    this.set('picker.post', post)
  },

  setPicker(picker) {
    this.set('picker', picker)
    this.set('picker.emojiSelected', retort => (
      this.updateRetort(picker.post, retort)).then(() => (
        picker.set('active', false)
      ))
    )
  }
})
