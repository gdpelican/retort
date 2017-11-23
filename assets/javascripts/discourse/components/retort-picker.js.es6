import EmojiPicker from 'discourse/components/emoji-picker'
import { emojiUrlFor } from 'discourse/lib/text'

const siteSettings = Discourse.SiteSettings

export default EmojiPicker.extend({
  _scrollTo(y) {
    if (siteSettings.retort_limited_emoji_set) {
      return
    } else {
      this._super(y)
    }
  },

  _unbindRetort() {
    this.set('active', false)
    this.close()
  },

  _bindEvents() {
    this.$(document).on('keydown.retort-escape', (e) => {
      if (e.target == 27)                                { this._unbindRetort() }
    })
    this.$(document).on('click.retort-click-outside', (e) => {
      if (!$(e.target).closest('.retort-picker').length) { this._unbindRetort() }
    })
    return this._super()
  },

  _unbindEvents() {
    this.$(document).off('click.retort-click-outside')
    this.$(document).off('click.retort-escape')
    return this._super()
  },

  _loadCategoriesEmojis() {
    if (siteSettings.retort_limited_emoji_set) {
      const $picker = this.$('.emoji-picker')
      const basis   = this._flexBasis()
      $picker.html("")
      this._allowedEmojis().map((code) => {
        $picker.append(`<button type="button" title="${code}" class="emoji" />`)
        this.$(`button.emoji[title="${code}"]`).css("background-image", `url("${emojiUrlFor(code)}")`)
                                               .css("flex-basis", `${basis}%`)
      })
      this._bindEmojiClick($picker);
    } else {
      this._super()
    }
  },

  _allowedEmojis() {
    return siteSettings.retort_allowed_emojis.split('|')
  },

  _flexBasis() {
    return (100 / this._emojisPerRow[this._allowedEmojis().length] || 5)
  },

  _emojisPerRow: {
    0: 1,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 3,
    7: 3,
    8: 4,
    9: 3,
    10: 5,
    11: 5,
    12: 4,
    13: 5,
    14: 7,
    15: 5,
    16: 4,
    17: 5,
    18: 6,
    19: 6,
    20: 5,
    21: 7,
    22: 5,
    23: 5,
    24: 6
  }
})
