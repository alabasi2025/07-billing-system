import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Dynamic routes - use client-side rendering
  {
    path: 'customers/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'customers/:id/edit',
    renderMode: RenderMode.Client,
  },
  {
    path: 'meters/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'invoices/:id',
    renderMode: RenderMode.Client,
  },
  // Static routes - prerender
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
