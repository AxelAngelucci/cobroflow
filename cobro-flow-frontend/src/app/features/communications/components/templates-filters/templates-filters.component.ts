import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TemplateFilterTab } from '../../models/communications.models';

@Component({
  selector: 'app-templates-filters',
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
              {{ tab.value === 'all' ? allCount() :
                 tab.value === 'email' ? emailCount() :
                 tab.value === 'whatsapp' ? whatsappCount() :
                 tab.value === 'sms' ? smsCount() :
                 callCount() }}
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
export class TemplatesFiltersComponent {
  // Inputs
  activeTab = input<TemplateFilterTab>('all');
  allCount = input(0);
  emailCount = input(0);
  whatsappCount = input(0);
  smsCount = input(0);
  callCount = input(0);

  // Outputs
  tabChange = output<TemplateFilterTab>();

  tabs: { value: TemplateFilterTab; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'email', label: 'Email' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'sms', label: 'SMS' },
    { value: 'call', label: 'Llamadas' }
  ];

  selectTab(tab: TemplateFilterTab): void {
    this.tabChange.emit(tab);
  }
}
