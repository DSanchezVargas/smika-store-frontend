export function roundPriceDown(value) {
  if (!Number.isFinite(value)) return 0;

  return Math.floor(value / 10) * 10;
}

export function roundPriceUp(value) {
  if (!Number.isFinite(value)) return 500;

  return Math.ceil(value / 10) * 10;
}

export function getDynamicPriceRange(products = []) {
  const prices = products
    .map((product) => Number(product.price || product.precio))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length === 0) {
    return {
      min: 0,
      max: 500
    };
  }

  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);

  const min = roundPriceDown(lowestPrice);
  let max = roundPriceUp(highestPrice);

  if (min === max) {
    max = min + 10;
  }

  return {
    min,
    max
  };
}