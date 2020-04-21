import { ajax } from 'discourse/lib/ajax'
import { popupAjaxError } from "discourse/lib/ajax-error";

const disabledCategories = _.compact(_.invoke(Discourse.SiteSettings.retort_disabled_categories.split('|'), 'toLowerCase'))

export default Ember.Object.create({
  callback({ id, retorts }) {
    const post = this.postFor(id)
    if (!post) { return }

    post.setProperties({ retorts })
    this.get(`widgets.${id}`).scheduleRerender()
  },

  postFor(id) {
    const posts = this.get('topicController.model.postStream.posts') || []
    return posts.find(p => p.id == id)
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

  disabledFor(postId) {
    const post = this.postFor(postId)
    if (!post) { return true }
    if (!post.topic.details.can_create_post) { return true }

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
