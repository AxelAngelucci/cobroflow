import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientsFilter, RiskLevel, InvoiceStatus } from '../../models/clients.models';

@Component({
  selector: 'app-clients-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="filters-container">
      <!-- Search -->
      <div class="search-wrapper">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="search"
          class="search-input"
          placeholder="Buscar por nombre, email, CUIT..."
          [ngModel]="searchValue()"
          (ngModelChange)="onSearchChange($event)"
          aria-label="Buscar clientes"
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

      <!-- Filter buttons -->
      <div class="filter-group">
        <!-- Status filter -->
        <div class="filter-dropdown">
          <button
            type="button"
            class="filter-btn"
            [class.active]="statusFilter() !== 'all'"
            (click)="toggleStatusDropdown()"
            aria-haspopup="listbox"
            [attr.aria-expanded]="showStatusDropdown()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path>
            </svg>
            Estado
            @if (statusFilter() !== 'all') {
              <span class="filter-badge">1</span>
            }
          </button>
          @if (showStatusDropdown()) {
            <div class="dropdown-menu" role="listbox">
              @for (option of statusOptions; track option.value) {
                <button
                  type="button"
                  class="dropdown-item"
                  [class.selected]="statusFilter() === option.value"
                  (click)="selectStatus(option.value)"
                  role="option"
                >
                  {{ option.label }}
                  @if (statusFilter() === option.value) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  }
                </button>
              }
            </div>
          }
        </div>

        <!-- Risk level filter -->
        <div class="filter-dropdown">
          <button
            type="button"
            class="filter-btn"
            [class.active]="riskFilter() !== 'all'"
            (click)="toggleRiskDropdown()"
            aria-haspopup="listbox"
            [attr.aria-expanded]="showRiskDropdown()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Riesgo
            @if (riskFilter() !== 'all') {
              <span class="filter-badge">1</span>
            }
          </button>
          @if (showRiskDropdown()) {
            <div class="dropdown-menu" role="listbox">
              @for (option of riskOptions; track option.value) {
                <button
                  type="button"
                  class="dropdown-item"
                  [class.selected]="riskFilter() === option.value"
                  (click)="selectRisk(option.value)"
                  role="option"
                >
                  @if (option.color) {
                    <span class="risk-dot" [style.background-color]="option.color"></span>
                  }
                  {{ option.label }}
                  @if (riskFilter() === option.value) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  }
                </button>
              }
            </div>
          }
        </div>

        <!-- Tags filter -->
        @if (availableTags().length > 0) {
          <div class="filter-dropdown">
            <button
              type="button"
              class="filter-btn"
              [class.active]="selectedTags().length > 0"
              (click)="toggleTagsDropdown()"
              aria-haspopup="listbox"
              [attr.aria-expanded]="showTagsDropdown()"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              Tags
              @if (selectedTags().length > 0) {
                <span class="filter-badge">{{ selectedTags().length }}</span>
              }
            </button>
            @if (showTagsDropdown()) {
              <div class="dropdown-menu" role="listbox">
                @for (tag of availableTags(); track tag) {
                  <button
                    type="button"
                    class="dropdown-item"
                    [class.selected]="selectedTags().includes(tag)"
                    (click)="toggleTag(tag)"
                    role="option"
                  >
                    {{ tag }}
                    @if (selectedTags().includes(tag)) {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    }
                  </button>
                }
              </div>
            }
          </div>
        }

        <!-- Sort -->
        <div class="filter-dropdown">
          <button
            type="button"
            class="filter-btn"
            (click)="toggleSortDropdown()"
            aria-haspopup="listbox"
            [attr.aria-expanded]="showSortDropdown()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="9" x2="20" y2="9"></line>
              <line x1="4" y1="15" x2="14" y2="15"></line>
              <line x1="4" y1="21" x2="8" y2="21"></line>
            </svg>
            Ordenar
          </button>
          @if (showSortDropdown()) {
            <div class="dropdown-menu" role="listbox">
              @for (option of sortOptions; track option.value) {
                <button
                  type="button"
                  class="dropdown-item"
                  [class.selected]="sortBy() === option.value"
                  (click)="selectSort(option.value)"
                  role="option"
                >
                  {{ option.label }}
                  @if (sortBy() === option.value) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  }
                </button>
              }
            </div>
          }
        </div>

        <!-- Clear all filters -->
        @if (hasActiveFilters()) {
          <button
            type="button"
            class="clear-filters-btn"
            (click)="clearAllFilters()"
          >
            Limpiar filtros
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .filters-container {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-wrapper {
      position: relative;
      flex: 1;
      min-width: 280px;
      max-width: 400px;
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
      padding: 10px 40px 10px 40px;
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

    .filter-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-dropdown {
      position: relative;
    }

    .filter-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-btn:hover {
      background: #F9FAFB;
      border-color: #D1D5DB;
    }

    .filter-btn.active {
      background: #EFF6FF;
      border-color: #3B82F6;
      color: #1D4ED8;
    }

    .filter-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: #3B82F6;
      color: white;
      border-radius: 9px;
      font-size: 11px;
      font-weight: 600;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      min-width: 180px;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 50;
      overflow: hidden;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 10px 12px;
      background: transparent;
      border: none;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      transition: background 0.15s ease;
      text-align: left;
    }

    .dropdown-item:hover {
      background: #F9FAFB;
    }

    .dropdown-item.selected {
      background: #EFF6FF;
      color: #1D4ED8;
    }

    .risk-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
    }

    .clear-filters-btn {
      padding: 8px 12px;
      background: transparent;
      border: none;
      font-size: 14px;
      color: #6B7280;
      cursor: pointer;
      text-decoration: underline;
    }

    .clear-filters-btn:hover {
      color: #374151;
    }
  `],
  host: {
    '(document:click)': 'closeAllDropdowns($event)'
  }
})
export class ClientsFiltersComponent {
  // Inputs
  currentFilter = input<ClientsFilter>({});
  availableTags = input<string[]>([]);

  // Outputs
  onFilterChange = output<Partial<ClientsFilter>>();

  // Local state
  searchValue = signal('');
  statusFilter = signal<InvoiceStatus | 'all'>('all');
  riskFilter = signal<RiskLevel | 'all'>('all');
  selectedTags = signal<string[]>([]);
  sortBy = signal<ClientsFilter['sortBy']>('name');

  showStatusDropdown = signal(false);
  showRiskDropdown = signal(false);
  showTagsDropdown = signal(false);
  showSortDropdown = signal(false);

  statusOptions = [
    { value: 'all' as const, label: 'Todos' },
    { value: 'paid' as const, label: 'Al día' },
    { value: 'pending' as const, label: 'Pendiente' },
    { value: 'overdue' as const, label: 'Vencido' }
  ];

  riskOptions = [
    { value: 'all' as const, label: 'Todos', color: null },
    { value: 'low' as const, label: 'Bajo (0-29)', color: '#22C55E' },
    { value: 'medium' as const, label: 'Medio (30-59)', color: '#F59E0B' },
    { value: 'high' as const, label: 'Alto (60-79)', color: '#F97316' },
    { value: 'critical' as const, label: 'Crítico (80+)', color: '#EF4444' }
  ];

  sortOptions = [
    { value: 'name' as const, label: 'Nombre' },
    { value: 'totalDebt' as const, label: 'Deuda Total' },
    { value: 'overdueAmount' as const, label: 'Monto Vencido' },
    { value: 'riskScore' as const, label: 'Riesgo' },
    { value: 'createdAt' as const, label: 'Fecha de Alta' }
  ];

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.emitFilter({ search: value });
  }

  clearSearch(): void {
    this.searchValue.set('');
    this.emitFilter({ search: '' });
  }

  toggleStatusDropdown(): void {
    this.closeOtherDropdowns('status');
    this.showStatusDropdown.update(v => !v);
  }

  toggleRiskDropdown(): void {
    this.closeOtherDropdowns('risk');
    this.showRiskDropdown.update(v => !v);
  }

  toggleTagsDropdown(): void {
    this.closeOtherDropdowns('tags');
    this.showTagsDropdown.update(v => !v);
  }

  toggleSortDropdown(): void {
    this.closeOtherDropdowns('sort');
    this.showSortDropdown.update(v => !v);
  }

  selectStatus(value: InvoiceStatus | 'all'): void {
    this.statusFilter.set(value);
    this.showStatusDropdown.set(false);
    this.emitFilter({ status: value });
  }

  selectRisk(value: RiskLevel | 'all'): void {
    this.riskFilter.set(value);
    this.showRiskDropdown.set(false);
    this.emitFilter({ riskLevel: value });
  }

  toggleTag(tag: string): void {
    this.selectedTags.update(tags => {
      const newTags = tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag];
      this.emitFilter({ tags: newTags });
      return newTags;
    });
  }

  selectSort(value: ClientsFilter['sortBy']): void {
    this.sortBy.set(value);
    this.showSortDropdown.set(false);
    this.emitFilter({ sortBy: value });
  }

  hasActiveFilters(): boolean {
    return (
      this.searchValue() !== '' ||
      this.statusFilter() !== 'all' ||
      this.riskFilter() !== 'all' ||
      this.selectedTags().length > 0
    );
  }

  clearAllFilters(): void {
    this.searchValue.set('');
    this.statusFilter.set('all');
    this.riskFilter.set('all');
    this.selectedTags.set([]);
    this.emitFilter({
      search: '',
      status: 'all',
      riskLevel: 'all',
      tags: []
    });
  }

  private emitFilter(filter: Partial<ClientsFilter>): void {
    this.onFilterChange.emit(filter);
  }

  private closeOtherDropdowns(except: string): void {
    if (except !== 'status') this.showStatusDropdown.set(false);
    if (except !== 'risk') this.showRiskDropdown.set(false);
    if (except !== 'tags') this.showTagsDropdown.set(false);
    if (except !== 'sort') this.showSortDropdown.set(false);
  }

  closeAllDropdowns(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown')) {
      this.showStatusDropdown.set(false);
      this.showRiskDropdown.set(false);
      this.showTagsDropdown.set(false);
      this.showSortDropdown.set(false);
    }
  }
}
