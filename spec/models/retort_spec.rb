# frozen_string_literal: true
require 'rails_helper'

describe ::Retort::Retort do
  let(:user) { Fabricate :user }
  let(:topic) { Fabricate :topic }
  let(:post) { Fabricate :post, topic: topic }
  let(:another_post) { Fabricate :post, topic: topic }
  let(:another_topic_post) { Fabricate :post }
  let(:emoji) { 'kickbutt' }
  let(:altermoji) { 'puntrear' }
  let(:detail) { Fabricate :post_detail, post: post, value: [user.username], key: "#{emoji}|retort", extra: Retort::RETORT_PLUGIN_NAME }
  let(:retort) { Retort::Retort.new(detail) }

  describe 'initialize' do
    it 'stores the post' do
      expect(retort.detail.post_id).to eq post.id
    end
    it 'stores the user' do
      expect(retort.detail.value).to eq [user.username].to_json
    end
    it 'stores the retort' do
      expect(retort.detail.key.split("|")[0]).to eq emoji
    end
  end

  describe 'Retort' do
    let(:another_user) { Fabricate :user }
    let(:a_third_user) { Fabricate :user }
    let!(:existing) { Fabricate :post_detail, post: post, key: "wave|retort", value: [user.username], extra: "retort" }
    let!(:another_existing) { Fabricate :post_detail, post: post, key: "hug|retort", value: [another_user.username], extra: "retort" }
    let!(:another_post_retort) { Fabricate :post_detail, post: another_post, key: "laugh|retort", value: [user.username], extra: "retort" }
    let!(:another_topic_retort) { Fabricate :post_detail, post: another_topic_post, key: "rocket|retort", value: [user.username], extra: "retort" }

    it 'finds an existing retort by post / user' do
      found = Retort::Retort.for_user(post: post, user: user)

      expect(found.count).to eq 1
      expect(found[0].detail).to eq existing
      expect(found[0].detail).to_not eq another_existing
    end

    it 'finds all retorts for a post if no user is specified' do
      found = Retort::Retort.for_post(post: post)

      expect(found.count).to eq 2
      expect(found[0]).to eq existing
      expect(found[1]).to eq another_existing
      expect(found[0]).to_not eq another_post_retort
      expect(found[1]).to_not eq another_post_retort
    end

    it 'returns empty when no post or topic is specified' do
      found = Retort::Retort.for_user(post: nil, user: user)

      expect(found).to be_empty
    end

    it 'returns empty when no retort exists' do
      found = Retort::Retort.for_user(post: post, user: a_third_user)

      expect(found).to be_empty
    end
  end
end
