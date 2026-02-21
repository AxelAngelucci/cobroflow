import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommunicationsService } from '../../services/communications.service';
import { WorkflowStepListComponent } from '../../components/workflow-step-list/workflow-step-list.component';
import { WorkflowStepEditorComponent } from '../../components/workflow-step-editor/workflow-step-editor.component';
import { CollectionWorkflow, WorkflowStep } from '../../models/communications.models';

@Component({
  selector: 'app-workflow-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, WorkflowStepListComponent, WorkflowStepEditorComponent],
  template: `
    <div class="editor-page">
      <!-- Sticky Header -->
      <header class="page-header">
        <div class="header-left">
          <button type="button" class="back-btn" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <input
            type="text"
            class="workflow-name-input"
            [ngModel]="workflow()?.name ?? ''"
            (ngModelChange)="updateWorkflowName($event)"
            placeholder="Nombre del workflow"
          />
          <span class="editing-badge">Editando</span>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-secondary" (click)="testWorkflow()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Probar
          </button>
          <button type="button" class="btn-primary" (click)="saveWorkflow()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Guardar Cambios
          </button>
        </div>
      </header>

      <!-- Two-column layout -->
      <div class="editor-body">
        <div class="left-panel">
          <app-workflow-step-list
            [steps]="workflowSteps()"
            [selectedStepId]="selectedStepId()"
            (stepSelect)="selectStep($event)"
            (addStep)="addNewStep()"
            (deleteStep)="deleteStep($event)"
            (moveStepUp)="moveStep($event, -1)"
            (moveStepDown)="moveStep($event, 1)"
          />
        </div>
        <div class="right-panel">
          <app-workflow-step-editor
            [step]="selectedStep()"
            [templates]="service.templates()"
            (stepChange)="handleStepChange($event)"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editor-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding: 16px 32px;
      background: white;
      border-bottom: 1px solid #E5E7EB;
      flex-wrap: wrap;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      background: transparent;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      cursor: pointer;
      color: #6B7280;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .back-btn:hover {
      background: #F9FAFB;
      color: #374151;
    }

    .workflow-name-input {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      outline: none;
      padding: 4px 0;
      min-width: 0;
      flex: 1;
      transition: border-color 0.15s ease;
    }

    .workflow-name-input:focus {
      border-bottom-color: #3B82F6;
    }

    .workflow-name-input::placeholder {
      color: #9CA3AF;
      font-weight: 500;
    }

    .editing-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      background: #FEF3C7;
      color: #92400E;
      font-size: 12px;
      font-weight: 600;
      border-radius: 20px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }

    .btn-primary,
    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
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

    /* Two-column body */
    .editor-body {
      display: flex;
      flex: 1;
      min-height: 0;
      gap: 24px;
      padding: 24px 32px;
      overflow: hidden;
    }

    .left-panel {
      width: 350px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .right-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      min-width: 0;
    }

    @media (max-width: 900px) {
      .page-header {
        padding: 12px 20px;
      }

      .editor-body {
        flex-direction: column;
        padding: 20px;
        overflow-y: auto;
      }

      .left-panel {
        width: 100%;
      }
    }
  `]
})
export class WorkflowEditorComponent implements OnInit {
  readonly service = inject(CommunicationsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly workflow = signal<CollectionWorkflow | null>(null);
  readonly selectedStepId = signal<string | null>(null);

  readonly workflowSteps = computed(() => {
    const wf = this.workflow();
    if (!wf) return [];
    return [...wf.steps].sort((a, b) => a.stepOrder - b.stepOrder);
  });

  readonly selectedStep = computed(() => {
    const id = this.selectedStepId();
    if (!id) return null;
    const wf = this.workflow();
    return wf?.steps.find(s => s.id === id) ?? null;
  });

  ngOnInit(): void {
    this.service.loadWorkflows();
    this.service.loadTemplates();

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      // Editing an existing workflow - load after data is ready
      setTimeout(() => {
        const existing = this.service.getWorkflowById(id);
        if (existing) {
          this.workflow.set({ ...existing });
          if (existing.steps.length > 0) {
            this.selectedStepId.set(existing.steps[0].id);
          }
        }
      }, 400);
    } else {
      // New workflow (route: workflows/nuevo)
      const newWorkflow: CollectionWorkflow = {
        id: crypto.randomUUID(),
        organizationId: 'org1',
        name: '',
        status: 'draft',
        totalExecutions: 0,
        steps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.workflow.set(newWorkflow);
    }
  }

  updateWorkflowName(name: string): void {
    const wf = this.workflow();
    if (!wf) return;
    this.workflow.set({ ...wf, name });
  }

  selectStep(stepId: string): void {
    this.selectedStepId.set(stepId);
  }

  addNewStep(): void {
    const wf = this.workflow();
    if (!wf) return;

    const nextOrder = wf.steps.length + 1;
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      workflowId: wf.id,
      stepOrder: nextOrder,
      name: `Paso ${nextOrder}`,
      channel: 'email',
      delayDays: 0,
      delayHours: 0,
      conditionType: 'none',
      aiEnabled: false,
      createdAt: new Date(),
    };

    this.workflow.set({
      ...wf,
      steps: [...wf.steps, newStep],
    });
    this.selectedStepId.set(newStep.id);
  }

  deleteStep(stepId: string): void {
    const wf = this.workflow();
    if (!wf) return;

    const remaining = wf.steps
      .filter(s => s.id !== stepId)
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((s, i) => ({ ...s, stepOrder: i + 1 }));

    this.workflow.set({ ...wf, steps: remaining });

    if (this.selectedStepId() === stepId) {
      this.selectedStepId.set(remaining.length > 0 ? remaining[0].id : null);
    }
  }

  moveStep(stepId: string, direction: number): void {
    const wf = this.workflow();
    if (!wf) return;

    const sorted = [...wf.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    const idx = sorted.findIndex(s => s.id === stepId);
    if (idx < 0) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    // Swap stepOrder values
    const reordered = sorted.map((s, i) => {
      if (i === idx) return { ...s, stepOrder: sorted[targetIdx].stepOrder };
      if (i === targetIdx) return { ...s, stepOrder: sorted[idx].stepOrder };
      return s;
    });

    this.workflow.set({ ...wf, steps: reordered });
  }

  handleStepChange(updatedStep: WorkflowStep): void {
    const wf = this.workflow();
    if (!wf) return;

    this.workflow.set({
      ...wf,
      steps: wf.steps.map(s => s.id === updatedStep.id ? updatedStep : s),
    });
  }

  testWorkflow(): void {
    console.log('Testing workflow:', this.workflow());
  }

  saveWorkflow(): void {
    const wf = this.workflow();
    if (!wf) return;
    console.log('Saving workflow:', wf);
    // In the future, call the service to persist
    this.goBack();
  }

  goBack(): void {
    this.router.navigate(['/dashboard/comunicaciones/workflows']);
  }
}
