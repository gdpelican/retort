require 'rails_helper'

describe ::Retort::RetortsController, type: :request do
  fab!(:user) { Fabricate(:user) }
  fab!(:new_post) { Fabricate(:post) }
  fab!(:another_user) { Fabricate(:user) }
  let!(:existing) { Fabricate :post_detail, post: new_post, key: "wave|retort", value: [user.username], extra: "retort" }

  before do
    sign_in(another_user)
  end

  it "updates a retort" do
    expect do 
      post "/retorts/#{new_post.id}.json",
           params: {
             retort: "heart_eyes"
           }
    end.to change { PostDetail.count }.by(1)
    expect do 
      post "/retorts/#{new_post.id}.json",
           params: {
             retort: "heart_eyes"
           }
    end.to change {Retort::Retort.for_post(post: new_post).count }.by(-1)
  end

  it "destroys a retort" do
    sign_in(user)
    post "/retorts/#{new_post.id}.json",
      params: {
        retort: "wave"
      }
     found = Retort::Retort.for_post(post: new_post)
     expect(found.count).to eq(0)
  end
end
