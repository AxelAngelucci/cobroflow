import { Routes } from '@angular/router';

export const campaignsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/campaigns-list/campaigns-list.component').then(
        m => m.CampaignsListComponent
      )
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./pages/campaign-create/campaign-create.component').then(
        m => m.CampaignCreateComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/campaign-create/campaign-create.component').then(
        m => m.CampaignCreateComponent
      )
  }
];
