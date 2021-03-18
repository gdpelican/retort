class ::Retort::Migrate
  MIGRATION ||= "migration"
  
  def self.list_migrations
    PluginStoreRow.where("plugin_name = '#{Retort::PLUGIN_NAME}' AND key LIKE '#{MIGRATION}_%'")
      .order("value::json->>'migrated_at' DESC")
      .map do |record|
        JSON.parse(record.value)
      end
  end
  
  def self.save_migration(migration_result)
    migrated_at = Time.now
    migration_result.migrated_at = migrated_at.iso8601
    PluginStore.set(Retort::PLUGIN_NAME, "#{MIGRATION}_#{migrated_at.to_i}", migration_result.as_json)
  end
  
  def self.discourse_reactions(real_run: false, delete_retorts: false)
    result = ::Retort::MigrateResult.new

    unless Discourse.find_plugins(include_disabled: false).any?{ |p| p.name === 'discourse-reactions' }
      result.error = I18n.t("retort.migrate.discourse_reactions_not_enabled")
      return result
    end

    records = PostDetail.where(extra: Retort::PLUGIN_NAME)
    
    unless records.exists?
      result.error = I18n.t("retort.migrate.no_retorts")
      return result
    end

    records.each do |record|
      retort = record.key.split('|retort').first
      
      unless retort && DiscourseReactions::Reaction.valid_reactions.include?(retort)
        result.retort_not_supported.push(
          retort: retort
        )
        next
      end
      
      post = record.post

      unless post.present? && post.deleted_at.nil?
        result.post_deleted.push(
          retort: retort,
          post_id: post.present? ? post.id : nil
        )
        next
      end
      
      begin
        values = JSON.parse(record.value)
      rescue JSON::ParserError
        values = []
      end
      usernames = []
      
      values.each do |username|
        if User.exists?(username: username)
          usernames.push(username)
        else
          result.user_doesnt_exist.push(
            retort: retort,
            post_id: post.id,
            username: username
          )
        end
      end
      
      next unless usernames.any?
      
      User.where(username: usernames).each do |user|
        if DiscourseReactions::ReactionUser.exists?(user_id: user.id, post_id: post.id)
          result.user_already_reacted.push(
            post_id: post.id,
            username: user.username,
            retort: retort
          )
        else
          if real_run
            DiscourseReactions::ReactionManager.new(
              reaction_value: retort,
              user: user,
              guardian: Guardian.new(user),
              post: post
            ).toggle!
          end
          
          result.retorts_migrated.push(
            post_id: post.id,
            username: user.username,
            retort: retort
          )
        end
      end
    end

    if delete_retorts
      records.delete_all
      result.retorts_deleted = true
    end
    
    result.real = true if real_run
    result.success = true
    
    save_migration(result)
    
    result
  end
end