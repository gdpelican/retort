import { getOwner } from "@ember/application";

export default {
  setupComponent(args, component) {
    const retort = getOwner(this).lookup("service:retort");
    retort.setPicker(component);

    const controller = getOwner(this).lookup("controller:topic");
    controller.set("renderRetortPicker", false);

    component.set("renderRetortPicker", controller.get("renderRetortPicker"));

    controller.addObserver("renderRetortPicker", () => {
      if (this._state === "destroying") {
        return;
      }
      component.set("renderRetortPicker", controller.get("renderRetortPicker"));
    });
  },
};
