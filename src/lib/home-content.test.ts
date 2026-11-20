import { describe, test } from "node:test";
import { deepStrictEqual } from "node:assert";
import { homeContent, moveItem, sectionProducts, validHomeImage, DEFAULT_HOME, type HomeSection } from "./home-content";

describe("admin-managed home", () => {
  test("platform assets and HTTPS photos can be saved, unsafe schemes cannot", () => {
    deepStrictEqual(validHomeImage(DEFAULT_HOME.banners[0]?.image ?? ""), true);
    deepStrictEqual(validHomeImage("https://example.com/photo.jpg"), true);
    deepStrictEqual(validHomeImage("javascript:alert(1)"), false);
  });
  test("deleted banners and sections stay deleted instead of restoring defaults", () => {
    deepStrictEqual(homeContent({ categories: [], banners: [], sections: [] }), { categories: [], banners: [], sections: [] });
  });
  test("product sections respect admin selection order and removed products", () => {
    const section: HomeSection = { id: "test", title: "Test", titleHi: "", category: "", visible: true, productIds: ["second", "deleted", "first"] };
    const products = ["first", "second", "other"].map(id => ({ id, name: id, category: "fruits", price: 10, mrp: 10, unit: "1", emoji: "", stock: 1 }));
    deepStrictEqual(sectionProducts(section, products).map(p => p.id), ["second", "first"]);
  });
  test("admin can reorder categories without changing the source", () => {
    const original = ["fruits", "dairy", "bakery"];
    deepStrictEqual(moveItem(original, 1, -1), ["dairy", "fruits", "bakery"]);
    deepStrictEqual(original, ["fruits", "dairy", "bakery"]);
    deepStrictEqual(moveItem(original, 0, -1), original);
  });
});