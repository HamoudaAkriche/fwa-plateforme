import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const superAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }

  if (!auth.isSuperAdmin()) {
    router.navigateByUrl('/subscriptions');
    return false;
  }

  return true;
};