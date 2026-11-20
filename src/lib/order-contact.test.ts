import { test } from "node:test";
import { strictEqual } from "node:assert";
import { riderCallHref } from "./order-contact";

test("tracking calls the assigned rider's number", () => {
  strictEqual(riderCallHref("9644312062"), "tel:+919644312062");
});
test("tracking never substitutes a fake phone for a missing rider contact", () => {
  strictEqual(riderCallHref(), undefined);
  strictEqual(riderCallHref("invalid"), undefined);
});