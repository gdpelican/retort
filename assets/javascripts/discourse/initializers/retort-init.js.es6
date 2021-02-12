import { withPluginApi } from 'discourse/lib/plugin-api'
import { emojiUrlFor } from 'discourse/lib/text'
import { schedule, later } from '@ember/runloop'
import { default as computed, observes } from 'discourse-common/utils/decorators'
import { action } from "@ember/object";
import { createPopper } from "@popperjs/core";
import { safariHacksDisabled } from "discourse/lib/utilities";
import { emojiSearch } from "pretty-text/emoji";
import TopicRoute from 'discourse/routes/topic'
import Retort from '../lib/retort'
import User from 'discourse/models/user'

function initializePlugin(api) {
  const {
    retort_enabled,
    retort_allowed_emojis,
    retort_limited_emoji_set
  } = api.container.lookup('site-settings:main')
  const messageBus = api.container.lookup('message-bus:main')

  api.decorateWidget('post-contents:after-cooked', helper => {
    let postId = helper.getModel().id
    let post   = Retort.postFor(postId)

    if (Retort.disabledFor(postId)) { return }

    Retort.storeWidget(helper)
    
    if (!post.retorts) { return }

    return post.retorts.map(({usernames, emoji}) => {
      return helper.attach('retort-toggle', { post, usernames, emoji });
    });
  })

  if (!User.current() || !retort_enabled) { return }

  api.modifyClass('route:topic', {
    setupController(controller, model) {
      Retort.initialize(messageBus, model)

      this._super(controller, model)
    }
  })

  api.addPostMenuButton('retort', attrs => {
    if (Retort.disabledFor(attrs.id)) { return }
    return {
      action: 'clickRetort',
      icon: 'far-smile',
      title: 'retort.title',
      position: 'first',
      className: 'retort'
    }
  })

  api.attachWidgetAction('post-menu', 'clickRetort', function() {
    Retort.openPicker(this.findAncestorModel())
  })

  api.modifyClass('component:emoji-picker', {
    
    @computed('retort')
    limited() {
      return this.retort && retort_limited_emoji_set
    },

    @computed('retort', 'isActive')
    activeRetort() {
      return this.retort && this.isActive
    },
    
    @observes("isActive")
    _setup() {
      if (this.retort) {
        this._setupRetort();
      } else {
        this._super();
      }
    },
    
    _setupRetort() {
      if (this.isActive) {
        this.onShowRetort();
      } else {
        this.onClose();
      }
    },
    
    // See onShow in emoj-picker for logic pattern
    @action
    onShowRetort() {
      if (!this.limited) {
        this.set("isLoading", true);
      }
    
      schedule("afterRender", () => {
        document.addEventListener("click", this.handleOutsideClick);
        
        const post = this.post;
        const emojiPicker = document.querySelector(".emoji-picker");
        const retortButton = document.querySelector(`
          article[data-post-id="${post.id}"] .post-controls .retort`
        );
                
        if (!emojiPicker || !retortButton) return false;

        if (!this.site.isMobileDevice) {
          this._popper = createPopper(
            retortButton,
            emojiPicker,
            {
              placement: this.limited ? "top" : "bottom"
            }
          );
        }
        
        if (this.limited) {
          const emojis = retort_allowed_emojis.split('|')
          const basis = (100 / this._emojisPerRow[emojis.length] || 5)

          emojiPicker.innerHTML = `
            <div class='limited-emoji-set'>
              ${emojis.map(code => `<img
                src="${emojiUrlFor(code)}"
                width=40
                height=40
                title='${code}'
                class='emoji' />`).join('')}
            </div>
          `;
          
          emojiPicker.classList.add("has-limited-set");
          
          emojiPicker.onclick = (e) => {
            if (e.target.classList.contains("emoji")) {
              this.emojiSelected(e.target.title);
            } else {
              this.set('isActive', false);
              this.onClose();
            }
          };
        } else {
          emojiPicker
            .querySelectorAll(".emojis-container .section .section-header")
            .forEach(p => this._sectionObserver.observe(p));

          later(() => {
            this.set("isLoading", false);
            this.applyDiscourseTrick(emojiPicker);
          }, 50);
        }      
      });
    },
    
    // Lifted from onShow in emoji-picker. See note in that function concerning its utility.
    applyDiscourseTrick(emojiPicker) {
      schedule("afterRender", () => {
        if (
          (!this.site.isMobileDevice || this.isEditorFocused) &&
          !safariHacksDisabled()
        ) {
          const filter = emojiPicker.querySelector("input.filter");
          filter && filter.focus();
        }

        if (this.selectedDiversity !== 0) {
          this._applyDiversity(this.selectedDiversity);
        }
      });
    },
    
    @action
    onCategorySelection(sectionName) {
      const section = document.querySelector(
        `.emoji-picker-emoji-area .section[data-section="${sectionName}"]`
      );
      section && section.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    },
    
    @action
    onFilter(event) {
      const emojiPickerArea = document.querySelector(".emoji-picker-emoji-area");
      const emojisContainer = emojiPickerArea.querySelector(".emojis-container");
      const results = emojiPickerArea.querySelector(".results");
      results.innerHTML = "";

      if (event.target.value) {
        results.innerHTML = emojiSearch(event.target.value.toLowerCase(), {
          maxResults: 10,
          diversity: this.emojiStore.diversity,
        })
          .map(this._replaceEmoji)
          .join("");

        emojisContainer.style.visibility = "hidden";
        results.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      } else {
        emojisContainer.style.visibility = "visible";
      }
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
}

export default {
  name: 'retort-button',
  initialize: function() {
    withPluginApi('0.8.6', api => initializePlugin(api))
  }
}
