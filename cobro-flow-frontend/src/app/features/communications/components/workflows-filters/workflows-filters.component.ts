import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { WorkflowFilterTab } from '../../models/communications.models';

@Component({
  selector: 'app-workflows-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters-container">
      <div class="tabs">
        @for (tab of tabs; track tab.value) {
          <button
            type="button"
            class="tab-pill"
            [class.active]="activeTab() === tab.value"
            (click)="selectTab(tab.value)"
          >
            {{ tab.label }}
            <span class="tab-count" [class.active-count]="activeTab() === tab.value">
              {{ getCount(tab.value) }}
            </span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .filters-container {
      display: flex;
      align-items: center;
    }

    .tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tab-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tab-pill:hover {
      background: #F3F4F6;
      border-color: #D1D5DB;
    }

    .tab-pill.active {
      background: #3B82F6;
      border-color: #3B82F6;
      color: white;
    }

    .tab-pill.active:hover {
      background: #2563EB;
      border-color: #2563EB;
    }

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: #F3F4F6;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
    }

    .tab-count.active-count {
      background: rgba(255, 255, 255, 0.25);
      color: white;
    }

    @media (max-width: 768px) {
      .tabs {
        overflow-x: auto;
        padding-bottom: 4px;
      }

      .tab-pill {
        white-space: nowrap;
      }
    }
  `]
})
export class WorkflowsFiltersComponent {
  activeTab = input<WorkflowFilterTab>('all');
  allCount = input(0);
  activeCount = input(0);
  draftCount = input(0);
  pausedCount = input(0);
  archivedCount = input(0);

  tabChange = output<WorkflowFilterTab>();

  tabs: { value: WorkflowFilterTab; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'draft', label: 'Borradores' },
    { value: 'paused', label: 'Pausados' },
    { value: 'archived', label: 'Archivados' }
  ];

  getCount(tab: WorkflowFilterTab): number {
    switch (tab) {
      case 'all': return this.allCount();
      case 'active': return this.activeCount();
      case 'draft': return this.draftCount();
      case 'paused': return this.pausedCount();
      case 'archived': return this.archivedCount();
    }
  }

  selectTab(tab: WorkflowFilterTab): void {
    this.tabChange.emit(tab);
  }
}
