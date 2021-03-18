import Controller from "@ember/controller";
import { ajax } from 'discourse/lib/ajax';
import bootbox from "bootbox";
import { A } from "@ember/array";
import { notEmpty } from "@ember/object/computed"

export default Controller.extend({
  realRun: false,
  deleteRetorts: false,
  started: false,
  migrations: A(),
  hasMigrations: notEmpty('migrations'),

  subscribe(channel) {
    this.messageBus.subscribe("/retort/migrate", (data) => {
      if (data.error) {
        this.setMessage(data.error, 'error');
      } else if (data.success) {
        this.get('migrations').unshiftObject(data);
      }    
    });
  },

  unsubscribe() {
    this.messageBus.unsubscribe("/retort/migrate");
  },
  
  setMessage(text, type) {
    this.set('message', { text, type });
    setTimeout(() => { this.set('message', null) }, 10000);
  },
  
  startMigration(data) {
    ajax('/retorts/migrate', {
      type: 'POST',
      data
    }).then(() => {
      this.setMessage(I18n.t('admin.retort.migrate.started'), 'success');
    });
  },
  
  actions: {
    migrate() {
      const deleteRetorts = this.deleteRetorts;
      const realRun = this.realRun;
      
      const data = {
        real_run: realRun,
        delete_retorts: deleteRetorts
      }
      
      if (deleteRetorts) {
        bootbox.confirm(
          I18n.t("admin.retort.migrate.confirm_delete"),
          I18n.t("no_value"),
          I18n.t("yes_value"),
          (confirmed) =>
            confirmed
              ? this.startMigration(data)
              : this.send("closeModal")
        );
      } else {
        this.startMigration(data);
      }
    }
  }
});