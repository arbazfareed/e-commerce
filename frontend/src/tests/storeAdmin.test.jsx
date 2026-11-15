import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import StoreAdminPage from '../pages/StoreAdminPage';
import StoresPanel from '../pages/admin/StoresPanel';
import { useAuth } from '../context/AuthContext';
import API from '../utils/axiosConfig';

vi.mock('../context/AuthContext', () => ({ useAuth:vi.fn() }));
vi.mock('../utils/axiosConfig', () => ({ default:{ get:vi.fn(), post:vi.fn(), put:vi.fn(), patch:vi.fn(), delete:vi.fn() }, assetUrl:path => path }));

const owner = { _id:'u2', name:'Craft House', username:'craft-house-4821', email:'owner@example.pk', isSubAdmin:true, isAdmin:false, storeName:'Craft House', mustChangePassword:true };
const product = { _id:'p1', name:'Clay bowl', category:'Home', pricePKR:1500, priceUSD:6, stock:3, isVisible:true, images:[] };

const renderStore = path => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/admin" element={<StoreAdminPage />} /><Route path="/admin/:section" element={<StoreAdminPage />} /></Routes>
  </MemoryRouter>,
);

test('store owner sees only store endpoints, their products, and can delete with confirmation', async () => {
  useAuth.mockReturnValue({ user:owner, updateUser:vi.fn() });
  API.get.mockImplementation(url => Promise.resolve({ data: url === '/api/products/manage' ? [product] : [] }));
  API.delete.mockResolvedValue({ data:{} });
  renderStore('/admin/products');

  expect(screen.getByRole('heading', { name:'Craft House' })).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent(/temporary password/i);
  expect(await screen.findByText('Clay bowl')).toBeInTheDocument();
  for (const [url] of API.get.mock.calls) expect(url).toMatch(/^\/api\/(products\/manage|stores\/analytics|products\/categories)$/);

  fireEvent.click(screen.getByRole('button', { name:'Delete Clay bowl' }));
  fireEvent.click(screen.getByRole('button', { name:'Confirm delete' }));
  await waitFor(() => expect(API.delete).toHaveBeenCalledWith('/api/products/p1'));
  expect(await screen.findByText(/clay bowl was deleted/i)).toBeInTheDocument();
});

test('store owner adds a product through the shared products API', async () => {
  useAuth.mockReturnValue({ user:{ ...owner, mustChangePassword:false }, updateUser:vi.fn() });
  API.get.mockImplementation(url => Promise.resolve({ data: url === '/api/products/categories' ? ['Home'] : [] }));
  API.post.mockResolvedValue({ data:{ ...product, _id:'p2', name:'Wool rug' } });
  renderStore('/admin/add');

  fireEvent.change(screen.getByLabelText(/product name/i), { target:{ value:'Wool rug' } });
  fireEvent.change(screen.getByLabelText(/^category/i), { target:{ value:'Home' } });
  fireEvent.change(screen.getByLabelText(/price \(pkr\)/i), { target:{ value:'4000' } });
  fireEvent.change(screen.getByLabelText(/price \(usd\)/i), { target:{ value:'15' } });
  fireEvent.change(screen.getByLabelText(/^stock/i), { target:{ value:'5' } });
  fireEvent.click(screen.getByRole('button', { name:'Publish product' }));
  await waitFor(() => expect(API.post).toHaveBeenCalled());
  const [url, body] = API.post.mock.calls[0];
  expect(url).toBe('/api/products');
  expect(body.get('name')).toBe('Wool rug');
  expect(body.get('store')).toBeNull();
});

test('main admin creates a store owner and sees the generated login once', async () => {
  API.get.mockResolvedValue({ data:{ stores:[{ key:'main', id:null, name:'IndusCart (main store)', isActive:true, owner:null, products:10, netSales:50000, salesChange:10, orders:12, returnRate:2, outOfStock:0, lowStock:1 }] } });
  API.post.mockResolvedValue({ data:{ store:{ _id:'s1', name:'Craft House' }, credentials:{ username:'craft-house-4821', password:'Ab3!xYz7Qw9#mn', email:'owner@example.pk', loginUrl:'https://shop.test/admin/login' }, emailed:false } });
  render(<StoresPanel />);

  expect(await screen.findByText('IndusCart (main store)')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/owner's email/i), { target:{ value:'owner@example.pk' } });
  fireEvent.change(screen.getByLabelText(/store name/i), { target:{ value:'Craft House' } });
  fireEvent.click(screen.getByRole('button', { name:/create store and login/i }));
  await waitFor(() => expect(API.post).toHaveBeenCalledWith('/api/stores', { email:'owner@example.pk', storeName:'Craft House' }));
  const box = await screen.findByText(/login details for craft house/i);
  const details = within(box.closest('[role="status"]'));
  expect(details.getByText('craft-house-4821')).toBeInTheDocument();
  expect(details.getByText('Ab3!xYz7Qw9#mn')).toBeInTheDocument();
  expect(details.getByText(/send these to the owner yourself/i)).toBeInTheDocument();
});
