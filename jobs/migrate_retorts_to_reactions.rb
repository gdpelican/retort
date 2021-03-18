module Jobs
  class MigrateRetortsToReactions < ::Jobs::Base
    def execute(args)
      result = Retort::Migrate.discourse_reactions(
        real_run: args[:real_run] == true,
        delete_retorts: args[:delete_retorts] == true
      )      
      MessageBus.publish("/retort/migrate", result.as_json)
    end
  end
end