import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import App from './App';

// Scaffold smoke test: proves the router, TanStack Query provider, and
// Tailwind-styled placeholder page render together without errors.
describe('App', () => {
  it('renders the placeholder home page', () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Movie Library' })).toBeInTheDocument();
  });
});
