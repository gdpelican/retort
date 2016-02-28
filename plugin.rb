# name: retort
# about: Reactions plugin for Discourse
# version: 0.0.2
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
    get    "/index"    => "retorts#index"
  end

  Discourse::Application.routes.append do
    mount ::Retort::Engine, at: "/retorts"
  end

  class ::Retort::RetortsController < ApplicationController
    before_filter :verify_post_and_user, only: [:update, :destroy]

    def index
      render json: serialized_retorts, root: false
    end

    def update
      retort.toggle_user(current_user)
      respond_with_retort
    end

    private

    def post
      @post ||= Post.find_by(id: params[:post_id]) if params[:post_id]
    end

    def topic
      @topic ||= Topic.find_by(id: params[:topic_id]) if params[:topic_id]
    end

    def retort
      @retort ||= Retort::Retort.find_by(post: post, retort: params[:retort])
    end

    def retorts
      @retorts ||= Retort::Retort.for_topic(topic: topic || post.topic)
    end

    def verify_post_and_user
      respond_with_unprocessable("Unable to find post #{params[:post_id]}") unless post
      respond_with_unprocessable("You are not permitted to modify this") unless current_user
    end

    def respond_with_retort
      if @retort && @retort.valid?
        MessageBus.publish "/retort/topics/#{params[:topic_id] || post.topic_id}", serialized_retorts
        render json: { success: :ok }
      else
        respond_with_unprocessable("Unable to save that retort. Please try again")
      end
    end

    def serialized_retorts
      ActiveModel::ArraySerializer.new(retorts, each_serializer: ::Retort::RetortSerializer).as_json
    end

    def respond_with_unprocessable(error)
      render json: { errors: error }, status: :unprocessable_entity
    end
  end

  class ::Retort::RetortSerializer < ActiveModel::Serializer
    attributes :topic_id, :post_id, :usernames, :retort
    define_method :topic_id,  -> { object.post.topic_id }
    define_method :post_id,   -> { object.post_id }
    define_method :usernames, -> { object.value }
    define_method :retort,    -> { object.key.split('_').first }
  end

  ::Retort::Retort = Struct.new(:detail) do

    def self.for_topic(topic:)
      PostDetail.joins(:post)
                .where(extra: RETORT_PLUGIN_NAME)
                .where('posts.topic_id' => topic.id)
    end

    def self.for_post(post:)
      for_topic(topic: post.topic).where(post: post)
    end

    def self.find_by(post:, retort:)
      new(for_post(post: post).find_or_initialize_by(key: :"#{retort}_#{RETORT_PLUGIN_NAME}"))
    end

    def valid?
      detail.valid?
    end

    def toggle_user(user)
      new_value = if Array(detail.value).include? user.username
        Array(detail.value) - Array(user.username)
      else
        Array(detail.value) + Array(user.username)
      end
      detail.update(value: new_value)
    end
  end

  require_dependency 'post_serializer'
  class ::PostSerializer
    attributes :retorts

    def retorts
      return ActiveModel::ArraySerializer.new(Retort::Retort.for_post(post: object), each_serializer: ::Retort::RetortSerializer).as_json
    end
  end
end
