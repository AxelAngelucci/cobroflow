import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import {
  LucideAngularModule,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  ArrowLeft,
  ChevronDown,
  Check,
  Zap,
  ShieldCheck,
  Gift,
  Gauge,
  Bot,
  Headset,
  MailCheck,
  Pencil,
  Info,
  Rocket,
  Building2,
  X,
  Loader2
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    importProvidersFrom(
      LucideAngularModule.pick({
        Eye,
        EyeOff,
        Mail,
        KeyRound,
        ArrowLeft,
        ChevronDown,
        Check,
        Zap,
        ShieldCheck,
        Gift,
        Gauge,
        Bot,
        Headset,
        MailCheck,
        Pencil,
        Info,
        Rocket,
        Building2,
        X,
        Loader2
      })
    )
  ]
};
