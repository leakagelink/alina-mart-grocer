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

const hindiCatalogue: [string, string][] = [
  ["Brown Bread", "ब्राउन ब्रेड"], ["Butter Croissant", "मक्खन क्रोइसेंट"], ["Pav Buns", "पाव"],
  ["Amul Toned Milk", "अमूल दूध"], ["Farm Eggs", "अंडे"], ["Paneer Fresh", "पनीर"], ["Curd Cup", "दही"],
  ["Royal Gala Apple", "सेब"], ["Butter Biscuits", "मक्खन बिस्कुट"], ["Fresh Broccoli", "ब्रोकली"],
  ["Milk Chocolate", "चॉकलेट"], ["Whole Wheat Atta", "गेहूं आटा"], ["Gentle Handwash", "हैंडवॉश"],
  ["Toor Dal", "अरहर दाल"], ["Sunflower Oil", "सूरजमुखी तेल"], ["Red Capsicum", "लाल शिमला मिर्च"],
  ["Basmati Rice", "बासमती चावल"], ["Fresh Spinach", "पालक"], ["Premium Assam Tea", "असम चाय"],
  ["Fresh Tomato", "टमाटर"], ["Banana Robusta", "केला"], ["Yellow Capsicum", "पीली शिमला मिर्च"],
  ["Green Lettuce", "सलाद पत्ता"], ["Onion", "प्याज़"], ["Apple Shimla", "सेब"],
  ["Dish Wash Gel", "बर्तन धोने जेल"], ["Floor Cleaner", "फर्श क्लीनर"], ["Toilet Soap", "साबुन"],
  ["Lux sabun", "लक्स साबुन"], ["Potato Chips", "आलू चिप्स"], ["Choco Cookies", "चॉकलेट कुकीज"],
  ["Salted Peanuts", "नमकीन मूंगफली"], ["Instant Noodles", "नूडल्स"], ["Orange Juice", "संतरे जूस"],
  ["Cold Drink", "कोल्ड ड्रिंक"], ["Mineral Water", "पानी"], ["Green Tea", "हरी चाय"], ["Vendor Test Rice", "चावल"],
];
for (const [name, query] of hindiCatalogue) {
  test(`${name} is searchable in Hindi: ${query}`, () => strictEqual(matchesProductSearch(name, query), true));
}
test("Hindi input handles invisible characters and mixed language without unrelated results", () => {
  strictEqual(matchesProductSearch("Paneer Fresh", "प\u200dनीर।"), true);
  strictEqual(matchesProductSearch("Paneer Fresh", "fresh पनीर"), true);
  strictEqual(matchesProductSearch("Fresh Tomato", "पनीर"), false);
  strictEqual(matchesProductSearch("Paneer Fresh", "pane"), true);
  strictEqual(matchesProductSearch("ताज़ा पनीर", "paneer"), true);
});