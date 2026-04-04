import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards';
import { DashboardLayoutComponent } from './dashboard-layout.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard-home/dashboard-home.component').then(
            m => m.DashboardHomeComponent
          )
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('../clients/clients.routes').then(m => m.clientsRoutes)
      },
      {
        path: 'cuentas',
        loadComponent: () =>
          import('./pages/dashboard-home/dashboard-home.component').then(
            m => m.DashboardHomeComponent
          )
        // TODO: Create CuentasComponent
      },
      {
        path: 'comunicaciones',
        loadChildren: () =>
          import('../communications/communications.routes').then(m => m.communicationsRoutes)
      },
      {
        path: 'campanas',
        loadChildren: () =>
          import('../campaigns/campaigns.routes').then(m => m.campaignsRoutes)
      },
      {
        path: 'agente-ia',
        loadChildren: () =>
          import('../agente-ia/agente-ia.routes').then(m => m.agenteIaRoutes)
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./pages/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./pages/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
      }
    ]
  }
];
