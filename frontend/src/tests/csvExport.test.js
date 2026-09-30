import { ordersToCsvRows, productsToCsvRows, rowsToCsv } from '../pages/admin/csvExport';

test('CSV serialization quotes delimiters and protects spreadsheet formulas', () => {
  const csv = rowsToCsv([
    ['Name', 'Description', 'Value'],
    ['Bowl, blue', '"handmade"', '=HYPERLINK("https://example.test")'],
    ['Leading formula', '  @SUM(A1:A2)', 1200],
    ['Newline formula', '\n=SUM(A1:A2)', 'safe'],
  ]);

  expect(csv.startsWith('\uFEFF')).toBe(true);
  expect(csv).toContain('"Bowl, blue"');
  expect(csv).toContain('""handmade""');
  expect(csv).toContain(`'=HYPERLINK(""https://example.test"")`);
  expect(csv).toContain("'  @SUM(A1:A2)");
  expect(csv).toContain("'\n=SUM(A1:A2)");
});

test('product export includes inventory, price, visibility, and variant columns', () => {
  const rows = productsToCsvRows([{
    _id:'product-1', name:'=Unsafe label', category:'Home', pricePKR:1200, priceUSD:4.3,
    stock:5, isLocal:true, isVisible:false, colors:['Blue'], sizes:['M'], images:['one.jpg'],
  }]);

  expect(rows[0]).toContain('Stock');
  expect(rows[0]).toContain('Visible');
  expect(rows[1]).toContain(1200);
  expect(rows[1]).toContain(false);
  expect(rowsToCsv(rows)).toContain("'=Unsafe label");
});

test('order export includes totals and guest contact fallback', () => {
  const rows = ordersToCsvRows([{
    _id:'order-1', guestContact:{ name:'Guest Buyer', email:'guest@example.test', phone:'555' },
    products:[{ name:'Apple', quantity:2 }], productTotal:400, shippingFee:80, codFee:0, totalPrice:480,
    status:'Pending', paymentMethod:'COD', address:{ country:'Pakistan', city:'Multan' },
  }]);

  expect(rows[0]).toContain('Customer');
  expect(rows[0]).toContain('Total');
  expect(rows[1]).toContain('Guest Buyer');
  expect(rows[1]).toContain('guest@example.test');
  expect(rows[1]).toContain('Apple × 2');
  expect(rows[1]).toContain(480);
});
