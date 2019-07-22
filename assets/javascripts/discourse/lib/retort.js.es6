import { ajax } from 'discourse/lib/ajax'
import { popupAjaxError } from "discourse/lib/ajax-error";

const disabledCategories = _.compact(_.invoke(Discourse.SiteSettings.retort_disabled_categories.split('|'), 'toLowerCase'))

export default Ember.Object.create({

  callback(data) {
    const post = this.postFor(data.id)
    if (!post) { return }

    post.setProperties({ retorts: data.retorts })
    this.get(`widgets.${data.id}`).scheduleRerender()
  },

  postFor(id) {
    const posts = this.get('topicController.model.postStream.posts')
    if (!posts) { return }

    return posts.find(p => p.id == id)
  },

  storeWidget(helper) {
    if (!this.get('widgets')) { this.set('widgets', {}) }
    this.set(`widgets.${helper.getModel().id}`, helper.widget)
  },

  updateRetort(postId, retort) {
    return ajax(`/retorts/${postId}.json`, {
      type: 'POST',
      data: { retort: retort }
    }).catch(popupAjaxError)
  },

  disabledFor(postId) {
    let post = this.postFor(postId)
    if (!post) { return true }

    let categoryName = _.toString(post.get('topic.category.name')).toLowerCase()
    return disabledCategories.includes(categoryName) || post.get('topic.archived')
  },

  openPicker(post) {
    this.set('picker.active', true)
    this.set('picker.postId', post.id)
  },

  setPicker(picker) {
    this.set('picker', picker)
    this.set('picker.onSelect', (retort) => {
      this.updateRetort(picker.postId, retort).then(() => {
        this.set('picker.active', false)
      })
    })
    this.set('picker.limitOptions', Discourse.SiteSettings.retort_limited_emoji_set)
  }
})
