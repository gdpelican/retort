# Retort - A Reaction Plugin for Discourse

Retort allows you and your users to add slack-style reactions to your discourse posts.

Check out a quick gif of it in action [here](http://recordit.co/7vHi2j74Rg.gif)!

### Installation
- Edit your web template and add the project clone url. (https://meta.discourse.org/t/install-a-plugin/19157)
- Rebuild your web container so that the plugin installs.
- Visit `admin/site_settings/category/all_results`, and look for the `post_menu` option. Insert a `retort` action at the end of the list, like this:

[![admin_panel](screenshots/admin_panel.png)]()

You're done!

### Development Roadmap
There's a few things I'd like to add to this plugin as time allows; feel free to jump in and help if you like!

- Allow grouping of similar retorts together
- Order the retorts on a post in some intelligent way
- Allow user to remove their reaction (instead of just being able to change it)
- More efficient / parsing of retorts

### Contributing

Pull requests welcome! To contribute:
- Fork it ( https://github.com/<your-github-username>/retort/fork )
- Create your feature branch (`git checkout -b your-new-feature`)
- Commit your changes (`git commit -am 'Add some feature`)
- Push to the branch (`git push origin your-new-feature`)
- Create a new Pull Request
