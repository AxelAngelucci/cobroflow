import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CampaignFilterTab } from '../../models/campaigns.models';

@Component({
  selector: 'app-campaigns-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="filters-container">
      <!-- Tab pills -->
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
              {{ tab.value === 'all' ? allCount() :
                 tab.value === 'active' ? activeCount() :
                 tab.value === 'paused' ? pausedCount() :
                 finishedCount() }}
            </span>
          </button>
        }
      </div>

      <!-- Search -->
      <div class="search-wrapper">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="search"
          class="search-input"
          placeholder="Buscar campañas..."
          [ngModel]="searchValue()"
          (ngModelChange)="onSearchChange($event)"
          aria-label="Buscar campañas"
        />
        @if (searchValue()) {
          <button
            type="button"
            class="clear-btn"
            (click)="clearSearch()"
            aria-label="Limpiar búsqueda"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .filters-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .tabs {
      display: flex;
      gap: 8px;
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
      background: #F9FAFB;
      border-color: #D1D5DB;
    }

    .tab-pill.active {
      background: #3B82F6;
      border-color: #3B82F6;
      color: white;
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

    .search-wrapper {
      position: relative;
      min-width: 240px;
      max-width: 320px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #9CA3AF;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 8px 36px 8px 38px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.15s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-input::placeholder {
      color: #9CA3AF;
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      padding: 4px;
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      color: #9CA3AF;
    }

    .clear-btn:hover {
      background: #F3F4F6;
      color: #6B7280;
    }

    @media (max-width: 768px) {
      .filters-container {
        flex-direction: column;
        align-items: stretch;
      }

      .tabs {
        overflow-x: auto;
        padding-bottom: 4px;
      }

      .search-wrapper {
        max-width: none;
        min-width: 0;
      }
    }
  `]
})
export class CampaignsFiltersComponent {
  // Inputs
  activeTab = input<CampaignFilterTab>('all');
  allCount = input(0);
  activeCount = input(0);
  pausedCount = input(0);
  finishedCount = input(0);

  // Outputs
  onTabChange = output<CampaignFilterTab>();
  onSearchChange$ = output<string>();

  // Local state
  searchValue = signal('');

  tabs: { value: CampaignFilterTab; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'paused', label: 'Pausadas' },
    { value: 'finished', label: 'Finalizadas' }
  ];

  selectTab(tab: CampaignFilterTab): void {
    this.onTabChange.emit(tab);
  }

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.onSearchChange$.emit(value);
  }

  clearSearch(): void {
    this.searchValue.set('');
    this.onSearchChange$.emit('');
  }
}
