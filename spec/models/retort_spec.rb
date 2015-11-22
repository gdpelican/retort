require "spec_helper"

path = "./plugins/retort/plugin.rb"
source = File.read(path)
plugin = Plugin::Instance.new(Plugin::Metadata.parse(source), path)
plugin.activate!
plugin.initializers.first.call

describe ::Retort::Retort do
  before do
    SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'retort', 'config', 'settings.yml'))
  end

  let(:user) { Fabricate :user }
  let(:topic) { Fabricate :topic }
  let(:post) { Fabricate :post, topic: topic }
  let(:another_post) { Fabricate :post, topic: topic }
  let(:another_topic_post) { Fabricate :post }
  let(:emoji) { 'kickbutt' }
  let(:altermoji) { 'puntrear' }
  let(:retort) { Retort::Retort.new(post, user, emoji) }

  describe 'initialize' do
    it 'stores the post' do
      expect(retort.post).to eq post
    end
    it 'stores the user' do
      expect(retort.user).to eq user
    end
    it 'stores the retort' do
      expect(retort.retort).to eq emoji
    end
  end

  describe 'where' do
    let(:another_user) { Fabricate :user }
    let(:a_third_user) { Fabricate :user }
    let!(:existing) { Fabricate :post_detail, post: post, key: "retort_#{user.id}", value: 'retort', extra: emoji }
    let!(:another_existing) { Fabricate :post_detail, post: post, key: "retort_#{another_user.id}", value: :retort, extra: emoji }
    let!(:another_post_retort) { Fabricate :post_detail, post: another_post, key: "retort_#{user.id}", value: :retort, extra: emoji }
    let!(:another_topic_retort) { Fabricate :post_detail, post: another_topic_post, key: "retort_#{user.id}", value: :retort, extra: emoji }

    it 'finds an existing retort by post / user' do
      found = Retort::Retort.where(post: post, user: user)
      expect(found).to include existing
      expect(found).to_not include another_existing
    end

    it 'finds existing retorts by topic / user' do
      found = Retort::Retort.where(topic: topic)
    end

    it 'finds all retorts for a post if no user is specified' do
      found = Retort::Retort.where(post: post)
      expect(found).to include existing
      expect(found).to include another_existing
      expect(found).to_not include another_post_retort
      expect(found).to_not include another_topic_retort
    end

    it 'finds all retorts for a topic if no user is specified' do
      found = Retort::Retort.where(topic: topic)
      expect(found).to include existing
      expect(found).to include another_existing
      expect(found).to include another_post_retort
      expect(found).to_not include another_topic_retort
    end

    it 'returns empty when no post or topic is specified' do
      found = Retort::Retort.where(user: user)
      expect(found).to be_empty
    end

    it 'returns empty when no retort exists' do
      expect(Retort::Retort.where(post: post, user: a_third_user)).to be_empty
    end
  end

  describe 'save' do
    it 'saves the retort to the posts details' do
      expect { retort.save }.to change { PostDetail.count }.by(1)
      expect(PostDetail.find_by(post: post, key: "retort_#{user.id}", value: :retort, extra: emoji)).to be_present
    end

    it 'overwrites an existing retort' do
      retort.save
      retort.retort = altermoji
      expect { retort.save }.not_to change { PostDetail.count }
      expect(PostDetail.find_by(post: post, key: "retort_#{user.id}", value: :retort, extra: altermoji)).to be_present
      expect(PostDetail.find_by(post: post, key: "retort_#{user.id}", value: :retort, extra: emoji)).not_to be_present
    end

    it 'deletes an empty retort' do
      retort.save
      retort.retort = ''
      expect { retort.save }.to change { PostDetail.count }.by(-1)
      expect(PostDetail.find_by(post: post, key: "retort_#{user.id}", value: :retort, extra: emoji)).not_to be_present
    end
  end

end
