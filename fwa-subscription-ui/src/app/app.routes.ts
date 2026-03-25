import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { superAdminGuard } from './guards/super-admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
  },
  {
    path: 'subscriptions',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/subscriptions/subscriptions').then(m => m.Subscriptions),
  },
  {
    path: 'admin/agents',
    canActivate: [superAdminGuard],
    loadComponent: () => import('./pages/admin-agents/admin-agents').then(m => m.AdminAgents),
  },
  { path: '', redirectTo: 'subscriptions', pathMatch: 'full' },
  { path: '**', redirectTo: 'subscriptions' }
];