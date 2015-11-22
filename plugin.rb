# name: babble
# about: Reactions plugin for Discourse
# version: 0.0.1
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
    delete "/:post_id" => "retorts#destroy"
    get    "/index"    => "retorts#index"
  end

  Discourse::Application.routes.append do
    mount ::Retort::Engine, at: "/retorts"
  end

  class ::Retort::RetortsController < ApplicationController
    before_filter :verify_post_and_user, only: [:update, :destroy]

    def index
      render json: serialized_retorts
    end

    def update
      @retort = Retort::Retort.new(post, current_user, params[:retort]).save
      respond_with_retort
    end

    def destroy
      @retort = Retort::Retort.new(post, current_user).save
      respond_with_retort
    end

    private

    def post
      @post ||= Post.find_by(id: params[:post_id]) if params[:post_id]
    end

    def topic
      @topic ||= Topic.find_by(id: params[:topic_id]) if params[:topic_id]
    end

    def retorts
      @retorts ||= Retort::Retort.where(post: post, topic: topic)
    end

    def verify_post_and_user
      respond_with_unprocessable("Unable to find post #{params[:post_id]}") unless post
      respond_with_unprocessable("You are not permitted to modify this") unless current_user
    end

    def respond_with_retort
      if @retort && @retort.valid?
        MessageBus.publish("/topic/#{params[:topic_id] || post.topic_id}", serialized_retorts)
        render json: { success: :ok }
      else
        respond_with_unprocessable("Unable to save that retort. Please try again")
      end
    end

    def serialized_retorts
      ActiveModel::ArraySerializer.new(retorts, each_serializer: ::Retort::RetortSerializer)
    end

    def respond_with_unprocessable(error)
      render json: { errors: error }, status: :unprocessable_entity
    end
  end

  class ::Retort::RetortSerializer < ActiveModel::Serializer
    attributes :user_id, :post_id, :emoji
    define_method :post_id, -> { object.post.id }
    define_method :user_id, -> { object.key.match(/\d+/).to_s.to_i }
    define_method :emoji,   -> { object.extra }
  end

  ::Retort::Retort = Struct.new(:post, :user, :retort) do

    def self.where(post: nil, topic: nil, user: nil)
      where_params = { value: RETORT_PLUGIN_NAME }
      where_params.merge!(key: :"retort_#{user.id}") if user

      if post
        PostDetail.where(where_params.merge(post: post))
      elsif topic
        PostDetail.joins(:post).where(where_params).where('posts.topic_id = ?', topic.id)
      else
        PostDetail.none
      end
    end

    def save
      if existing = PostDetail.find_by(detail_params)
        retort.present? ? existing.update(extra: retort) : existing.destroy
        existing
      else
        PostDetail.create(detail_params.merge(extra: retort))
      end
    end

    private

    def detail_params
      { post: post, key: :"retort_#{user.id}", value: RETORT_PLUGIN_NAME }
    end
  end

end
