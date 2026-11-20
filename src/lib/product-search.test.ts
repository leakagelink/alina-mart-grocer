import { test } from "node:test";
import { strictEqual } from "node:assert";
import { matchesProductSearch, speechLanguage } from "./product-search";

test("spoken product names match case and punctuation without unrelated results", () => {
  strictEqual(matchesProductSearch("Amul Taaza Milk", "milk."), true);
  strictEqual(matchesProductSearch("Amul Taaza Milk", "Amul milk"), true);
  strictEqual(matchesProductSearch("Fresh Tomato", "milk"), false);
});
test("Hindi grocery speech finds English catalogue names", () => {
  strictEqual(matchesProductSearch("Amul Taaza Milk", "अमूल दूध"), true);
  strictEqual(matchesProductSearch("Aashirvaad Atta", "आटा"), true);
  strictEqual(matchesProductSearch("Fresh Tomato", "दूध"), false);
});
test("voice recognition follows selected Hindi or Indian English", () => {
  strictEqual(speechLanguage("hi"), "hi-IN");
  strictEqual(speechLanguage("en"), "en-IN");
});