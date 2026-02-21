import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-clients-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagination-container">
      <div class="pagination-info">
        Mostrando {{ startItem() }}-{{ endItem() }} de {{ total() }} clientes
      </div>

      <div class="pagination-controls">
        <button
          type="button"
          class="page-btn"
          [disabled]="currentPage() === 1"
          (click)="goToPage(1)"
          aria-label="Primera página"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="11 17 6 12 11 7"></polyline>
            <polyline points="18 17 13 12 18 7"></polyline>
          </svg>
        </button>

        <button
          type="button"
          class="page-btn"
          [disabled]="currentPage() === 1"
          (click)="goToPage(currentPage() - 1)"
          aria-label="Página anterior"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        @for (page of visiblePages(); track page) {
          @if (page === '...') {
            <span class="page-ellipsis">...</span>
          } @else {
            <button
              type="button"
              class="page-btn page-number"
              [class.active]="page === currentPage()"
              (click)="goToPage(+page)"
              [attr.aria-current]="page === currentPage() ? 'page' : null"
            >
              {{ page }}
            </button>
          }
        }

        <button
          type="button"
          class="page-btn"
          [disabled]="currentPage() === totalPages()"
          (click)="goToPage(currentPage() + 1)"
          aria-label="Página siguiente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <button
          type="button"
          class="page-btn"
          [disabled]="currentPage() === totalPages()"
          (click)="goToPage(totalPages())"
          aria-label="Última página"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
        </button>
      </div>

      <div class="page-size-selector">
        <label for="pageSize">Por página:</label>
        <select
          id="pageSize"
          [value]="pageSize()"
          (change)="onPageSizeChange($event)"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      flex-wrap: wrap;
      gap: 16px;
    }

    .pagination-info {
      font-size: 14px;
      color: #6B7280;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      padding: 0 8px;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .page-btn:hover:not(:disabled) {
      background: #F9FAFB;
      border-color: #D1D5DB;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-btn.active {
      background: #3B82F6;
      border-color: #3B82F6;
      color: white;
    }

    .page-btn:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }

    .page-ellipsis {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      color: #6B7280;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .page-size-selector label {
      font-size: 14px;
      color: #6B7280;
    }

    .page-size-selector select {
      padding: 6px 28px 6px 12px;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      font-size: 14px;
      color: #374151;
      background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 8px center;
      appearance: none;
      cursor: pointer;
    }

    .page-size-selector select:focus {
      outline: none;
      border-color: #3B82F6;
    }

    @media (max-width: 600px) {
      .pagination-container {
        justify-content: center;
      }

      .pagination-info {
        width: 100%;
        text-align: center;
      }
    }
  `]
})
export class ClientsPaginationComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageSize = input.required<number>();
  total = input.required<number>();

  onPageChange = output<number>();
  onPageSizeChange$ = output<number>();

  startItem = computed(() => {
    if (this.total() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endItem = computed(() => {
    const end = this.currentPage() * this.pageSize();
    return Math.min(end, this.total());
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      pages.push(total);
    }

    return pages;
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.onPageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.onPageSizeChange$.emit(Number(select.value));
  }
}
