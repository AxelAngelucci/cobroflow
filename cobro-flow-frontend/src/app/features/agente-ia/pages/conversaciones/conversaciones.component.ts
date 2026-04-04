import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AgenteIaService } from '../../services/agente-ia.service';
import {
  CONVERSATION_STATUS_LABELS, CHANNEL_LABELS, SENTIMENT_LABELS,
  MESSAGE_ROLE_LABELS,
} from '../../models/agente-ia.models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-conversaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="conversations-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>Conversaciones en Vivo</h1>
          <p>Monitorea las conversaciones activas del agente en tiempo real</p>
        </div>
        <div class="header-right">
          <div class="live-badge">
            <span class="live-dot"></span>
            {{ service.conversationsTotal() || 0 }} Activas
          </div>
          <button class="btn-filter">
            <i class="lucide-settings-2"></i>
            Filtrar
          </button>
        </div>
      </header>

      <!-- Two/Three Column Layout -->
      <div class="conv-grid" [style.grid-template-columns]="service.selectedConversation() ? '280px 1fr 300px' : '320px 1fr'">
        <!-- Left: Conversation List -->
        <div class="conv-list-panel">
          <div class="conv-list-header">
            <span class="conv-list-title">Conversaciones</span>
            <div class="conv-search">
              <i class="lucide-search search-icon"></i>
              <input type="text" placeholder="Buscar..." class="search-input" />
            </div>
          </div>
          <div class="conv-items">
            @for (conv of service.conversations(); track conv.id) {
              <div class="conv-item" [class.selected]="service.selectedConversation()?.id === conv.id" (click)="selectConversation(conv.id)">
                <div class="conv-avatar" [style.background]="getAvatarBg(conv.status)">
                  <span [style.color]="getAvatarColor(conv.status)">{{ getInitials(conv) }}</span>
                </div>
                <div class="conv-info">
                  <span class="conv-name">{{ 'Deudor ' + (conv.debtorId?.slice(0, 8) || '') }}</span>
                  <span class="conv-preview" [style.color]="getPreviewColor(conv.status)">{{ getPreviewText(conv) }}</span>
                </div>
                <div class="conv-right">
                  <span class="conv-time" [class.highlight]="service.selectedConversation()?.id === conv.id">{{ getRelativeTime(conv.createdAt) }}</span>
                </div>
              </div>
            }
            @if (service.conversations().length === 0) {
              <div class="empty-state">No hay conversaciones</div>
            }
          </div>
        </div>

        <!-- Right: Chat Panel -->
        <div class="chat-panel">
          @if (service.selectedConversation(); as conv) {
            <!-- Chat Header -->
            <div class="chat-header">
              <div class="chat-header-left">
                <div class="chat-avatar" [style.background]="getAvatarBg(conv.status)">
                  <span [style.color]="getAvatarColor(conv.status)">{{ getInitials(conv) }}</span>
                </div>
                <div class="chat-info">
                  <span class="chat-name">{{ 'Deudor ' + (conv.debtorId?.slice(0, 8) || '') }}</span>
                  <span class="chat-meta">{{ CHANNEL_LABELS[conv.channel] }} &middot; {{ conv.totalMessages }} mensajes &middot; {{ CONVERSATION_STATUS_LABELS[conv.status] }}</span>
                </div>
              </div>
              <div class="chat-header-right">
                @if (conv.status === 'active') {
                  <button class="btn-takeover" (click)="escalateConversation()">
                    <i class="lucide-user"></i>
                    Tomar control
                  </button>
                }
                <button class="btn-more">
                  <i class="lucide-ellipsis"></i>
                </button>
              </div>
            </div>

            <!-- Chat Messages -->
            <div class="chat-messages">
              @for (msg of service.messages(); track msg.id) {
                @if (msg.role === 'agent') {
                  <div class="msg-row agent">
                    <div class="bot-icon">
                      <i class="lucide-bot"></i>
                    </div>
                    <div class="msg-group">
                      <div class="msg-bubble agent-bubble">{{ msg.content }}</div>
                      <span class="msg-time">LUNA &middot; {{ formatTime(msg.createdAt) }}</span>
                    </div>
                  </div>
                } @else if (msg.role === 'client') {
                  <div class="msg-row user">
                    <div class="msg-group right">
                      <div class="msg-bubble user-bubble">{{ msg.content }}</div>
                      <span class="msg-time">Cliente &middot; {{ formatTime(msg.createdAt) }}</span>
                    </div>
                  </div>
                } @else {
                  <div class="msg-row system">
                    <div class="msg-bubble system-bubble">{{ msg.content }}</div>
                  </div>
                }
              }
              @if (service.messages().length === 0) {
                <div class="empty-state">No hay mensajes aún</div>
              }
            </div>

            <!-- Chat Input -->
            <div class="chat-input">
              <input type="text" class="chat-input-field" [(ngModel)]="newMessage" placeholder="Escribir mensaje de supervisión..." (keyup.enter)="sendMessage()" />
              <button class="btn-send" (click)="sendMessage()">
                <i class="lucide-send"></i>
              </button>
            </div>
          } @else {
            <div class="empty-chat">
              <i class="lucide-message-circle empty-icon"></i>
              <p>Selecciona una conversación para ver los mensajes</p>
            </div>
          }
        </div>

        <!-- Right: Client Panel -->
        @if (service.selectedConversation() && debtor()) {
          <div class="client-panel">
            <!-- Header -->
            <div class="client-panel-header">
              <span>Información del Cliente</span>
              <button class="btn-close-panel" (click)="closeClientPanel()">✕</button>
            </div>

            <!-- Avatar + Name -->
            <div class="client-identity">
              <div class="client-avatar">{{ getDebtorInitials() }}</div>
              <div class="client-name-block">
                <span class="client-name">{{ debtor().name }}</span>
                <span class="client-company">{{ debtor().tax_id || '' }}</span>
              </div>
            </div>

            <!-- Debt total -->
            <div class="client-debt-card">
              <span class="debt-label">Deuda Total</span>
              <span class="debt-amount">{{ formatCurrency(getTotalDebt()) }}</span>
              <span class="debt-badge">{{ getOverdueDays() }} días vencida</span>
            </div>

            <!-- Invoices -->
            <div class="client-section">
              <span class="section-title">Facturas Relacionadas</span>
              @for (inv of debtorInvoices(); track inv.id) {
                <div class="invoice-row">
                  <span class="invoice-num">{{ inv.invoice_number || inv.id?.slice(0,8) }}</span>
                  <span class="invoice-amount">{{ formatCurrency(inv.amount || 0) }}</span>
                  <span [class]="getInvoiceStatusClass(inv.status)">{{ inv.status }}</span>
                </div>
              }
              @if (debtorInvoices().length === 0) {
                <span class="no-data">Sin facturas</span>
              }
            </div>

            <!-- Quick actions -->
            <div class="client-actions">
              <button class="btn-action-green">
                <i class="lucide-credit-card"></i>
                Registrar Pago
              </button>
              <button class="btn-action-outline">
                <i class="lucide-handshake"></i>
                Nueva Promesa
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .conversations-page { display: flex; flex-direction: column; gap: 24px; padding: 32px; height: calc(100vh - 64px); }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { font-size: 28px; font-weight: 700; color: #1F2937; margin: 0; }
    .header-left p { font-size: 14px; color: #6B7280; margin: 4px 0 0; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .live-badge { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #FEE2E2; border-radius: 20px; font-size: 13px; font-weight: 600; color: #DC2626; }
    .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #DC2626; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .btn-filter { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: white; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-filter:hover { background: #F9FAFB; }

    /* Grid */
    .conv-grid { display: grid; grid-template-columns: 400px 1fr; gap: 24px; flex: 1; min-height: 0; }

    /* Conversation List */
    .conv-list-panel { background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; overflow: hidden; }
    .conv-list-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #E5E7EB; }
    .conv-list-title { font-size: 14px; font-weight: 600; color: #1F2937; }
    .conv-search { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #F3F4F6; border-radius: 6px; }
    .search-icon { font-size: 14px; color: #9CA3AF; }
    .search-input { border: none; background: transparent; font-size: 12px; outline: none; width: 80px; color: #374151; }
    .conv-items { flex: 1; overflow-y: auto; }

    .conv-item { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #F3F4F6; cursor: pointer; }
    .conv-item:hover { background: #F9FAFB; }
    .conv-item.selected { background: #EFF6FF; border-left: 3px solid #1E40AF; }
    .conv-avatar { width: 44px; height: 44px; border-radius: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .conv-avatar span { font-size: 14px; font-weight: 600; }
    .conv-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .conv-name { font-size: 14px; font-weight: 600; color: #1F2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .conv-item.selected .conv-name { font-weight: 600; }
    .conv-item:not(.selected) .conv-name { font-weight: 500; }
    .conv-preview { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .conv-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .conv-time { font-size: 11px; color: #9CA3AF; }
    .conv-time.highlight { color: #1E40AF; font-weight: 600; }
    .conv-badge { width: 20px; height: 20px; border-radius: 10px; background: #1E40AF; color: white; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; }

    /* Chat Panel */
    .chat-panel { background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; overflow: hidden; }
    .chat-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #E5E7EB; }
    .chat-header-left { display: flex; align-items: center; gap: 12px; }
    .chat-avatar { width: 44px; height: 44px; border-radius: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .chat-avatar span { font-size: 14px; font-weight: 600; }
    .chat-info { display: flex; flex-direction: column; gap: 2px; }
    .chat-name { font-size: 16px; font-weight: 600; color: #1F2937; }
    .chat-meta { font-size: 12px; color: #6B7280; }
    .chat-header-right { display: flex; align-items: center; gap: 8px; }
    .btn-takeover { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #FEE2E2; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; color: #DC2626; cursor: pointer; }
    .btn-takeover:hover { background: #FECACA; }
    .btn-more { width: 36px; height: 36px; background: #F3F4F6; border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280; }

    /* Messages */
    .chat-messages { flex: 1; overflow-y: auto; padding: 24px; background: #F9FAFB; display: flex; flex-direction: column; gap: 16px; }
    .msg-row { display: flex; gap: 8px; }
    .msg-row.agent { align-items: flex-start; }
    .msg-row.user { justify-content: flex-end; }
    .msg-row.system { justify-content: center; }
    .bot-icon { width: 32px; height: 32px; border-radius: 16px; background: #1E40AF; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; flex-shrink: 0; }
    .msg-group { display: flex; flex-direction: column; gap: 4px; }
    .msg-group.right { align-items: flex-end; }
    .msg-bubble { padding: 12px 16px; font-size: 14px; line-height: 1.5; max-width: 420px; white-space: pre-wrap; }
    .agent-bubble { background: white; color: #1F2937; border-radius: 16px 16px 16px 4px; border: 1px solid #E5E7EB; }
    .user-bubble { background: #1E40AF; color: white; border-radius: 16px 16px 4px 16px; }
    .system-bubble { background: #FEF3C7; color: #92400E; border-radius: 12px; font-size: 13px; }
    .msg-time { font-size: 11px; color: #9CA3AF; }

    /* Chat Input */
    .chat-input { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-top: 1px solid #E5E7EB; }
    .chat-input-field { flex: 1; padding: 12px 16px; background: #F3F4F6; border: none; border-radius: 24px; font-size: 14px; outline: none; color: #374151; }
    .chat-input-field::placeholder { color: #9CA3AF; }
    .btn-send { width: 44px; height: 44px; border-radius: 22px; background: #1E40AF; color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; flex-shrink: 0; }
    .btn-send:hover { background: #1E3A8A; }

    .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #9CA3AF; }
    .empty-icon { font-size: 48px; }
    .empty-state { padding: 32px; text-align: center; color: #9CA3AF; font-size: 14px; }

    /* 3-column grid */
    .conv-grid { transition: grid-template-columns 0.2s ease; }

    /* Client panel */
    .client-panel { background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; overflow-y: auto; }
    .client-panel-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #E5E7EB; font-size: 13px; font-weight: 600; color: #1F2937; }
    .btn-close-panel { background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 16px; }
    .client-identity { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #F3F4F6; }
    .client-avatar { width: 48px; height: 48px; border-radius: 24px; background: #DBEAFE; color: #1E40AF; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .client-name-block { display: flex; flex-direction: column; gap: 2px; }
    .client-name { font-size: 14px; font-weight: 600; color: #1F2937; }
    .client-company { font-size: 12px; color: #6B7280; }
    .client-debt-card { margin: 16px; padding: 16px; background: #F9FAFB; border-radius: 10px; display: flex; flex-direction: column; gap: 4px; }
    .debt-label { font-size: 12px; color: #6B7280; }
    .debt-amount { font-size: 24px; font-weight: 700; color: #1F2937; }
    .debt-badge { align-self: flex-start; padding: 2px 10px; background: #FEE2E2; color: #DC2626; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .client-section { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; }
    .section-title { font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 8px; }
    .invoice-row { display: flex; align-items: center; gap: 8px; padding: 8px; background: #F9FAFB; border-radius: 6px; }
    .invoice-num { font-size: 11px; color: #6B7280; flex: 1; }
    .invoice-amount { font-size: 12px; font-weight: 600; color: #1F2937; }
    .invoice-status { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
    .invoice-status-overdue { background: #FEE2E2; color: #DC2626; }
    .invoice-status-pending { background: #FEF3C7; color: #D97706; }
    .invoice-status-paid { background: #D1FAE5; color: #059669; }
    .no-data { font-size: 12px; color: #9CA3AF; text-align: center; padding: 8px; }
    .client-actions { padding: 16px; display: flex; flex-direction: column; gap: 8px; margin-top: auto; border-top: 1px solid #F3F4F6; }
    .btn-action-green { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: #059669; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-action-green:hover { background: #047857; }
    .btn-action-outline { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: white; color: #1E40AF; border: 1.5px solid #1E40AF; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-action-outline:hover { background: #EFF6FF; }
  `]
})
export class ConversacionesComponent implements OnInit {
  protected readonly service = inject(AgenteIaService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly CONVERSATION_STATUS_LABELS = CONVERSATION_STATUS_LABELS;
  readonly CHANNEL_LABELS = CHANNEL_LABELS;
  readonly SENTIMENT_LABELS = SENTIMENT_LABELS;
  readonly MESSAGE_ROLE_LABELS = MESSAGE_ROLE_LABELS;

  newMessage = '';
  debtor = signal<any>(null);
  debtorInvoices = signal<any[]>([]);

  ngOnInit(): void {
    this.service.loadConversations({ page: 1, size: 50 });
  }

  async selectConversation(id: string): Promise<void> {
    await this.service.loadConversation(id);
    await this.service.loadMessages(id);
    this.debtor.set(null);
    this.debtorInvoices.set([]);
    const conv = this.service.selectedConversation();
    if (conv?.debtorId) {
      try {
        const [debtor, invoicesResp] = await Promise.all([
          firstValueFrom(this.http.get<any>(`${this.apiUrl}/clients/${conv.debtorId}`)),
          firstValueFrom(this.http.get<any>(`${this.apiUrl}/clients/${conv.debtorId}/invoices`)),
        ]);
        this.debtor.set(debtor);
        this.debtorInvoices.set(invoicesResp?.items || invoicesResp || []);
      } catch {
        // debtor not found, panel stays hidden
      }
    }
  }

  closeClientPanel(): void {
    this.debtor.set(null);
    this.debtorInvoices.set([]);
  }

  getDebtorInitials(): string {
    const name = this.debtor()?.name || '';
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'DE';
  }

  getTotalDebt(): number {
    return this.debtorInvoices().reduce((sum: number, inv: any) => {
      if (inv.status !== 'paid') return sum + (inv.amount || 0);
      return sum;
    }, 0);
  }

  getOverdueDays(): number {
    const oldest = this.debtorInvoices()
      .filter((inv: any) => inv.status === 'overdue' && inv.due_date)
      .map((inv: any) => new Date(inv.due_date).getTime());
    if (!oldest.length) return 0;
    const diff = Date.now() - Math.min(...oldest);
    return Math.floor(diff / 86400000);
  }

  getInvoiceStatusClass(status: string): string {
    if (status === 'overdue') return 'invoice-status invoice-status-overdue';
    if (status === 'paid') return 'invoice-status invoice-status-paid';
    return 'invoice-status invoice-status-pending';
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() || !this.service.selectedConversation()) return;
    await this.service.sendMessage(this.service.selectedConversation()!.id, {
      role: 'agent',
      content: this.newMessage.trim(),
    });
    this.newMessage = '';
  }

  async escalateConversation(): Promise<void> {
    const conv = this.service.selectedConversation();
    if (!conv) return;
    await this.service.updateConversation(conv.id, { status: 'escalated', escalation_reason: 'client_request' });
  }

  getInitials(conv: any): string {
    if (conv.debtorName) {
      return conv.debtorName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    }
    return (conv.debtorId?.slice(0, 2) || 'XX').toUpperCase();
  }

  getAvatarBg(status: string): string {
    switch (status) {
      case 'active': return '#DBEAFE';
      case 'resolved': return '#D1FAE5';
      case 'escalated': return '#FEE2E2';
      default: return '#FEF3C7';
    }
  }

  getAvatarColor(status: string): string {
    switch (status) {
      case 'active': return '#1E40AF';
      case 'resolved': return '#059669';
      case 'escalated': return '#DC2626';
      default: return '#D97706';
    }
  }

  getPreviewText(conv: any): string {
    if (conv.lastMessage) return conv.lastMessage;
    switch (conv.status) {
      case 'escalated': return 'Escalado a agente humano';
      case 'resolved': return 'Conversación resuelta';
      default: return 'Esperando respuesta...';
    }
  }

  getPreviewColor(status: string): string {
    switch (status) {
      case 'escalated': return '#DC2626';
      case 'resolved': return '#059669';
      default: return '#6B7280';
    }
  }

  getRelativeTime(dateStr: Date | string | undefined): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
  }

  formatTime(date: any): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  }
}
