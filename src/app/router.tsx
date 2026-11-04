import type { ComponentType } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';
import { HydrateFallback, NotFoundPage, RouteErrorPage } from './ErrorPages';

const lazyDefault = (load: () => Promise<{ default: ComponentType }>) => () =>
  load().then((m) => ({ Component: m.default }));

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Outlet,
    ErrorBoundary: RouteErrorPage,
    HydrateFallback,
    children: [
      { index: true, lazy: lazyDefault(() => import('@/features/candidate/LoginRoute')) },
      { path: 'check', lazy: lazyDefault(() => import('@/features/candidate/SystemCheckRoute')) },
      { path: 'instructions', lazy: lazyDefault(() => import('@/features/candidate/InstructionsRoute')) },
      // The workspace bundle (Monaco) is large; it loads only when the test starts.
      { path: 'test', lazy: lazyDefault(() => import('@/features/workspace/WorkspaceRoute')) },
      { path: 'submitted', lazy: lazyDefault(() => import('@/features/candidate/SubmittedRoute')) },
      { path: 'admin/*', lazy: lazyDefault(() => import('@/features/admin/AdminRoute')) },
      { path: 'styleguide', lazy: lazyDefault(() => import('@/features/styleguide/StyleGuideRoute')) },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
