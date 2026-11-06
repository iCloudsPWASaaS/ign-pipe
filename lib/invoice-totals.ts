export function invoiceTotals(
  lines: { quantity: unknown; unit_price: unknown }[],
  discount = 0,
) {
  const net = lines.reduce(
    (total, line) => total + Number(line.quantity || 0) * Number(line.unit_price || 0),
    0,
  );
  const discountValue = Math.min(Math.max(Number(discount || 0), 0), net);
  const afterDiscount = net - discountValue;
  const vat = afterDiscount * 0.2;
  return {
    net: round(net),
    discount: round(discountValue),
    netAfterDiscount: round(afterDiscount),
    vat: round(vat),
    total: round(afterDiscount + vat),
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
