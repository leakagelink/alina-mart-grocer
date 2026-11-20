import { test } from "node:test";
import { strictEqual } from "node:assert";
import { socialLinkSchema } from "./social-links";

for (const [platform, url] of [["facebook", "https://facebook.com/customer"], ["instagram", "https://instagram.com/customer"], ["x", "https://x.com/customer"], ["other", "https://youtube.com/@customer"]]) {
  test(`${platform} profile links can be added`, () => {
    strictEqual(socialLinkSchema.safeParse({ platform, label: platform, url }).success, true);
  });
}
test("unsafe and wrong-platform links are rejected", () => {
  for (const url of ["javascript:alert(1)", "https://instagram.com/customer", "https://facebook.com.evil.com/customer"]) {
    strictEqual(socialLinkSchema.safeParse({ platform: "facebook", label: "Facebook", url }).success, false);
  }
});