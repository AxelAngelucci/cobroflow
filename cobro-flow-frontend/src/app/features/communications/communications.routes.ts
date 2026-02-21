import { Routes } from '@angular/router';

export const communicationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/communications-hub/communications-hub.component').then(
        m => m.CommunicationsHubComponent
      )
  },
  {
    path: 'workflows',
    loadComponent: () =>
      import('./pages/workflows-list/workflows-list.component').then(
        m => m.WorkflowsListComponent
      )
  },
  {
    path: 'workflows/nuevo',
    loadComponent: () =>
      import('./pages/workflow-editor/workflow-editor.component').then(
        m => m.WorkflowEditorComponent
      )
  },
  {
    path: 'workflows/:id',
    loadComponent: () =>
      import('./pages/workflow-editor/workflow-editor.component').then(
        m => m.WorkflowEditorComponent
      )
  },
  {
    path: 'plantillas',
    loadComponent: () =>
      import('./pages/templates-list/templates-list.component').then(
        m => m.TemplatesListComponent
      )
  }
];
