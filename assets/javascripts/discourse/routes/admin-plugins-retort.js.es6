import DiscourseRoute from "discourse/routes/discourse";
import { ajax } from 'discourse/lib/ajax';
import { A } from "@ember/array";

export default DiscourseRoute.extend({
  model() {
    return ajax('/retorts/migrate');
  },
  
  setupController(controller, model) {
    if (model.migrations) {
      controller.set('migrations', A(model.migrations));
    }
    controller.subscribe();
  },

  deactivate() {
    this._super(...arguments);
    this.controllerFor('admin-plugins-retort').unsubscribe();
  }
});