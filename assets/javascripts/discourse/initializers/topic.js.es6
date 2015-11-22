import Topic from 'discourse/controllers/topic';
import TopicRoute from 'discourse/routes/topic';
import { default as computed, observes } from 'ember-addons/ember-computed-decorators';

export default {
  name: 'retort-topic',
  initialize: function() {
    Discourse.Retort = { retorts: {} }
    var refreshRetorts = function(retorts, id) {
      id = id || parseInt(_.last(this.channel.split('/'))) // sorry mom.
      Ember.set(Discourse.Retort, 'retorts', _.merge(_.reject(Discourse.Retort.retorts, function(retort) {
        return retort.topic_id === id
      }), retorts))
    }
    Discourse.TopicRoute.on("setupTopicController", function(event) {
      Discourse.ajax('/retorts/index?topic_id=' + event.controller.model.id).then(function(retorts) {
        refreshRetorts(retorts, event.controller.model.id)
      })
      event.controller.messageBus.subscribe('/retort/topics/' + event.controller.model.id, refreshRetorts)
    })
  }
}
