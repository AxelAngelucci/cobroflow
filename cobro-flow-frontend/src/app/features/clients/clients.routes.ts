import { Routes } from '@angular/router';

export const clientsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/clients-list/clients-list.component').then(
        m => m.ClientsListComponent
      )
  },
  {
    path: 'importar',
    loadComponent: () =>
      import('./pages/clients-import/clients-import.component').then(
        m => m.ClientsImportComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/client-detail/client-detail.component').then(
        m => m.ClientDetailComponent
      )
  },
  {
    path: ':id/facturas/:invoiceId',
    loadComponent: () =>
      import('./pages/invoice-detail/invoice-detail.component').then(
        m => m.InvoiceDetailComponent
      )
  }
];
