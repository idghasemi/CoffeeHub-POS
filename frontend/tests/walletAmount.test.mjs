import assert from "node:assert/strict";
import test from "node:test";

import { parseWalletChargeAmount } from "../src/features/customers/walletAmount.js";

test("accepts common round wallet charge amounts", () => {
  assert.equal(parseWalletChargeAmount("100000"), 100000);
  assert.equal(parseWalletChargeAmount(500000), 500000);
});

test("does not require the amount to end in one", () => {
  assert.equal(parseWalletChargeAmount("100001"), 100001);
  assert.equal(parseWalletChargeAmount("25000"), 25000);
});

test("rejects invalid wallet charge amounts", () => {
  assert.equal(parseWalletChargeAmount(""), null);
  assert.equal(parseWalletChargeAmount("0"), null);
  assert.equal(parseWalletChargeAmount("-1000"), null);
  assert.equal(parseWalletChargeAmount("1000.5"), null);
  assert.equal(parseWalletChargeAmount("not-a-number"), null);
});

test("wallet input accepts 100000 without a native step mismatch", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../src/features/customers/components/WalletChargeModal.jsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /min="1"/);
  assert.match(source, /step="1"/);
  assert.doesNotMatch(source, /step="1000"/);
});
