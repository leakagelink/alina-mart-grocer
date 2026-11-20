import { expect, test } from "bun:test";
import { riderCallHref } from "./order-contact";

test("tracking calls the assigned rider's number", () => {
  expect(riderCallHref("9644312062")).toBe("tel:+919644312062");
});
test("tracking never substitutes a fake phone for a missing rider contact", () => {
  expect(riderCallHref()).toBeUndefined();
  expect(riderCallHref("invalid")).toBeUndefined();
});