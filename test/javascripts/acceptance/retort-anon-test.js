import { visit } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance, exists } from "discourse/tests/helpers/qunit-helpers";
import { default as RetortTopics } from "../fixtures/retort-topic-fixtures";

acceptance("Retort - Anon", function (needs) {
  needs.settings({
    retort_enabled: true,
  });

  needs.pretender((server, helper) => {
    const topicPath = "/t/56.json";
    server.get(topicPath, () => helper.response(RetortTopics[topicPath]));
  });

  test("It does not show retort controls", async (assert) => {
    await visit("/t/slug/56");

    assert.notOk(exists("button.retort"), "retort controls are not available");
  });
});
