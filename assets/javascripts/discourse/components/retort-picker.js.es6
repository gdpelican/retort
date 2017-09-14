import EmojiPicker from 'discourse/components/emoji-picker'
import { emojiUrlFor } from 'discourse/lib/text'

const siteSettings = Discourse.SiteSettings

export default EmojiPicker.extend({
  show() {
    this.didInsertElement();
    this._super();
  },

  close() {
    this._super();
    this.willDestroyElement();
  },
  
  _scrollTo() {
    if (siteSettings.retort_limited_emoji_set) {
      return
    } else {
      this._super()
    }
  },

  _loadCategoriesEmojis() {
    if (siteSettings.retort_limited_emoji_set) {
      const $picker = this.$('.emoji-picker')
      $picker.html("")
      siteSettings.retort_allowed_emojis.split('|').map((code) => {
        $picker.append(`<button type="button" title="${code}" class="emoji" />`)
        this.$(`button.emoji[title="${code}"]`).css("background-image", `url("${emojiUrlFor(code)}")`)
      })
      this._bindEmojiClick($picker);
    } else {
      this._super()
    }
  }
})
