# name: retort
# about: Reactions plugin for Discourse
# version: 1.1.10
# authors: James Kiesel (gdpelican)
# url: https://github.com/gdpelican/retort

register_asset "stylesheets/retort.scss"

RETORT_PLUGIN_NAME ||= "retort".freeze

enabled_site_setting :retort_enabled

after_initialize do
  module ::Retort
    class Engine < ::Rails::Engine
      engine_name RETORT_PLUGIN_NAME
      isolate_namespace Retort
    end
  end

  ::Retort::Engine.routes.draw do
    post   "/:post_id" => "retorts#update"
  end

  Discourse::Application.routes.append do
    mount ::Retort::Engine, at: "/retorts"
  end

  class ::Retort::RetortsController < ApplicationController
    before_action :verify_post_and_user, only: :update

    def update
      retort.toggle_user(current_user)
      respond_with_retort
    end

    private

    def post
      @post ||= Post.find_by(id: params[:post_id]) if params[:post_id]
    end

    def retort
      @retort ||= Retort::Retort.find_by(post: post, retort: params[:retort])
    end

    def verify_post_and_user
      respond_with_unprocessable("Unable to find post #{params[:post_id]}") unless post
      respond_with_unprocessable("You are not permitted to modify this") unless current_user
    end

    def respond_with_retort
      if retort && retort.valid?
        MessageBus.publish "/retort/topics/#{params[:topic_id] || post.topic_id}", serialized_post_retorts
        render json: { success: :ok }
      else
        respond_with_unprocessable("Unable to save that retort. Please try again")
      end
    end

    def serialized_post_retorts
      ::PostSerializer.new(post.reload, scope: Guardian.new, root: false).as_json
    end

    def respond_with_unprocessable(error)
      render json: { errors: error }, status: :unprocessable_entity
    end
  end

  class ::Retort::RetortSerializer < ActiveModel::Serializer
    attributes :post_id, :usernames, :emoji
    define_method :post_id,   -> { object.post_id }
    define_method :usernames, -> { object.persisted? ? JSON.parse(object.value) : [] }
    define_method :emoji,     -> { object.key.split('|').first }
  end

  ::Retort::Retort = Struct.new(:detail) do

    def self.for_post(post: nil)
      PostDetail.where(extra: RETORT_PLUGIN_NAME,
                       post: post)
    end

    def self.for_user(user: nil, post: nil)
      for_post(post: post).map    { |r| new(r) }
                          .select { |r| r.value.include?(user.username) }
    end

    def self.find_by(post: nil, retort: nil)
      new(for_post(post: post).find_or_initialize_by(key: :"#{retort}|#{RETORT_PLUGIN_NAME}"))
    end

    def valid?
      detail.valid?
    end

    def toggle_user(user)
      new_value = if value.include? user.username
        value - Array(user.username)
      else
        purge_other_retorts!(user) unless SiteSetting.retort_allow_multiple_reactions
        value + Array(user.username)
      end.flatten

      if new_value.any?
        detail.update(value: new_value.flatten)
      else
        detail.destroy
      end
    end

    def purge_other_retorts!(user)
      self.class.for_user(user: user, post: detail.post).map { |r| r.toggle_user(user) }
    end

    def value
      return [] unless detail.value
      @value ||= Array(JSON.parse(detail.value))
    end
  end

  require_dependency 'post_serializer'
  class ::PostSerializer
    attributes :retorts

    def retorts
      return ActiveModel::ArraySerializer.new(Retort::Retort.for_post(post: object), each_serializer: ::Retort::RetortSerializer).as_json
    end
  end

  require_dependency 'rate_limiter'
  require_dependency 'post_detail'
  class ::PostDetail
    include RateLimiter::OnCreateRecord
    rate_limit :retort_rate_limiter
    after_update { run_callbacks :create if is_retort? }

    def is_retort?
      extra == RETORT_PLUGIN_NAME
    end

    def retort_rate_limiter
      @rate_limiter ||= RateLimiter.new(retort_author, "create_retort", retort_max_per_day, 1.day.to_i) if is_retort?
    end

    def retort_author
      @retort_author ||= User.find_by(username: Array(JSON.parse(value)).last)
    end

    def retort_max_per_day
      (SiteSetting.retort_max_per_day * retort_trust_multiplier).to_i
    end

    def retort_trust_multiplier
      return 1.0 unless retort_author&.trust_level.to_i >= 2
      SiteSetting.send(:"retort_tl#{retort_author.trust_level}_max_per_day_multiplier")
    end
  end
end
