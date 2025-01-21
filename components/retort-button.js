import Component from "@glimmer/component";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";

export default class RetortButtonComponent extends Component {
  @service retort; // Inject the retort service

  get isDisabled() {
    return this.retort.disabledFor(this.args.post.id);
  }

  @action
  handleClick() {
    if (!this.isDisabled && this.args.onClick) {
      this.args.onClick(); // Call the passed onClick action
    }
  }
}
