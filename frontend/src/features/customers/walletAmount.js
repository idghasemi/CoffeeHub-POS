/**
 * Parse a wallet charge amount entered in toman.
 *
 * Wallet balances are stored and displayed in whole toman values, so the
 * frontend rejects zero, negative, fractional and non-numeric inputs before
 * sending a financial request to the API.
 *
 * @param {string | number} value Raw input value.
 * @returns {number | null} A positive integer amount, or null when invalid.
 */
function parseWalletChargeAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

export { parseWalletChargeAmount };
