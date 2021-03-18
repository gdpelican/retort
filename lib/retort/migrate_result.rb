class ::Retort::MigrateResult
  include HasErrors
  
  attr_accessor :retorts_migrated,
                :user_doesnt_exist,
                :retort_not_supported,
                :post_deleted,
                :user_already_reacted,
                :success,
                :error,
                :real,
                :retorts_deleted,
                :migrated_at

  def initialize
    @success = false
    @real = false
    @retorts_deleted = false
    @retorts_migrated = []
    @user_doesnt_exist = []
    @retort_not_supported = []
    @post_deleted = []
    @user_already_reacted = []
  end

  def success?
    @success
  end

  def failed?
    !success
  end
end