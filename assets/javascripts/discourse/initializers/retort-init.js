import Component from "@glimmer/component";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { schedule, later } from "@ember/runloop";
import { emojiSearch } from "pretty-text/emoji";
import { withPluginApi } from "discourse/lib/plugin-api";
import { emojiUrlFor } from "discourse/lib/text";
import { createPopper } from "@popperjs/core";

const PLUGIN_ID = "retort";

class EmojiPickerComponent extends Component {
  @service retort;

  @computed("forRetort")
  get limited() {
    return this.forRetort && this.retort.siteSettings.retort_limited_emoji_set;
  }

  @computed("isActive")
  get activeRetort() {
    return this.forRetort && this.isActive;
  }

  @action
  onShowRetort() {
    if (!this.limited) {
      this.set("isLoading", true);
    }

    schedule("afterRender", () => {
      document.addEventListener("click", this.handleOutsideClick);

      const post = this.post;
      const emojiPicker = document.querySelector(".emoji-picker");
      const retortButton = document.querySelector(
        `article[data-post-id="${post.id}"] .post-controls .retort`,
      );

      if (!emojiPicker || !retortButton) {
        return false;
      }

      if (!this.site.isMobileDevice) {
        this._popper = createPopper(retortButton, emojiPicker, {
          placement: this.limited ? "top" : "bottom",
        });
      }

      if (this.limited) {
        const emojis =
          this.retort.siteSettings.retort_allowed_emojis.split("|");

        emojiPicker.innerHTML = `
          <div class='limited-emoji-set'>
            ${emojis
              .map(
                (code) => `
                <img
                  src="${emojiUrlFor(code)}"
                  width=40
                  height=40
                  title='${code}'
                  class='emoji' />`,
              )
              .join("")}
          </div>
        `;

        emojiPicker.classList.add("has-limited-set");

        emojiPicker.onclick = (e) => {
          if (e.target.classList.contains("emoji")) {
            this.emojiSelected(e.target.title);
          } else {
            this.set("isActive", false);
            this.onClose();
          }
        };
      } else {
        emojiPicker
          .querySelectorAll(".emojis-container .section .section-header")
          .forEach((p) => this._sectionObserver.observe(p));

        later(() => {
          this.set("isLoading", false);
          this.applyDiscourseTrick(emojiPicker);
        }, 50);
      }
    });
  }

  applyDiscourseTrick(emojiPicker) {
    schedule("afterRender", () => {
      if (!this.site.isMobileDevice || this.isEditorFocused) {
        const filter = emojiPicker.querySelector("input.filter");
        filter && filter.focus();
      }

      if (this.selectedDiversity !== 0) {
        this._applyDiversity(this.selectedDiversity);
      }
    });
  }

  @action
  onCategorySelection(sectionName) {
    const section = document.querySelector(
      `.emoji-picker-emoji-area .section[data-section="${sectionName}"]`,
    );
    section &&
      section.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
  }

  @action
  onFilter(event) {
    const emojiPickerArea = document.querySelector(".emoji-picker-emoji-area");
    const emojisContainer = emojiPickerArea.querySelector(".emojis-container");
    const results = emojiPickerArea.querySelector(".results");
    results.innerHTML = "";

    if (event.target.value) {
      results.innerHTML = emojiSearch(event.target.value.toLowerCase(), {
        maxResults: 10,
        diversity: this.retort.emojiStore.diversity,
      })
        .map(this._replaceEmoji)
        .join("");

      emojisContainer.style.visibility = "hidden";
      results.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    } else {
      emojisContainer.style.visibility = "visible";
    }
  }
}

function initializePlugin(api) {
  const { retort_enabled } = api.container.lookup("site-settings:main");

  if (!retort_enabled) {
    return;
  }

  api.modifyClass("component:emoji-picker", EmojiPickerComponent);

  api.registerValueTransformer(
    "post-menu-buttons",
    ({ value: dag, context }) => {
      const postId = context.post.id;
      const retort = api.container.lookup("service:retort");

      if (!retort.disabledFor(postId)) {
        dag.add("retort", EmojiPickerComponent, {
          post: context.post,
          onClick: () => {
            retort.openPicker(context.post);
          },
        });
      }
    },
  );
}

export default {
  name: "retort",
  initialize(container) {
    withPluginApi("1.0.0", initializePlugin);
  },
};
