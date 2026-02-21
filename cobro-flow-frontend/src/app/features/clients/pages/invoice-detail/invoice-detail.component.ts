import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  InvoiceDetailData,
  InvoiceConversation,
  ConversationType,
  PaymentPromise,
  AIInvoiceSummary
} from '../../models/invoice-detail.models';
import { ClientsService } from '../../services/clients.service';

@Component({
  selector: 'app-invoice-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="invoice-detail-page">
      @if (isLoading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <span>Cargando información de la factura...</span>
        </div>
      } @else if (invoice()) {
        <!-- Header: Breadcrumb -->
        <header class="page-header">
          <a [routerLink]="['/dashboard/clientes', invoice()!.clientId]" class="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            {{ invoice()!.clientName }} / Facturas / {{ invoice()!.invoiceNumber }}
          </a>
        </header>

        <!-- Header Row: Title + Actions -->
        <div class="header-row">
          <div class="header-left">
            <h1>{{ invoice()!.invoiceNumber }}</h1>
            <span
              class="status-badge"
              [class.pending]="invoice()!.status === 'pending'"
              [class.paid]="invoice()!.status === 'paid'"
              [class.overdue]="invoice()!.status === 'overdue'"
              [class.disputed]="invoice()!.status === 'disputed'"
            >
              {{ getStatusLabel(invoice()!.status) }}
            </span>
            @if (invoice()!.riskLevel !== 'low') {
              <span class="risk-badge" [class]="invoice()!.riskLevel">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                {{ invoice()!.riskLevel === 'high' ? 'Riesgo Alto' : 'Riesgo Medio' }}
              </span>
            }
          </div>
          <div class="header-actions">
            <button type="button" class="btn-secondary" (click)="downloadPdf()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Descargar PDF
            </button>
            <button type="button" class="btn-success" (click)="registerPayment()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
              Registrar Pago
            </button>
            <button type="button" class="btn-danger-outline" (click)="markAsDisputed()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
              Disputa
            </button>
          </div>
        </div>

        <!-- KPI Row -->
        <div class="kpi-row">
          <div class="kpi-card">
            <span class="kpi-label">Monto original</span>
            <span class="kpi-value">{{ formatCurrency(invoice()!.amount) }}</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Intereses acumulados</span>
            <span class="kpi-value danger">{{ formatCurrency(invoice()!.accruedInterest) }}</span>
            <span class="kpi-sub">{{ invoice()!.interestRate }}% tasa moratoria</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Total adeudado</span>
            <span class="kpi-value danger">{{ formatCurrency(invoice()!.totalOwed) }}</span>
            <span class="kpi-sub">capital + intereses</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Días de mora</span>
            <span class="kpi-value warning">{{ invoice()!.daysOverdue }}</span>
            <span class="kpi-sub">desde {{ formatDate(invoice()!.dueDate) }}</span>
          </div>
        </div>

        <!-- Content Row: Two Columns -->
        <div class="content-row">
          <!-- Left Column -->
          <div class="left-column">
            <!-- Invoice Details Card -->
            <div class="card">
              <div class="card-header">
                <h3>Información de la factura</h3>
              </div>
              <div class="card-divider"></div>
              <div class="card-body">
                <div class="detail-grid">
                  <div class="detail-column">
                    <div class="detail-field">
                      <span class="field-label">Cliente</span>
                      <span class="field-value">{{ invoice()!.clientName }}</span>
                    </div>
                    <div class="detail-field">
                      <span class="field-label">Empresa</span>
                      <span class="field-value">{{ invoice()!.companyName || '-' }}</span>
                    </div>
                    <div class="detail-field">
                      <span class="field-label">CUIT</span>
                      <span class="field-value">{{ invoice()!.taxId || '-' }}</span>
                    </div>
                    <div class="detail-field">
                      <span class="field-label">Condición fiscal</span>
                      <span class="field-value">{{ invoice()!.taxCondition || '-' }}</span>
                    </div>
                  </div>
                  <div class="detail-column">
                    <div class="detail-field">
                      <span class="field-label">Fecha de emisión</span>
                      <span class="field-value">{{ formatDate(invoice()!.issueDate) }}</span>
                    </div>
                    <div class="detail-field">
                      <span class="field-label">Fecha de vencimiento</span>
                      <span class="field-value" [class.overdue]="invoice()!.status === 'overdue'">
                        {{ formatDate(invoice()!.dueDate) }}
                      </span>
                    </div>
                    <div class="detail-field">
                      <span class="field-label">Concepto</span>
                      <span class="field-value">{{ invoice()!.concept }}</span>
                    </div>
                    <div class="detail-field">
                      <span class="field-label">Método de pago</span>
                      <span class="field-value">{{ invoice()!.paymentMethod || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Promise Card -->
            <div class="card">
              <div class="card-header">
                <h3>Promesa de pago</h3>
                <button type="button" class="btn-primary-sm" (click)="createPromise()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 17a4 4 0 0 1-8 0c0-1.5.5-3 2-4l4 4 4-4c1.5 1 2 2.5 2 4a4 4 0 0 1-4 0"></path>
                    <path d="m11 7 3 3 3-3"></path>
                    <path d="M11 7V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4"></path>
                  </svg>
                  Nueva promesa
                </button>
              </div>
              <div class="card-divider"></div>
              @if (invoice()!.paymentPromise) {
                <div class="promise-active">
                  <div class="promise-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                      <path d="m9 16 2 2 4-4"></path>
                    </svg>
                  </div>
                  <div class="promise-info">
                    <span class="promise-title">
                      Promesa activa: pago parcial de {{ formatCurrency(invoice()!.paymentPromise!.amount) }}
                    </span>
                    <span class="promise-desc">
                      Fecha comprometida: {{ formatDate(invoice()!.paymentPromise!.committedDate) }}
                      — {{ invoice()!.paymentPromise!.agreedVia }}
                    </span>
                  </div>
                  <span class="promise-status" [class]="invoice()!.paymentPromise!.status">
                    {{ getPromiseStatusLabel(invoice()!.paymentPromise!.status) }}
                  </span>
                </div>
              } @else {
                <div class="empty-promise">
                  <p>No hay promesas de pago activas</p>
                </div>
              }
            </div>
          </div>

          <!-- Right Column -->
          <div class="right-column">
            <!-- AI Summary Card -->
            @if (invoice()!.aiSummary) {
              <div class="card ai-card">
                <div class="ai-header">
                  <div class="ai-header-left">
                    <div class="ai-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                        <path d="M5 3v4"></path>
                        <path d="M19 17v4"></path>
                        <path d="M3 5h4"></path>
                        <path d="M17 19h4"></path>
                      </svg>
                    </div>
                    <span>Resumen IA</span>
                  </div>
                  <button type="button" class="ai-refresh-btn" (click)="regenerateAI()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                      <path d="M16 21h5v-5"></path>
                    </svg>
                    Regenerar
                  </button>
                </div>
                <div class="ai-body">
                  <p class="ai-paragraph">{{ invoice()!.aiSummary!.content }}</p>
                  @if (invoice()!.aiSummary!.recommendation) {
                    <div class="ai-insight">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                        <path d="M9 18h6"></path>
                        <path d="M10 22h4"></path>
                      </svg>
                      <span>{{ invoice()!.aiSummary!.recommendation }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Conversations Card -->
            <div class="card">
              <div class="card-header">
                <h3>Conversaciones</h3>
                <button type="button" class="btn-ai-sm" (click)="summarizeAll()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                  </svg>
                  Resumir todas con IA
                </button>
              </div>
              <div class="card-divider"></div>
              <div class="conversations-list">
                @for (conv of invoice()!.conversations; track conv.id; let last = $last) {
                  <div class="conversation-item" [class.no-border]="last">
                    <div class="conv-header">
                      <div class="conv-left">
                        <div class="conv-icon" [class]="conv.type">
                          @switch (conv.type) {
                            @case ('whatsapp') {
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                              </svg>
                            }
                            @case ('email') {
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                              </svg>
                            }
                            @case ('call') {
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                              </svg>
                            }
                            @case ('sms') {
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                              </svg>
                            }
                          }
                        </div>
                        <span class="conv-channel">{{ getChannelLabel(conv.type) }}</span>
                        <span class="conv-date">{{ formatDateTime(conv.date) }}</span>
                      </div>
                      <button type="button" class="btn-summarize" (click)="summarizeConversation(conv)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                        </svg>
                        Resumir
                      </button>
                    </div>
                    <div class="conv-body">
                      @if (conv.messages && conv.messages.length > 0) {
                        @for (msg of conv.messages; track $index) {
                          <div class="conv-message">
                            <span class="msg-sender" [class]="msg.sender">
                              {{ msg.sender === 'system' ? 'CobroFlow:' : 'Cliente:' }}
                            </span>
                            <span class="msg-text">{{ msg.text }}</span>
                          </div>
                        }
                      } @else if (conv.subject) {
                        <div class="conv-email">
                          <span class="email-subject">Asunto: {{ conv.subject }}</span>
                          <span class="email-body">{{ conv.content }}</span>
                        </div>
                      } @else if (conv.note) {
                        <div class="conv-call">
                          <div class="call-note-header">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span>Nota del operador:</span>
                          </div>
                          <span class="call-note">{{ conv.content }}</span>
                        </div>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="empty-conversations">
                    <p>No hay conversaciones registradas</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <h2>Factura no encontrada</h2>
          <p>La factura que buscas no existe o ha sido eliminada.</p>
          <a routerLink="/dashboard/clientes" class="btn-primary">Volver a Clientes</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .invoice-detail-page {
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
      margin-bottom: 16px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #1E40AF;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: color 0.15s;
    }

    .back-link:hover {
      color: #1E3A8A;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .header-left h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: #1F2937;
    }

    .status-badge {
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 500;
    }

    .status-badge.pending { background: #FEF3C7; color: #D97706; }
    .status-badge.paid { background: #D1FAE5; color: #059669; }
    .status-badge.overdue { background: #FEE2E2; color: #DC2626; }
    .status-badge.disputed { background: #EDE9FE; color: #7C3AED; }

    .risk-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 500;
    }

    .risk-badge.medium { background: #FEF3C7; color: #D97706; }
    .risk-badge.high { background: #FEF3C7; color: #D97706; }

    .header-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
    }

    .btn-secondary {
      background: white;
      color: #1F2937;
      border: 1px solid #E5E7EB;
    }

    .btn-secondary:hover {
      background: #F9FAFB;
    }

    .btn-success {
      background: #10B981;
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger-outline {
      background: white;
      color: #EF4444;
      border: 1px solid #E5E7EB;
    }

    .btn-danger-outline:hover {
      background: #FEF2F2;
    }

    .btn-primary {
      background: #3B82F6;
      color: white;
      text-decoration: none;
    }

    .btn-primary:hover {
      background: #2563EB;
    }

    .btn-primary-sm {
      padding: 8px 16px;
      font-size: 13px;
      background: #1E40AF;
      color: white;
    }

    .btn-primary-sm:hover {
      background: #1E3A8A;
    }

    .btn-ai-sm {
      padding: 6px 12px;
      font-size: 12px;
      background: #EEF2FF;
      color: #6366F1;
    }

    .btn-ai-sm:hover {
      background: #E0E7FF;
    }

    .btn-summarize {
      padding: 4px 10px;
      font-size: 11px;
      background: #EEF2FF;
      color: #6366F1;
      border-radius: 6px;
    }

    .btn-summarize:hover {
      background: #E0E7FF;
    }

    /* KPI Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .kpi-label {
      font-size: 13px;
      color: #6B7280;
    }

    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: #1F2937;
    }

    .kpi-value.danger { color: #EF4444; }
    .kpi-value.warning { color: #F59E0B; }

    .kpi-sub {
      font-size: 12px;
      color: #9CA3AF;
    }

    /* Content Row */
    .content-row {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }

    .left-column {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .right-column {
      width: 480px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Cards */
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
    }

    .card-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #1F2937;
    }

    .card-divider {
      height: 1px;
      background: #E5E7EB;
    }

    .card-body {
      padding: 20px;
    }

    /* Detail Grid */
    .detail-grid {
      display: flex;
      gap: 32px;
    }

    .detail-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .detail-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 12px;
      font-weight: 600;
      color: #9CA3AF;
    }

    .field-value {
      font-size: 14px;
      font-weight: 600;
      color: #1F2937;
    }

    .field-value.overdue {
      color: #EF4444;
    }

    /* Promise */
    .promise-active {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #F0FDF4;
    }

    .promise-icon {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: #D1FAE5;
      color: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .promise-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .promise-title {
      font-size: 14px;
      font-weight: 600;
      color: #059669;
    }

    .promise-desc {
      font-size: 13px;
      color: #6B7280;
    }

    .promise-status {
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .promise-status.active { background: #D1FAE5; color: #059669; }
    .promise-status.fulfilled { background: #D1FAE5; color: #059669; }
    .promise-status.broken { background: #FEE2E2; color: #DC2626; }
    .promise-status.expired { background: #F3F4F6; color: #6B7280; }

    .empty-promise {
      padding: 32px;
      text-align: center;
      color: #6B7280;
    }

    .empty-promise p {
      margin: 0;
      font-size: 14px;
    }

    /* AI Card */
    .ai-card {
      border: 2px solid #818CF8;
    }

    .ai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: linear-gradient(90deg, #EEF2FF 0%, #E0E7FF 100%);
      border-radius: 10px 10px 0 0;
    }

    .ai-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 700;
      color: #4338CA;
    }

    .ai-icon {
      width: 32px;
      height: 32px;
      border-radius: 16px;
      background: #6366F1;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ai-refresh-btn {
      padding: 6px 12px;
      font-size: 12px;
      background: #6366F1;
      color: white;
      border-radius: 8px;
    }

    .ai-refresh-btn:hover {
      background: #4F46E5;
    }

    .ai-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ai-paragraph {
      margin: 0;
      font-size: 14px;
      color: #4B5563;
      line-height: 1.6;
    }

    .ai-insight {
      display: flex;
      gap: 10px;
      padding: 12px;
      background: #FEF3C7;
      border-radius: 8px;
      color: #92400E;
    }

    .ai-insight svg {
      flex-shrink: 0;
      color: #D97706;
    }

    .ai-insight span {
      font-size: 13px;
      font-weight: 500;
      line-height: 1.5;
    }

    /* Conversations */
    .conversations-list {
      display: flex;
      flex-direction: column;
    }

    .conversation-item {
      padding: 20px;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .conversation-item.no-border {
      border-bottom: none;
    }

    .conv-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .conv-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .conv-icon {
      width: 32px;
      height: 32px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .conv-icon.whatsapp { background: #F0FDF4; color: #10B981; }
    .conv-icon.email { background: #EFF6FF; color: #1E40AF; }
    .conv-icon.call { background: #FEF3C7; color: #D97706; }
    .conv-icon.sms { background: #EDE9FE; color: #7C3AED; }

    .conv-channel {
      font-size: 14px;
      font-weight: 600;
      color: #1F2937;
    }

    .conv-date {
      font-size: 12px;
      color: #9CA3AF;
    }

    .conv-body {
      padding-left: 42px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .conv-message {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .msg-sender {
      font-size: 13px;
      font-weight: 600;
    }

    .msg-sender.system { color: #1E40AF; }
    .msg-sender.client { color: #059669; }

    .msg-text {
      font-size: 13px;
      color: #4B5563;
      line-height: 1.5;
    }

    .conv-email {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .email-subject {
      font-size: 13px;
      font-weight: 600;
      color: #1F2937;
    }

    .email-body {
      font-size: 13px;
      color: #4B5563;
      line-height: 1.5;
    }

    .conv-call {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .call-note-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #6B7280;
    }

    .call-note {
      font-size: 13px;
      color: #4B5563;
      line-height: 1.5;
    }

    .empty-conversations {
      padding: 32px;
      text-align: center;
    }

    .empty-conversations p {
      margin: 0;
      font-size: 14px;
      color: #6B7280;
    }

    @media (max-width: 1200px) {
      .content-row {
        flex-direction: column;
      }

      .right-column {
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .invoice-detail-page {
        padding: 20px;
      }

      .kpi-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .detail-grid {
        flex-direction: column;
      }

      .header-left h1 {
        font-size: 24px;
      }
    }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  protected readonly clientsService = inject(ClientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isLoading = signal(true);
  invoice = signal<InvoiceDetailData | null>(null);

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('invoiceId');
    if (invoiceId) {
      this.loadInvoiceDetail(invoiceId);
    }
  }

  private loadInvoiceDetail(invoiceId: string): void {
    // Mock data - will be replaced with real API call
    setTimeout(() => {
      this.invoice.set({
        id: invoiceId,
        invoiceNumber: 'FAC-001',
        status: 'overdue',
        riskLevel: 'high',
        clientId: '1',
        clientName: 'Juan Pérez',
        companyName: 'Acme S.A.',
        taxId: '30-71234567-8',
        taxCondition: 'Responsable Inscripto',
        amount: 8500,
        accruedInterest: 1275,
        totalOwed: 9775,
        interestRate: 15,
        issueDate: new Date(2025, 11, 1),
        dueDate: new Date(2025, 11, 31),
        daysOverdue: 58,
        concept: 'Servicios de consultoría - Noviembre 2025',
        paymentMethod: 'Transferencia bancaria',
        paymentPromise: {
          id: 'promise-1',
          amount: 4000,
          committedDate: new Date(2026, 1, 15),
          agreedVia: 'Acordada por teléfono',
          status: 'active',
          createdAt: new Date(2026, 0, 20)
        },
        aiSummary: {
          content: 'El cliente Juan Pérez (Acme S.A.) tiene una deuda vencida de $8,500 desde el 01/12/2025 con 58 días de mora. Se han realizado 7 contactos (3 emails, 2 WhatsApp, 2 llamadas). En la última conversación telefónica se acordó un pago parcial de $4,000 para el 15/02/2026. El cliente expresó dificultades de liquidez pero mostró disposición a regularizar.',
          recommendation: 'Recomendación: Ofrecer plan de 3 cuotas sin intereses adicionales para acelerar la recuperación.',
          generatedAt: new Date()
        },
        conversations: [
          {
            id: 'conv-1',
            type: 'whatsapp',
            date: new Date(2026, 0, 28, 14, 32),
            messages: [
              { sender: 'system', text: 'Hola Juan, te recordamos que tu factura FAC-001 por $8,500 venció el 31/12. ¿Podés indicarnos cuándo realizarás el pago?' },
              { sender: 'client', text: 'Hola, sí estoy al tanto. Tuvimos un problema de liquidez este mes, pero voy a hacer un pago parcial de $4,000 antes del 15 de febrero.' },
              { sender: 'system', text: 'Perfecto Juan, queda registrado. ¿Y el saldo restante de $4,500?' }
            ]
          },
          {
            id: 'conv-2',
            type: 'email',
            date: new Date(2026, 0, 25, 9, 15),
            subject: 'Segundo aviso — Factura FAC-001 vencida',
            content: 'Estimado Juan, le informamos que su factura FAC-001 por un monto de $8,500 se encuentra vencida desde el 31/12/2025. Le solicitamos regularizar su situación a la brevedad para evitar la aplicación de intereses moratorios...'
          },
          {
            id: 'conv-3',
            type: 'call',
            date: new Date(2026, 0, 20, 11, 45),
            note: 'Nota del operador',
            content: 'Se contactó al cliente. Atendió. Indicó que tienen dificultades de caja por una demora en el cobro a un cliente propio. Se comprometió a realizar un pago parcial de $4,000 antes del 15/02. El saldo restante lo regularizaría en marzo. Se acordó no aplicar intereses adicionales si cumple el plazo.'
          }
        ]
      });
      this.isLoading.set(false);
    }, 500);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(date: Date): string {
    const d = new Date(date);
    return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} — ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagada',
      overdue: 'Vencida',
      cancelled: 'Cancelada',
      disputed: 'En disputa'
    };
    return labels[status] || status;
  }

  getPromiseStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Vigente',
      fulfilled: 'Cumplida',
      broken: 'Incumplida',
      expired: 'Vencida'
    };
    return labels[status] || status;
  }

  getChannelLabel(type: ConversationType): string {
    const labels: Record<ConversationType, string> = {
      whatsapp: 'WhatsApp',
      email: 'Email',
      call: 'Llamada telefónica',
      sms: 'SMS'
    };
    return labels[type];
  }

  downloadPdf(): void {
    console.log('Download PDF');
  }

  registerPayment(): void {
    console.log('Register payment');
  }

  markAsDisputed(): void {
    console.log('Mark as disputed');
  }

  createPromise(): void {
    console.log('Create promise');
  }

  regenerateAI(): void {
    console.log('Regenerate AI summary');
  }

  summarizeAll(): void {
    console.log('Summarize all conversations');
  }

  summarizeConversation(conv: InvoiceConversation): void {
    console.log('Summarize conversation:', conv.id);
  }
}
