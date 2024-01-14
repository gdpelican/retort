import { click, visit } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance, exists } from "discourse/tests/helpers/qunit-helpers";
import { default as RetortTopics } from "../fixtures/retort-topic-fixtures";

acceptance("Retort - Enabled", function (needs) {
  needs.user();

  needs.settings({
    retort_enabled: true,
  });

  needs.pretender((server, helper) => {
    const topicPath = "/t/56.json";
    server.get(topicPath, () => helper.response(RetortTopics[topicPath]));
    const retortPath = "/retorts/290.json";
    server.post(retortPath, () => helper.response( { success: "ok" } ));
  });

  test("It shows retort controls which can be clicked without error", async (assert) => {
    await visit("/t/slug/56");

    assert.ok(
      exists("button.retort"),
      "retort controls are available"
    );

    await click("#post_1 button.retort");

    assert.ok(
      exists(".emoji-picker.opened"),
      "emoji picker is shown"
    );

    await click(".emoji-picker-emoji-area img");

    assert.notOk(
      exists(".emoji-picker.opened"),
      "emoji picker is no longer shown"
    );
  });
});
