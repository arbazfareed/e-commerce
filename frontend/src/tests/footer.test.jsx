import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Footer from '../components/Footer';

describe('Global Footer Component', () => {
  it('renders branding and copyright with year 2026', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    expect(screen.getByText('IndusCart')).toBeInTheDocument();
    expect(screen.getByText('Valley')).toBeInTheDocument();
    expect(screen.getByText(/© 2026 IndusCart Valley\. Mindfully crafted rituals\. All rights reserved\./i)).toBeInTheDocument();
  });

  it('renders all footer navigation links', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /Editorial Rituals/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sustainability & Sourcing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Shipping & Returns/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact Concierge/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Terms of Service/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Privacy Policy/i })).toBeInTheDocument();
  });

  it('opens and closes modal when clicking on footer info links', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    // Click Sustainability & Sourcing
    fireEvent.click(screen.getByRole('button', { name: /Sustainability & Sourcing/i }));
    expect(screen.getByText(/Sustainability & Ethical Sourcing/i)).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(screen.queryByText(/Sustainability & Ethical Sourcing/i)).not.toBeInTheDocument();

    // Click Shipping & Returns
    fireEvent.click(screen.getByRole('button', { name: /Shipping & Returns/i }));
    expect(screen.getByText(/Free Expedited Shipping/i)).toBeInTheDocument();
  });
});
