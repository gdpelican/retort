require "spec_helper"

path = "./plugins/retort/plugin.rb"
source = File.read(path)
plugin = Plugin::Instance.new(Plugin::Metadata.parse(source), path)
plugin.activate!
plugin.initializers.first.call

describe ::Retort::RetortsController do
  routes { ::Retort::Engine.routes }

  before do
    SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'retort', 'config', 'settings.yml'))
  end

  describe "index" do
    it "returns a list retorts for a post" do
      xhr :get, :index
    end

    it "returns a list of retorts for a topic" do
    end
  end

  describe "update" do
    it "updates a retort" do
    end
  end

  describe "destroy" do
    it "destroys a retort"
  end

  def response_json
    JSON.parse(response.body)
  end

end
