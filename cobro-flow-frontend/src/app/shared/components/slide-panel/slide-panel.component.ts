import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';

@Component({
  selector: 'app-slide-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="panel-overlay" (click)="handleOverlayClick()" (keydown.escape)="close()">
        <aside
          class="panel"
          [class.panel-sm]="size() === 'sm'"
          [class.panel-md]="size() === 'md'"
          [class.panel-lg]="size() === 'lg'"
          [class.panel-xl]="size() === 'xl'"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <header class="panel-header">
            <div class="panel-title-section">
              @if (showBackButton()) {
                <button
                  type="button"
                  class="back-btn"
                  (click)="onBack.emit()"
                  aria-label="Volver"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              }
              <h2 [id]="titleId">{{ title() }}</h2>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="close()"
              aria-label="Cerrar panel"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </header>

          <!-- Content -->
          <div class="panel-content">
            <ng-content></ng-content>
          </div>

          <!-- Footer (optional) -->
          @if (showFooter()) {
            <footer class="panel-footer">
              <ng-content select="[panel-footer]"></ng-content>
            </footer>
          }
        </aside>
      </div>
    }
  `,
  styles: [`
    .panel-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .panel {
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease;
      z-index: 1001;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .panel-sm { width: 400px; }
    .panel-md { width: 500px; }
    .panel-lg { width: 600px; }
    .panel-xl { width: 800px; }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #E5E7EB;
      flex-shrink: 0;
    }

    .panel-title-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .panel-title-section h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #111827;
    }

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.15s;
    }

    .back-btn:hover {
      background: #F3F4F6;
      color: #374151;
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.15s;
    }

    .close-btn:hover {
      background: #F3F4F6;
      color: #374151;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .panel-footer {
      padding: 16px 24px;
      border-top: 1px solid #E5E7EB;
      background: #F9FAFB;
      flex-shrink: 0;
    }

    @media (max-width: 640px) {
      .panel {
        width: 100% !important;
      }
    }
  `],
  host: {
    '(document:keydown.escape)': 'close()'
  }
})
export class SlidePanelComponent {
  // Inputs
  isOpen = input.required<boolean>();
  title = input.required<string>();
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  showFooter = input(false);
  showBackButton = input(false);
  closeOnOverlayClick = input(true);

  // Outputs
  onClose = output<void>();
  onBack = output<void>();

  titleId = `panel-title-${Math.random().toString(36).substr(2, 9)}`;

  constructor() {
    // Handle body scroll lock
    effect(() => {
      if (this.isOpen()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  close(): void {
    this.onClose.emit();
  }

  handleOverlayClick(): void {
    if (this.closeOnOverlayClick()) {
      this.close();
    }
  }
}
