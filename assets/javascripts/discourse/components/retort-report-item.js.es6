import Component from "@ember/component";
import discourseComputed from "discourse-common/utils/decorators";
import { bind } from "@ember/runloop";
import { gt } from "@ember/object/computed";

export default Component.extend({
  classNameBindings: [':retort-report-item', 'hasDetails'],
  hasDetails: gt('data.length', 0),
  showDetails: false,
  
  didInsertElement() {
    $(document).on('click', bind(this, this.documentClick));
  },

  willDestroyElement() {
    $(document).off('click', bind(this, this.documentClick));
  },

  documentClick(e) {
    if ($(e.target).closest(this.element).length < 1 && this._state !== 'destroying') {
      this.set('showDetails', false);
    }
  },
  
  @discourseComputed('data')
  list(data) {
    return data.map(d => {
      let item = '';
      Object.keys(d).map(k => {
        item += `<span>${k}: ${d[k]}</span>`;
      })
      return item;
    });
  },
  
  click() {
    if (this.hasDetails) {
      this.toggleProperty('showDetails');
    }
  }
})