import { tracked } from "@glimmer/tracking";
import { getOwner } from "@ember/application";
import Service, { inject as service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default class RetortService extends Service {
  @service siteSettings;
  @service messageBus;
  @service router;
  @tracked picker;
  @tracked model;
  @tracked widgets;

  init() {
    super.init(...arguments);
  }

  initBus() {
    if (this.model.id) {
      this.messageBus.unsubscribe(`/retort/topics/${this.model.id}`);
    }

    this.messageBus.subscribe(
      `/retort/topics/${this.model.id}`,
      ({ id, retorts }) => {
        const post = this.postFor(id);
        if (!post) {
          return;
        }

        post.setProperties({ retorts });
        this.get(`widgets.${id}`).scheduleRerender();
      }
    );
  }

  postFor(id) {
    return (this.model.postStream.posts || []).find((p) => p.id === id);
  }

  storeWidget(helper) {
    if (!this.widgets) {
      this.widgets = {};
    }
    this.set(`widgets.${helper.getModel().id}`, helper.widget);
  }

  updateRetort({ id }, retort) {
    return ajax(`/retorts/${id}.json`, {
      type: "POST",
      data: { retort },
    }).catch(popupAjaxError);
  }

  disabledCategories() {
    const categories = this.siteSettings.retort_disabled_categories.split("|");
    return categories.map((cat) => cat.toLowerCase()).filter(Boolean);
  }

  disabledFor(postId) {
    const post = this.postFor(postId);
    if (!post) {
      return true;
    }
    if (!post.topic.details.can_create_post) {
      return true;
    }
    if (post.topic.archived) {
      return true;
    }
    if (!post.topic.category) {
      return false;
    } else {
      const categoryName = post.topic.category.name;
      const disabledCategories = this.disabledCategories();
      return (
        categoryName &&
        disabledCategories.includes(categoryName.toString().toLowerCase())
      );
    }
  }

  openPicker(post) {
    this.controller = getOwner(this).lookup("controller:topic");

    this.set("picker.isActive", true);
    this.set("picker.post", post);
    this.set("controller.renderRetortPicker", true);
  }

  setPicker(picker) {
    this.set("picker", picker);

    this.picker.emojiSelected = (retort) => {
      this.updateRetort(this.picker.post, retort).then(() => {
        this.set("picker.isActive", false);
      });
    };
  }
}
