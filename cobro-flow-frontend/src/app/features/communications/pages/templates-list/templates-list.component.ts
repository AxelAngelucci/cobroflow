import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommunicationsService } from '../../services/communications.service';
import { TemplatesFiltersComponent } from '../../components/templates-filters/templates-filters.component';
import { TemplateCardComponent } from '../../components/template-card/template-card.component';
import { TemplateFormPanelComponent } from '../../components/template-form-panel/template-form-panel.component';
import { TemplateFilterTab, MessageTemplate, ChannelType } from '../../models/communications.models';

@Component({
  selector: 'app-templates-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TemplatesFiltersComponent,
    TemplateCardComponent,
    TemplateFormPanelComponent,
  ],
  template: `
    <div class="templates-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Plantillas de Mensajes</h1>
            <p>Gestiona las plantillas para tus comunicaciones</p>
          </div>
          <div class="header-actions">
            <div class="search-wrapper">
              <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="search"
                class="search-input"
                placeholder="Buscar plantillas..."
                [ngModel]="searchValue()"
                (ngModelChange)="onSearchChange($event)"
                aria-label="Buscar plantillas"
              />
              @if (searchValue()) {
                <button
                  type="button"
                  class="clear-btn"
                  (click)="clearSearch()"
                  aria-label="Limpiar busqueda"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              }
            </div>
            <button type="button" class="btn-primary" (click)="openCreatePanel()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nueva Plantilla
            </button>
          </div>
        </div>
      </header>

      <!-- Filters -->
      <section class="filters-section">
        <app-templates-filters
          [activeTab]="commsService.templateFilter()"
          [allCount]="commsService.templateCounts().all"
          [emailCount]="commsService.templateCounts().email"
          [whatsappCount]="commsService.templateCounts().whatsapp"
          [smsCount]="commsService.templateCounts().sms"
          [callCount]="commsService.templateCounts().call"
          (tabChange)="handleTabChange($event)"
        />
      </section>

      <!-- Loading State -->
      @if (commsService.isLoading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <span>Cargando plantillas...</span>
        </div>
      }

      <!-- Template Cards Grid -->
      @if (!commsService.isLoading() && commsService.filteredTemplates().length > 0) {
        <section class="cards-grid">
          @for (tpl of commsService.filteredTemplates(); track tpl.id) {
            <app-template-card
              [template]="tpl"
              (onEdit)="handleEdit($event)"
              (onDelete)="handleDelete($event)"
            />
          }
        </section>
      }

      <!-- Empty state -->
      @if (!commsService.isLoading() && commsService.filteredTemplates().length === 0) {
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h3>No se encontraron plantillas</h3>
          <p>Ajusta los filtros o crea una nueva plantilla</p>
          <button type="button" class="btn-primary" (click)="openCreatePanel()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva Plantilla
          </button>
        </div>
      }

      <!-- Form Panel -->
      <app-template-form-panel
        [isOpen]="isPanelOpen()"
        [template]="editingTemplate()"
        (onClose)="closePanel()"
        (onSave)="handleSave($event)"
      />
    </div>
  `,
  styles: [`
    .templates-page {
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
      align-items: center;
      gap: 12px;
    }

    .search-wrapper {
      position: relative;
      min-width: 240px;
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
      padding: 10px 36px 10px 38px;
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

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      background: #3B82F6;
      color: white;
      border: none;
      white-space: nowrap;
    }

    .btn-primary:hover {
      background: #2563EB;
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

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
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
      border-radius: 12px;
      border: 1px solid #E5E7EB;
      text-align: center;
    }

    .empty-state h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #374151;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
      color: #9CA3AF;
    }

    @media (max-width: 1024px) {
      .cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .templates-page {
        padding: 20px;
      }

      .header-content {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }

      .search-wrapper {
        min-width: 0;
        width: 100%;
      }

      .btn-primary {
        width: 100%;
        justify-content: center;
      }

      .cards-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TemplatesListComponent implements OnInit {
  protected readonly commsService = inject(CommunicationsService);

  // Panel state
  isPanelOpen = signal(false);
  editingTemplate = signal<MessageTemplate | null>(null);

  // Search state
  searchValue = signal('');

  ngOnInit(): void {
    this.commsService.loadTemplates();
  }

  handleTabChange(tab: TemplateFilterTab): void {
    this.commsService.setTemplateFilter(tab);
  }

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.commsService.setTemplateSearch(value);
  }

  clearSearch(): void {
    this.searchValue.set('');
    this.commsService.setTemplateSearch('');
  }

  openCreatePanel(): void {
    this.editingTemplate.set(null);
    this.isPanelOpen.set(true);
  }

  handleEdit(templateId: string): void {
    const tpl = this.commsService.getTemplateById(templateId);
    if (tpl) {
      this.editingTemplate.set(tpl);
      this.isPanelOpen.set(true);
    }
  }

  handleDelete(templateId: string): void {
    this.commsService.deleteTemplate(templateId);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
    this.editingTemplate.set(null);
  }

  handleSave(data: { name: string; channel: ChannelType; subject: string; body: string; variables: string[] }): void {
    // TODO: call backend API to create/update template
    console.log('Save template:', data);
    this.closePanel();
  }
}
