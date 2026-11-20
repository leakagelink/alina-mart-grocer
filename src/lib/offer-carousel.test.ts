import { test } from "node:test";
import { strictEqual } from "node:assert";
import { nextOffer } from "./offer-carousel";

test("automatic offers advance and loop through every banner", () => {
  strictEqual(nextOffer(0, 3), 1);
  strictEqual(nextOffer(1, 3), 2);
  strictEqual(nextOffer(2, 3), 0);
});
test("no automatic advance when no banner or only one is visible", () => {
  strictEqual(nextOffer(0, 0), 0);
  strictEqual(nextOffer(0, 1), 0);
});