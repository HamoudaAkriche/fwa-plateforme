import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

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
  { path: '', redirectTo: 'subscriptions', pathMatch: 'full' },
  { path: '**', redirectTo: 'subscriptions' }
];