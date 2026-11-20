import { test } from "node:test";
import { deepStrictEqual } from "node:assert";
import { visibleToUser, unreadRows } from "./notification-rules";

test("users see broadcasts and their activities, not another user's private messages", () => {
  const rows = [{ id: "broadcast", to: "all" }, { id: "mine", to: "customer-1" }, { id: "other", to: "customer-2" }];
  deepStrictEqual(visibleToUser(rows, "customer-1").map(n => n.id), ["broadcast", "mine"]);
  deepStrictEqual(visibleToUser(rows, null), []);
});
test("marking a notification read removes only that notification from unread", () => {
  deepStrictEqual(unreadRows([{ id: "order" }, { id: "admin" }], ["order"]), [{ id: "admin" }]);
});