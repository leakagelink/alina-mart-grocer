import { test } from "node:test";
import { strictEqual } from "node:assert";
import { supportSchema } from "./support-schema";

test("support requests require a real subject and problem description", () => {
  strictEqual(supportSchema.safeParse({ subject: "", message: "" }).success, false);
  strictEqual(supportSchema.safeParse({ subject: "Order help", message: "My order has not arrived." }).success, true);
});