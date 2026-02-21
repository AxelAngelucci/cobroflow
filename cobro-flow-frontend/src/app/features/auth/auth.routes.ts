import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
        title: 'Iniciar Sesión - CobroFlow',
        canActivate: [guestGuard]
      },
      {
        path: 'registro',
        loadComponent: () => import('./register-step1/register-step1.component').then(m => m.RegisterStep1Component),
        title: 'Crear Cuenta - CobroFlow'
      },
      {
        path: 'registro/empresa',
        loadComponent: () => import('./register-step2/register-step2.component').then(m => m.RegisterStep2Component),
        title: 'Información de Empresa - CobroFlow'
      },
      {
        path: 'recuperar-contrasena',
        loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'Recuperar Contraseña - CobroFlow'
      },
      // TODO: Re-enable when email verification is ready
      // {
      //   path: 'verificar-email',
      //   loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
      //   title: 'Verificar Email - CobroFlow'
      // },
      {
        path: 'bienvenida',
        loadComponent: () => import('./welcome/welcome.component').then(m => m.WelcomeComponent),
        title: 'Bienvenida - CobroFlow'
      },
      {
        path: 'terms',
        loadComponent: () => import('./terms/terms.component').then(m => m.TermsComponent),
        title: 'Términos y Condiciones - CobroFlow'
      },
      {
        path: 'privacy',
        loadComponent: () => import('./privacy/privacy.component').then(m => m.PrivacyComponent),
        title: 'Política de Privacidad - CobroFlow'
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  }
];
