import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import BusinessInsightsPanel from '../pages/admin/dashboard/BusinessInsightsPanel';
import API from '../utils/axiosConfig';

vi.mock('../utils/axiosConfig', () => ({ default:{ get:vi.fn() } }));

const sample = {
  currency:'PKR', usdRate:278, periodDays:30,
  kpis:{ netSales:{ value:50000, previous:40000, change:25 }, orders:{ value:20, previous:16, change:25 }, averageOrderValue:{ value:2500, previous:2500, change:0 },
    units:{ value:30 }, newCustomers:{ value:8 }, cancelRate:{ value:5, previous:10 }, returnRate:{ value:12, previous:4 }, codToCollect:{ value:7000 } },
  current:{ units:30, productSales:45000, shippingFees:4000, codFees:1000, discounts:2000, collected:43000, lostSales:6000, couponUseRate:15, internationalShare:5 },
  customers:{ returningInPeriod:4, repeatRate:22, totalCustomers:40, top:[{ name:'Ali', email:'ali@x.pk', orders:3, spent:9000, guest:false }], averageLifetimeValue:3000, lapsed:6 },
  topProducts:[{ id:'p1', name:'Rose soap', units:12, revenue:6000, stock:3, daysOfStockLeft:7 }],
  inventory:{ stockValue:120000, totalProducts:15, restockSoon:[{ id:'p1', name:'Rose soap', stock:3, daysOfStockLeft:7 }], outOfStock:[], notSelling:[] },
  cities:[{ city:'Karachi', orders:8, netSales:20000, failedRate:30 }], coupons:[], unusedCoupons:['EID10'],
  weekdays:[{ day:'Fri', orders:6, netSales:15000 }], trend:[{ date:'2026-11-14', orders:2, netSales:5000 }],
  suggestions:[{ priority:'high', area:'Returns', title:'12% of orders were returned', detail:'Confirm COD orders by phone.' }],
};

test('shows KPIs with growth, suggestions and switches period', async () => {
  API.get.mockResolvedValue({ data:sample });
  render(<BusinessInsightsPanel />);
  expect(await screen.findByText('12% of orders were returned')).toBeInTheDocument();
  expect(screen.getAllByText(/▲ 25%/).length).toBe(2);
  expect(screen.getByText(/Restock:/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name:'90 days' }));
  await waitFor(() => expect(API.get).toHaveBeenLastCalledWith('/api/orders/business', { params:{ days:90 } }));
});

test('an unexpected reply shows a message instead of crashing', async () => {
  API.get.mockResolvedValue({ data:[{ _id:'p1' }] });
  render(<BusinessInsightsPanel />);
  expect(await screen.findByText(/not available yet/i)).toBeInTheDocument();
});
