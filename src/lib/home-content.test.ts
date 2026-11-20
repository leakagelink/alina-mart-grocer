import { describe, expect, test } from "bun:test";
import { homeContent, moveItem, sectionProducts, type HomeSection } from "./home-content";

describe("admin-managed home", () => {
  test("deleted banners and sections stay deleted instead of restoring defaults", () => {
    expect(homeContent({ categories: [], banners: [], sections: [] })).toEqual({ categories: [], banners: [], sections: [] });
  });
  test("product sections respect admin selection order and removed products", () => {
    const section: HomeSection = { id: "test", title: "Test", titleHi: "", category: "", visible: true, productIds: ["second", "deleted", "first"] };
    const products = ["first", "second", "other"].map(id => ({ id, name: id, category: "fruits", price: 10, mrp: 10, unit: "1", emoji: "", stock: 1 }));
    expect(sectionProducts(section, products).map(p => p.id)).toEqual(["second", "first"]);
  });
  test("admin can reorder categories without changing the source", () => {
    const original = ["fruits", "dairy", "bakery"];
    expect(moveItem(original, 1, -1)).toEqual(["dairy", "fruits", "bakery"]);
    expect(original).toEqual(["fruits", "dairy", "bakery"]);
    expect(moveItem(original, 0, -1)).toEqual(original);
  });
});