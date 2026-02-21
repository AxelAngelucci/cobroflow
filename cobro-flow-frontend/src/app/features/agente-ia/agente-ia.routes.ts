import { Routes } from '@angular/router';

export const agenteIaRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/agente-ia-dashboard/agente-ia-dashboard.component').then(
        m => m.AgenteIaDashboardComponent
      )
  },
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./pages/configuracion/configuracion.component').then(
        m => m.ConfiguracionComponent
      )
  },
  {
    path: 'personalidad',
    loadComponent: () =>
      import('./pages/personalidad/personalidad.component').then(
        m => m.PersonalidadComponent
      )
  },
  {
    path: 'conversaciones',
    loadComponent: () =>
      import('./pages/conversaciones/conversaciones.component').then(
        m => m.ConversacionesComponent
      )
  },
  {
    path: 'entrenamiento',
    loadComponent: () =>
      import('./pages/entrenamiento/entrenamiento.component').then(
        m => m.EntrenamientoComponent
      )
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/analytics/analytics.component').then(
        m => m.AnalyticsComponent
      )
  }
];
