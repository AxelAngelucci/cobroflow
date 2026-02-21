import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard that protects routes requiring authentication.
 * Redirects to login if user is not authenticated.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const currentUrl = router.routerState.snapshot.url;
  
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: currentUrl }
  });
};

/**
 * Guard that redirects authenticated users away from auth pages.
 * Used for login, register pages to redirect to dashboard if already logged in.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // User is already authenticated, redirect to dashboard
  return router.createUrlTree(['/dashboard']);
};
