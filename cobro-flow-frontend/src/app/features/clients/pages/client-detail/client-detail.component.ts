import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientsService } from '../../services/clients.service';
import { Invoice, PaymentWithAllocations, ClientActivity, InvoiceStatus } from '../../models/clients.models';
import { STATUS_LABELS, STATUS_COLORS } from '../../data/clients.mock-data';
import { ManagementHistoryComponent, ManagementEvent } from '../../components/management-history/management-history.component';

type DetailTab = 'invoices' | 'payments' | 'activity' | 'info';

@Component({
  selector: 'app-client-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ManagementHistoryComponent],
  template: `
    <div class="client-detail-page">
      @if (clientsService.isLoading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <span>Cargando información del cliente...</span>
        </div>
      } @else if (client()) {
        <!-- Header with back button -->
        <header class="page-header">
          <a routerLink="/dashboard/clientes" class="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Volver a Clientes
          </a>
        </header>

        <!-- Client Info Card -->
        <section class="client-card">
          <div class="client-main">
            <div
              class="avatar-large"
              [style.background-color]="clientsService.getAvatarColor(client()!.id)"
            >
              {{ clientsService.getInitials(client()!.name) }}
            </div>
            <div class="client-info">
              <div class="client-name-row">
                <h1>{{ client()!.name }}</h1>
                <span
                  class="status-badge"
                  [class.al-dia]="client()!.statusLabel === 'Al día'"
                  [class.por-vencer]="client()!.statusLabel === 'Por vencer'"
                  [class.vencido]="client()!.statusLabel === 'Vencido'"
                  [class.critico]="client()!.statusLabel === 'Crítico'"
                >
                  {{ client()!.statusLabel }}
                </span>
              </div>
              <div class="client-meta">
                @if (client()!.email) {
                  <span class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    {{ client()!.email }}
                  </span>
                }
                @if (client()!.phone) {
                  <span class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {{ client()!.phone }}
                  </span>
                }
                @if (client()!.taxId) {
                  <span class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    CUIT: {{ client()!.taxId }}
                  </span>
                }
              </div>
              @if (client()!.tags && client()!.tags!.length > 0) {
                <div class="client-tags">
                  @for (tag of client()!.tags; track tag) {
                    <span class="tag">{{ tag }}</span>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="quick-stats">
            <div class="stat">
              <span class="stat-label">Deuda Total</span>
              <span class="stat-value">{{ clientsService.formatCurrency(client()!.totalDebt) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Monto Vencido</span>
              <span class="stat-value overdue">{{ clientsService.formatCurrency(client()!.overdueAmount) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Facturas</span>
              <span class="stat-value">{{ client()!.invoiceCount }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Riesgo</span>
              <div class="risk-display">
                <div
                  class="risk-bar"
                  [style.width.%]="client()!.riskScore || 0"
                  [style.background-color]="clientsService.getRiskColor(client()!.riskScore || 0)"
                ></div>
                <span>{{ client()!.riskScore || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="client-actions">
            <button type="button" class="btn-primary" (click)="sendMessage()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Enviar Mensaje
            </button>
            <button type="button" class="btn-secondary" (click)="registerPayment()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Registrar Pago
            </button>
            <button type="button" class="btn-secondary" (click)="createInvoice()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              Nueva Factura
            </button>
          </div>
        </section>

        <!-- AI Summary -->
        @if (client()!.aiProfileSummary) {
          <section class="ai-summary">
            <div class="ai-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
                <path d="M12 6v6l4 2"></path>
              </svg>
              <span>Análisis IA del Cliente</span>
            </div>
            <p>{{ client()!.aiProfileSummary }}</p>
          </section>
        }

        <!-- Content Row: Tabs + History -->
        <div class="content-row">
          <!-- Left: Tabs and Content -->
          <div class="content-left">
            <!-- Tabs -->
            <nav class="tabs" role="tablist">
              <button
                type="button"
                role="tab"
                class="tab"
                [class.active]="activeTab() === 'invoices'"
                [attr.aria-selected]="activeTab() === 'invoices'"
                (click)="setActiveTab('invoices')"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                Facturas
                <span class="tab-badge">{{ client()!.invoices.length }}</span>
              </button>
              <button
                type="button"
                role="tab"
                class="tab"
                [class.active]="activeTab() === 'payments'"
                [attr.aria-selected]="activeTab() === 'payments'"
                (click)="setActiveTab('payments')"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Pagos
                <span class="tab-badge">{{ client()!.payments.length }}</span>
              </button>
              <button
                type="button"
                role="tab"
                class="tab"
                [class.active]="activeTab() === 'activity'"
                [attr.aria-selected]="activeTab() === 'activity'"
                (click)="setActiveTab('activity')"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                Actividad
              </button>
              <button
                type="button"
                role="tab"
                class="tab"
                [class.active]="activeTab() === 'info'"
                [attr.aria-selected]="activeTab() === 'info'"
                (click)="setActiveTab('info')"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Información
              </button>
            </nav>

            <!-- Tab Content -->
            <div class="tab-content" role="tabpanel">
          @switch (activeTab()) {
            @case ('invoices') {
              <div class="invoices-list">
                @for (invoice of client()!.invoices; track invoice.id) {
                  <div class="invoice-card" (click)="viewInvoice(invoice)">
                    <div class="invoice-main">
                      <div class="invoice-number">{{ invoice.invoiceNumber }}</div>
                      <span
                        class="invoice-status"
                        [style.background-color]="getStatusBgColor(invoice.status)"
                        [style.color]="getStatusColor(invoice.status)"
                      >
                        {{ getStatusLabel(invoice.status) }}
                      </span>
                    </div>
                    <div class="invoice-details">
                      <span class="invoice-date">
                        Emitida: {{ formatDate(invoice.issueDate) }}
                      </span>
                      <span class="invoice-due" [class.overdue]="invoice.status === 'overdue'">
                        Vence: {{ formatDate(invoice.dueDate) }}
                        @if (invoice.status === 'overdue') {
                          ({{ getDaysOverdue(invoice.dueDate) }} días)
                        }
                      </span>
                    </div>
                    <div class="invoice-amounts">
                      <div class="amount-item">
                        <span class="amount-label">Monto Original</span>
                        <span class="amount-value">{{ clientsService.formatCurrency(invoice.amount) }}</span>
                      </div>
                      <div class="amount-item">
                        <span class="amount-label">Saldo Pendiente</span>
                        <span class="amount-value balance" [class.paid]="invoice.balance === 0">
                          {{ clientsService.formatCurrency(invoice.balance) }}
                        </span>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <p>No hay facturas registradas</p>
                  </div>
                }
              </div>
            }
            @case ('payments') {
              <div class="payments-list">
                @for (payment of client()!.payments; track payment.id) {
                  <div class="payment-card">
                    <div class="payment-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div class="payment-info">
                      <div class="payment-amount">{{ clientsService.formatCurrency(payment.amount) }}</div>
                      <div class="payment-meta">
                        <span>{{ payment.method }}</span>
                        @if (payment.referenceNumber) {
                          <span>Ref: {{ payment.referenceNumber }}</span>
                        }
                      </div>
                      <div class="payment-date">{{ formatDateTime(payment.paymentDate) }}</div>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <p>No hay pagos registrados</p>
                  </div>
                }
              </div>
            }
            @case ('activity') {
              <div class="activity-timeline">
                @for (activity of client()!.recentActivity; track activity.id) {
                  <div class="activity-item">
                    <div class="activity-icon" [class]="activity.type">
                      @switch (activity.type) {
                        @case ('payment') {
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        }
                        @case ('invoice_created') {
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          </svg>
                        }
                        @case ('invoice_overdue') {
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        }
                        @default {
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                        }
                      }
                    </div>
                    <div class="activity-content">
                      <div class="activity-description">
                        {{ activity.description }}
                        @if (activity.invoiceNumber) {
                          <span class="activity-invoice">{{ activity.invoiceNumber }}</span>
                        }
                      </div>
                      @if (activity.amount) {
                        <div class="activity-amount" [class]="activity.type">
                          {{ clientsService.formatCurrency(activity.amount) }}
                        </div>
                      }
                      <div class="activity-date">{{ formatDateTime(activity.date) }}</div>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <p>No hay actividad registrada</p>
                  </div>
                }
              </div>
            }
            @case ('info') {
              <div class="info-section">
                <div class="info-grid">
                  <div class="info-item">
                    <label>ID ERP</label>
                    <span>{{ client()!.erpId || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Fecha de Alta</label>
                    <span>{{ formatDate(client()!.createdAt) }}</span>
                  </div>
                  <div class="info-item">
                    <label>Último Pago</label>
                    <span>{{ client()!.lastPaymentDate ? formatDate(client()!.lastPaymentDate!) : 'Sin pagos' }}</span>
                  </div>
                  <div class="info-item">
                    <label>ID de Organización</label>
                    <span>{{ client()!.organizationId }}</span>
                  </div>
                </div>
              </div>
            }
          }
            </div>
          </div>

          <!-- Right: Management History -->
          <app-management-history [events]="managementEvents()" />
        </div>
      } @else {
        <div class="not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>Cliente no encontrado</h2>
          <p>El cliente que buscas no existe o ha sido eliminado.</p>
          <a routerLink="/dashboard/clientes" class="btn-primary">Volver a Clientes</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .client-detail-page {
      padding: 32px;
    }

    .loading-container,
    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 64px;
      text-align: center;
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

    .not-found h2 {
      margin: 0;
      color: #111827;
    }

    .not-found p {
      margin: 0;
      color: #6B7280;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #6B7280;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.15s;
    }

    .back-link:hover {
      color: #374151;
    }

    .client-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }

    .client-main {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
    }

    .avatar-large {
      width: 72px;
      height: 72px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 600;
      color: white;
      flex-shrink: 0;
    }

    .client-info {
      flex: 1;
      min-width: 0;
    }

    .client-name-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .client-name-row h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
    }

    .status-badge.al-dia { background: #D1FAE5; color: #059669; }
    .status-badge.por-vencer { background: #FEF3C7; color: #D97706; }
    .status-badge.vencido { background: #FEE2E2; color: #DC2626; }
    .status-badge.critico { background: #FEE2E2; color: #991B1B; }

    .client-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #6B7280;
    }

    .client-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tag {
      padding: 4px 10px;
      background: #E5E7EB;
      color: #374151;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      padding: 20px 0;
      border-top: 1px solid #F3F4F6;
      border-bottom: 1px solid #F3F4F6;
      margin-bottom: 20px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 13px;
      color: #6B7280;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }

    .stat-value.overdue {
      color: #EF4444;
    }

    .risk-display {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .risk-bar {
      width: 60px;
      height: 8px;
      background: #22C55E;
      border-radius: 4px;
    }

    .risk-display span {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }

    .client-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-primary,
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      text-decoration: none;
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
    }

    .ai-summary {
      background: linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .ai-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #1E40AF;
      margin-bottom: 12px;
    }

    .ai-summary p {
      margin: 0;
      font-size: 14px;
      color: #374151;
      line-height: 1.6;
    }

    .content-row {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }

    .content-left {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .tabs {
      display: flex;
      gap: 4px;
      background: white;
      padding: 4px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      padding: 12px 20px;
      background: transparent;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.15s;
      justify-content: center;
    }

    .tab:hover {
      background: #F9FAFB;
      color: #374151;
    }

    .tab.active {
      background: #3B82F6;
      color: white;
    }

    .tab-badge {
      padding: 2px 8px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      font-size: 12px;
    }

    .tab.active .tab-badge {
      background: rgba(255, 255, 255, 0.2);
    }

    .tab-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .invoices-list,
    .payments-list {
      display: flex;
      flex-direction: column;
    }

    .invoice-card {
      padding: 20px;
      border-bottom: 1px solid #F3F4F6;
      cursor: pointer;
      transition: background 0.15s;
    }

    .invoice-card:hover {
      background: #F9FAFB;
    }

    .invoice-card:last-child {
      border-bottom: none;
    }

    .invoice-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .invoice-number {
      font-weight: 600;
      color: #111827;
    }

    .invoice-status {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .invoice-details {
      display: flex;
      gap: 20px;
      margin-bottom: 12px;
      font-size: 13px;
      color: #6B7280;
    }

    .invoice-due.overdue {
      color: #EF4444;
    }

    .invoice-amounts {
      display: flex;
      gap: 32px;
    }

    .amount-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .amount-label {
      font-size: 12px;
      color: #6B7280;
    }

    .amount-value {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .amount-value.balance {
      color: #EF4444;
    }

    .amount-value.balance.paid {
      color: #22C55E;
    }

    .payment-card {
      display: flex;
      gap: 16px;
      padding: 20px;
      border-bottom: 1px solid #F3F4F6;
    }

    .payment-card:last-child {
      border-bottom: none;
    }

    .payment-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #D1FAE5;
      color: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .payment-info {
      flex: 1;
    }

    .payment-amount {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
      margin-bottom: 4px;
    }

    .payment-meta {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: #374151;
      margin-bottom: 4px;
    }

    .payment-date {
      font-size: 13px;
      color: #6B7280;
    }

    .activity-timeline {
      padding: 20px;
    }

    .activity-item {
      display: flex;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid #F3F4F6;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-icon.payment {
      background: #D1FAE5;
      color: #059669;
    }

    .activity-icon.invoice_created {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .activity-icon.invoice_overdue {
      background: #FEE2E2;
      color: #DC2626;
    }

    .activity-content {
      flex: 1;
    }

    .activity-description {
      font-size: 14px;
      color: #374151;
      margin-bottom: 4px;
    }

    .activity-invoice {
      color: #3B82F6;
      font-weight: 500;
    }

    .activity-amount {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .activity-amount.payment {
      color: #059669;
    }

    .activity-amount.invoice_overdue {
      color: #EF4444;
    }

    .activity-date {
      font-size: 13px;
      color: #6B7280;
    }

    .info-section {
      padding: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item label {
      font-size: 13px;
      color: #6B7280;
    }

    .info-item span {
      font-size: 15px;
      color: #111827;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px;
      color: #9CA3AF;
    }

    .empty-state p {
      margin: 0;
      color: #6B7280;
    }

    @media (max-width: 1200px) {
      .content-row {
        flex-direction: column;
      }

      .content-row app-management-history {
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .client-detail-page {
        padding: 20px;
      }

      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .tabs {
        flex-wrap: wrap;
      }

      .tab {
        flex: 1 1 45%;
      }
    }
  `]
})
export class ClientDetailComponent implements OnInit, OnDestroy {
  protected readonly clientsService = inject(ClientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  activeTab = signal<DetailTab>('invoices');
  client = this.clientsService.selectedClient;

  // Mock management events - will be replaced with real data from API
  managementEvents = signal<ManagementEvent[]>([
    {
      id: '1',
      type: 'whatsapp',
      title: 'WhatsApp enviado',
      description: 'Recordatorio de pago FAC-001',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: '2',
      type: 'email',
      title: 'Email enviado',
      description: 'Aviso de mora - segundo aviso',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    {
      id: '3',
      type: 'call',
      title: 'Llamada realizada',
      description: 'Sin respuesta - tercer intento',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
    },
    {
      id: '4',
      type: 'payment',
      title: 'Pago recibido',
      description: '$5,200 - FAC-004',
      date: new Date(2026, 0, 15), // 15 Jan 2026
      amount: 5200
    },
    {
      id: '5',
      type: 'email',
      title: 'Email enviado',
      description: 'Primer aviso de mora',
      date: new Date(2026, 0, 20) // 20 Jan 2026
    }
  ]);

  ngOnInit(): void {
    const clientId = this.route.snapshot.paramMap.get('id');
    if (clientId) {
      this.clientsService.loadClientDetail(clientId);
    }
  }

  ngOnDestroy(): void {
    this.clientsService.clearSelectedClient();
  }

  setActiveTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  sendMessage(): void {
    console.log('Send message to client');
  }

  registerPayment(): void {
    console.log('Register payment');
  }

  createInvoice(): void {
    console.log('Create invoice');
  }

  viewInvoice(invoice: Invoice): void {
    const clientId = this.client()?.id;
    if (clientId) {
      this.router.navigate(['/dashboard/clientes', clientId, 'facturas', invoice.id]);
    }
  }

  getStatusLabel(status: InvoiceStatus): string {
    return STATUS_LABELS[status];
  }

  getStatusColor(status: InvoiceStatus): string {
    return STATUS_COLORS[status];
  }

  getStatusBgColor(status: InvoiceStatus): string {
    const colors: Record<InvoiceStatus, string> = {
      pending: '#FEF3C7',
      paid: '#D1FAE5',
      overdue: '#FEE2E2',
      cancelled: '#F3F4F6',
      disputed: '#EDE9FE'
    };
    return colors[status];
  }

  getDaysOverdue(dueDate: Date): number {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
