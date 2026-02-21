import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommunicationsService } from '../../services/communications.service';
import { WorkflowsFiltersComponent } from '../../components/workflows-filters/workflows-filters.component';
import { WorkflowCardComponent } from '../../components/workflow-card/workflow-card.component';
import { WorkflowFilterTab } from '../../models/communications.models';

@Component({
  selector: 'app-workflows-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WorkflowsFiltersComponent,
    WorkflowCardComponent
  ],
  template: `
    <div class="workflows-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Workflows de Cobranza</h1>
            <p>Automatiza secuencias de comunicaci&oacute;n para recuperar deuda de forma eficiente</p>
          </div>
          <div class="header-actions">
            <button type="button" class="btn-secondary" (click)="goToTemplates()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Plantillas
            </button>
            <button type="button" class="btn-primary" (click)="createWorkflow()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Crear Workflow
            </button>
          </div>
        </div>
      </header>

      <!-- Filters -->
      <section class="filters-section">
        <app-workflows-filters
          [activeTab]="commsService.workflowFilter()"
          [allCount]="commsService.workflowCounts().all"
          [activeCount]="commsService.workflowCounts().active"
          [draftCount]="commsService.workflowCounts().draft"
          [pausedCount]="commsService.workflowCounts().paused"
          [archivedCount]="commsService.workflowCounts().archived"
          (tabChange)="handleTabChange($event)"
        />
      </section>

      <!-- Loading State -->
      @if (commsService.isLoading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <span>Cargando workflows...</span>
        </div>
      }

      <!-- Workflow Cards Grid -->
      @if (!commsService.isLoading()) {
        @if (commsService.filteredWorkflows().length > 0) {
          <section class="workflows-grid">
            @for (workflow of commsService.filteredWorkflows(); track workflow.id) {
              <app-workflow-card
                [workflow]="workflow"
                (onEdit)="editWorkflow($event)"
                (onDelete)="deleteWorkflow($event)"
              />
            }
          </section>
        } @else {
          <!-- Empty State -->
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 3 21 3 21 8"></polyline>
                <line x1="4" y1="20" x2="21" y2="3"></line>
                <polyline points="21 16 21 21 16 21"></polyline>
                <line x1="15" y1="15" x2="21" y2="21"></line>
                <line x1="4" y1="4" x2="9" y2="9"></line>
              </svg>
            </div>
            <h3>No se encontraron workflows</h3>
            <p>No hay workflows que coincidan con el filtro seleccionado. Prueba con otro filtro o crea un nuevo workflow.</p>
            <button type="button" class="btn-primary" (click)="createWorkflow()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Crear Workflow
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .workflows-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 32px;
      min-height: 100%;
    }

    .page-header {
      margin-bottom: 8px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }

    .header-text h1 {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px 0;
    }

    .header-text p {
      font-size: 15px;
      color: #6B7280;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn-primary,
    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: #3B82F6;
      color: white;
      border: none;
    }

    .btn-primary:hover {
      background: #2563EB;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #E5E7EB;
    }

    .btn-secondary:hover {
      background: #F9FAFB;
      border-color: #D1D5DB;
    }

    .filters-section {
      width: 100%;
    }

    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 48px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #E5E7EB;
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-overlay span {
      font-size: 14px;
      color: #6B7280;
    }

    .workflows-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 64px 32px;
      background: white;
      border: 1px dashed #D1D5DB;
      border-radius: 12px;
      text-align: center;
    }

    .empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #F3F4F6;
      color: #9CA3AF;
      margin-bottom: 8px;
    }

    .empty-state h3 {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }

    .empty-state p {
      font-size: 14px;
      color: #6B7280;
      margin: 0 0 8px 0;
      max-width: 400px;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .workflows-page {
        padding: 20px;
      }

      .header-content {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions button {
        flex: 1;
        justify-content: center;
      }

      .workflows-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WorkflowsListComponent implements OnInit {
  protected readonly commsService = inject(CommunicationsService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.commsService.loadWorkflows();
  }

  handleTabChange(tab: WorkflowFilterTab): void {
    this.commsService.setWorkflowFilter(tab);
  }

  goToTemplates(): void {
    this.router.navigate(['../plantillas'], { relativeTo: this.route });
  }

  createWorkflow(): void {
    this.router.navigate(['nuevo'], { relativeTo: this.route });
  }

  editWorkflow(id: string): void {
    this.router.navigate([id], { relativeTo: this.route });
  }

  deleteWorkflow(id: string): void {
    this.commsService.deleteWorkflow(id);
  }

  private get route() {
    return this._route;
  }

  private readonly _route = inject(ActivatedRoute);
}
