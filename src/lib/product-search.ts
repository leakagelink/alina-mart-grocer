const aliases: Record<string, string> = {
  दूध: "milk", दुध: "milk", ब्रेड: "bread", आटा: "atta", चावल: "rice", दाल: "dal",
  अंडे: "eggs", अंडा: "eggs", पनीर: "paneer", दही: "curd", मक्खन: "butter",
  घी: "ghee", चीनी: "sugar", नमक: "salt", तेल: "oil", चाय: "tea", कॉफी: "coffee",
  आलू: "potato", टमाटर: "tomato", प्याज: "onion", केला: "banana", केले: "banana",
  सेब: "apple", बिस्कुट: "biscuits", चिप्स: "chips", साबुन: "soap", अमूल: "amul",
};

export function speechLanguage(lang: "en" | "hi") {
  return lang === "hi" ? "hi-IN" : "en-IN";
}

export function matchesProductSearch(name: string, query: string) {
  const clean = (value: string) => value.normalize("NFKC").toLocaleLowerCase().replace(/[.,!?।]/g, "").trim();
  const words = clean(query).split(/\s+/).filter(Boolean).map(word => aliases[word] ?? word);
  const product = clean(name);
  return words.every(word => product.includes(word));
}