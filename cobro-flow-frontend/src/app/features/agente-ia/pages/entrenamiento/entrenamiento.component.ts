import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgenteIaService } from '../../services/agente-ia.service';
import {
  DOC_STATUS_LABELS, SESSION_STATUS_LABELS, RULE_PRIORITY_LABELS,
} from '../../models/agente-ia.models';

@Component({
  selector: 'app-entrenamiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="training-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>Entrenamiento del Agente</h1>
          <p>Mejora las respuestas y capacidades de tu agente IA</p>
        </div>
        <div class="header-right">
          <button class="btn-train" (click)="openTrainingModal()">
            <i class="lucide-zap"></i>
            Iniciar Entrenamiento
          </button>
        </div>
      </header>

      @if (service.error()) {
        <div class="error-banner">
          <i class="lucide-alert-circle"></i>
          <span>{{ service.error() }}</span>
        </div>
      }

      <!-- Two Column Layout -->
      <div class="train-grid">
        <!-- Left Column -->
        <div class="left-col">
          <!-- Knowledge Base Card -->
          <div class="card">
            <div class="card-header">
              <h3>Base de Conocimiento</h3>
              <button class="btn-upload" (click)="openDocumentModal()">
                <i class="lucide-upload"></i> Subir Archivo
              </button>
            </div>
            <div class="card-body doc-list">
              @for (doc of service.trainingDocuments(); track doc.id) {
                <div class="doc-item">
                  <div class="doc-icon-bg" [class]="getDocIconClass(doc.fileType)">
                    <i [class]="getDocIcon(doc.fileType)"></i>
                  </div>
                  <div class="doc-info">
                    <span class="doc-name">{{ doc.name }}</span>
                    <span class="doc-meta">
                      {{ doc.fileType || 'Texto' }}
                      @if (doc.fileSizeBytes) { &middot; {{ formatFileSize(doc.fileSizeBytes) }} }
                      @if (doc.chunkCount) { &middot; {{ doc.chunkCount }} chunks }
                    </span>
                  </div>
                  <div class="doc-status" [class]="'status-' + doc.status">
                    {{ DOC_STATUS_LABELS[doc.status] }}
                  </div>
                </div>
              }
              @if (service.trainingDocuments().length === 0) {
                <div class="empty-state">
                  <p>No hay documentos. Sube archivos para entrenar al agente.</p>
                </div>
              }
            </div>
          </div>

          <!-- Feedback Card -->
          <div class="card">
            <div class="card-header"><h3>Feedback de Conversaciones</h3></div>
            <div class="card-body feedback-content">
              <p class="feedback-desc">Revisa y corrige respuestas del agente para mejorar su aprendizaje</p>
              @for (ex of service.conversationExamples().slice(0, 3); track ex.id) {
                <div class="feedback-card">
                  <div class="feedback-header">
                    <div class="feedback-badge">
                      <i class="lucide-alert-triangle"></i>
                      Respuesta mejorable
                    </div>
                  </div>
                  <p class="feedback-question">Cliente: {{ ex.question }}</p>
                  <p class="feedback-answer">Agente: "{{ ex.answer }}"</p>
                  <div class="feedback-actions">
                    <button class="btn-feedback approve" (click)="approveExample(ex)">
                      <i class="lucide-check"></i> Aprobar
                    </button>
                    <button class="btn-feedback edit" (click)="editExample(ex)">
                      <i class="lucide-pencil"></i> Corregir
                    </button>
                    <button class="btn-feedback reject" (click)="rejectExample(ex)">
                      <i class="lucide-x"></i> Rechazar
                    </button>
                  </div>
                </div>
              }
              @if (service.conversationExamples().length === 0) {
                <div class="empty-state"><p>No hay feedback pendiente</p></div>
              }
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-col">
          <!-- Model Stats Card -->
          <div class="card">
            <div class="card-header"><h3>Estado del Modelo</h3></div>
            <div class="card-body stats-content">
              <div class="stat-row">
                <div class="stat-header">
                  <span class="stat-label">Precisión de Respuestas</span>
                  <span class="stat-value green">94.2%</span>
                </div>
                <div class="stat-bar"><div class="stat-fill green" style="width: 94.2%;"></div></div>
              </div>
              <div class="stat-row">
                <div class="stat-header">
                  <span class="stat-label">Detección de Intención</span>
                  <span class="stat-value blue">89.7%</span>
                </div>
                <div class="stat-bar"><div class="stat-fill blue" style="width: 89.7%;"></div></div>
              </div>
              <div class="stat-row">
                <div class="stat-header">
                  <span class="stat-label">Análisis de Sentimiento</span>
                  <span class="stat-value purple">92.1%</span>
                </div>
                <div class="stat-bar"><div class="stat-fill purple" style="width: 92.1%;"></div></div>
              </div>
            </div>
          </div>

          <!-- Training History Card -->
          <div class="card">
            <div class="card-header"><h3>Historial de Entrenamiento</h3></div>
            <div class="card-body history-content">
              @for (session of service.trainingSessions().slice(0, 5); track session.id) {
                <div class="history-item">
                  <div class="history-icon">
                    <i class="lucide-check"></i>
                  </div>
                  <div class="history-info">
                    <span class="history-title">{{ session.description || 'Sesión de entrenamiento' }}</span>
                    <span class="history-meta">
                      {{ formatDate(session.startedAt) }}
                      &middot; {{ session.documentsProcessed }} docs, {{ session.rulesApplied }} reglas
                    </span>
                  </div>
                </div>
              }
              @if (service.trainingSessions().length === 0) {
                <div class="empty-state"><p>No hay sesiones previas</p></div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- ============ MODAL: Subir Documento ============ -->
      @if (showDocumentModal()) {
        <div class="modal-overlay" (click)="showDocumentModal.set(false)">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Subir Documento</h3>
              <button class="modal-close" (click)="showDocumentModal.set(false)"><i class="lucide-x"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Nombre del documento</label>
                <input type="text" class="form-input" [ngModel]="docForm.name" (ngModelChange)="docForm.name = $event" placeholder="Ej: Política de cobranza 2025" />
              </div>
              <div class="form-group">
                <label>Tipo de archivo</label>
                <select class="form-select" [ngModel]="docForm.fileType" (ngModelChange)="docForm.fileType = $event">
                  <option value="text">Texto plano</option>
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div class="form-group">
                <label>Contenido del documento</label>
                <textarea class="form-textarea" rows="8" [ngModel]="docForm.content" (ngModelChange)="docForm.content = $event" placeholder="Pega aquí el contenido del documento o instrucciones para el agente..."></textarea>
              </div>
              <div class="form-hint">
                <i class="lucide-info"></i>
                <span>El documento será procesado y dividido en fragmentos para optimizar las respuestas del agente.</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showDocumentModal.set(false)">Cancelar</button>
              <button class="btn-primary" (click)="submitDocument()" [disabled]="!docForm.name">
                <i class="lucide-upload"></i> Subir Documento
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ============ MODAL: Iniciar Entrenamiento ============ -->
      @if (showTrainingModal()) {
        <div class="modal-overlay" (click)="showTrainingModal.set(false)">
          <div class="modal-panel modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Iniciar Entrenamiento</h3>
              <button class="modal-close" (click)="showTrainingModal.set(false)"><i class="lucide-x"></i></button>
            </div>
            <div class="modal-body">
              <div class="training-info">
                <div class="training-icon-bg">
                  <i class="lucide-zap"></i>
                </div>
                <p>Se procesarán todos los documentos pendientes y se aplicarán las reglas de negocio actualizadas.</p>
              </div>
              <div class="form-group">
                <label>Descripción de la sesión (opcional)</label>
                <textarea class="form-textarea" rows="3" [ngModel]="trainingDesc" (ngModelChange)="trainingDesc = $event" placeholder="Ej: Actualización de políticas de cobro Q1 2025"></textarea>
              </div>
              <div class="training-summary">
                <div class="summary-row">
                  <span class="summary-label">Documentos pendientes</span>
                  <span class="summary-value">{{ getPendingDocsCount() }}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Reglas activas</span>
                  <span class="summary-value">{{ getActiveRulesCount() }}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Ejemplos de conversación</span>
                  <span class="summary-value">{{ service.conversationExamples().length }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showTrainingModal.set(false)">Cancelar</button>
              <button class="btn-primary" (click)="submitTraining()">
                <i class="lucide-zap"></i> Iniciar Entrenamiento
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ============ MODAL: Editar Ejemplo ============ -->
      @if (showEditExampleModal()) {
        <div class="modal-overlay" (click)="showEditExampleModal.set(false)">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Corregir Respuesta</h3>
              <button class="modal-close" (click)="showEditExampleModal.set(false)"><i class="lucide-x"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Pregunta del cliente</label>
                <textarea class="form-textarea" rows="3" [ngModel]="editExampleForm.question" (ngModelChange)="editExampleForm.question = $event"></textarea>
              </div>
              <div class="form-group">
                <label>Respuesta corregida del agente</label>
                <textarea class="form-textarea" rows="5" [ngModel]="editExampleForm.answer" (ngModelChange)="editExampleForm.answer = $event"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showEditExampleModal.set(false)">Cancelar</button>
              <button class="btn-primary" (click)="submitEditExample()" [disabled]="!editExampleForm.question || !editExampleForm.answer">
                <i class="lucide-check"></i> Guardar Corrección
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .training-page { display: flex; flex-direction: column; gap: 24px; padding: 32px; }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { font-size: 28px; font-weight: 700; color: #1F2937; margin: 0; }
    .header-left p { font-size: 14px; color: #6B7280; margin: 4px 0 0; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .btn-train { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #1E40AF; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-train:hover { background: #1E3A8A; }

    /* Grid */
    .train-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
    .left-col, .right-col { display: flex; flex-direction: column; gap: 24px; }

    /* Cards */
    .card { background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #E5E7EB; }
    .card-header h3 { font-size: 16px; font-weight: 600; color: #1F2937; margin: 0; }
    .card-body { padding: 20px; }

    .btn-upload { display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: #EFF6FF; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; color: #1E40AF; cursor: pointer; }
    .btn-upload:hover { background: #DBEAFE; }

    /* Document List */
    .doc-list { display: flex; flex-direction: column; gap: 12px; }
    .doc-item { display: flex; align-items: center; gap: 12px; padding: 16px; background: #F9FAFB; border-radius: 10px; border: 1px solid #E5E7EB; }
    .doc-icon-bg { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 20px; }
    .doc-icon-bg.bg-blue { background: #DBEAFE; color: #1E40AF; }
    .doc-icon-bg.bg-amber { background: #FEF3C7; color: #D97706; }
    .doc-icon-bg.bg-purple { background: #F3E8FF; color: #7C3AED; }
    .doc-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .doc-name { font-size: 14px; font-weight: 600; color: #1F2937; }
    .doc-meta { font-size: 12px; color: #6B7280; }
    .doc-status { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .doc-status.status-processed { background: #D1FAE5; color: #059669; }
    .doc-status.status-processing { background: #FEF3C7; color: #D97706; }
    .doc-status.status-pending { background: #F3F4F6; color: #6B7280; }
    .doc-status.status-failed { background: #FEE2E2; color: #DC2626; }

    /* Feedback */
    .feedback-content { display: flex; flex-direction: column; gap: 12px; }
    .feedback-desc { font-size: 13px; color: #6B7280; margin: 0; }
    .feedback-card { padding: 16px; background: #FEF3C7; border-radius: 10px; display: flex; flex-direction: column; gap: 12px; }
    .feedback-header { display: flex; justify-content: space-between; align-items: center; }
    .feedback-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #92400E; }
    .feedback-question { font-size: 13px; font-weight: 500; color: #78350F; margin: 0; }
    .feedback-answer { font-size: 13px; color: #92400E; margin: 0; }
    .feedback-actions { display: flex; gap: 8px; }
    .btn-feedback { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .btn-feedback.approve { background: #D1FAE5; color: #059669; }
    .btn-feedback.edit { background: #DBEAFE; color: #1E40AF; }
    .btn-feedback.reject { background: #FEE2E2; color: #DC2626; }

    /* Stats */
    .stats-content { display: flex; flex-direction: column; gap: 20px; }
    .stat-row { display: flex; flex-direction: column; gap: 8px; }
    .stat-header { display: flex; justify-content: space-between; align-items: center; }
    .stat-label { font-size: 14px; font-weight: 500; color: #374151; }
    .stat-value { font-size: 14px; font-weight: 700; }
    .stat-value.green { color: #059669; }
    .stat-value.blue { color: #1E40AF; }
    .stat-value.purple { color: #7C3AED; }
    .stat-bar { height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden; }
    .stat-fill { height: 100%; border-radius: 4px; }
    .stat-fill.green { background: #10B981; }
    .stat-fill.blue { background: #1E40AF; }
    .stat-fill.purple { background: #7C3AED; }

    /* History */
    .history-content { display: flex; flex-direction: column; gap: 12px; }
    .history-item { display: flex; align-items: center; gap: 12px; }
    .history-icon { width: 32px; height: 32px; border-radius: 16px; background: #D1FAE5; display: flex; align-items: center; justify-content: center; color: #059669; font-size: 16px; flex-shrink: 0; }
    .history-info { display: flex; flex-direction: column; gap: 2px; }
    .history-title { font-size: 13px; font-weight: 500; color: #1F2937; }
    .history-meta { font-size: 11px; color: #6B7280; }

    .empty-state { padding: 24px; text-align: center; color: #9CA3AF; font-size: 13px; }

    .error-banner { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #FEE2E2; border: 1px solid #FECACA; border-radius: 8px; color: #DC2626; font-size: 14px; }
    .error-banner i { flex-shrink: 0; }

    /* =========== Modal Styles =========== */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.15s ease-out; }
    .modal-panel { background: white; border-radius: 16px; width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); animation: slideUp 0.2s ease-out; }
    .modal-panel.modal-sm { width: 440px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 24px 0; }
    .modal-header h3 { font-size: 18px; font-weight: 700; color: #1F2937; margin: 0; }
    .modal-close { background: none; border: none; cursor: pointer; color: #6B7280; font-size: 20px; padding: 4px; border-radius: 6px; }
    .modal-close:hover { background: #F3F4F6; }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px 24px; }

    /* Form fields */
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 14px; font-weight: 500; color: #374151; }
    .form-input, .form-textarea, .form-select { padding: 12px 16px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 14px; color: #1F2937; background: white; font-family: inherit; }
    .form-input:focus, .form-textarea:focus, .form-select:focus { outline: none; border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .form-textarea { resize: vertical; }
    .form-hint { display: flex; gap: 8px; padding: 12px; background: #EFF6FF; border-radius: 8px; align-items: flex-start; }
    .form-hint i { font-size: 16px; color: #1E40AF; flex-shrink: 0; margin-top: 1px; }
    .form-hint span { font-size: 12px; color: #1E40AF; line-height: 1.4; }

    .btn-cancel { padding: 10px 20px; background: #F3F4F6; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; color: #374151; cursor: pointer; }
    .btn-cancel:hover { background: #E5E7EB; }
    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: #1E40AF; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; color: white; cursor: pointer; }
    .btn-primary:hover { background: #1E3A8A; }
    .btn-primary:disabled { background: #93C5FD; cursor: not-allowed; }

    /* Training modal specifics */
    .training-info { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; }
    .training-icon-bg { width: 56px; height: 56px; border-radius: 28px; background: #DBEAFE; display: flex; align-items: center; justify-content: center; color: #1E40AF; font-size: 28px; }
    .training-info p { font-size: 14px; color: #374151; margin: 0; line-height: 1.5; }
    .training-summary { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #F9FAFB; border-radius: 10px; border: 1px solid #E5E7EB; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; }
    .summary-label { font-size: 13px; color: #6B7280; }
    .summary-value { font-size: 14px; font-weight: 600; color: #1F2937; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EntrenamientoComponent implements OnInit {
  protected readonly service = inject(AgenteIaService);
  private readonly router = inject(Router);

  readonly DOC_STATUS_LABELS = DOC_STATUS_LABELS;
  readonly SESSION_STATUS_LABELS = SESSION_STATUS_LABELS;
  readonly RULE_PRIORITY_LABELS = RULE_PRIORITY_LABELS;

  // Modal visibility signals
  readonly showDocumentModal = signal(false);
  readonly showTrainingModal = signal(false);
  readonly showEditExampleModal = signal(false);

  // Form state
  docForm = { name: '', content: '', fileType: 'text' };
  trainingDesc = '';
  editExampleForm = { id: '', question: '', answer: '' };

  ngOnInit(): void {
    this.service.loadTrainingDocuments();
    this.service.loadBusinessRules();
    this.service.loadConversationExamples();
    this.service.loadTrainingSessions();
  }

  // ---- Document modal ----
  openDocumentModal(): void {
    this.docForm = { name: '', content: '', fileType: 'text' };
    this.showDocumentModal.set(true);
  }

  submitDocument(): void {
    if (!this.docForm.name) return;
    this.service.createTrainingDocument({
      name: this.docForm.name,
      content_text: this.docForm.content || '',
      file_type: this.docForm.fileType,
    });
    this.showDocumentModal.set(false);
  }

  // ---- Training modal ----
  openTrainingModal(): void {
    this.trainingDesc = '';
    this.showTrainingModal.set(true);
  }

  async submitTraining(): Promise<void> {
    this.showTrainingModal.set(false);
    await this.service.startTrainingSession(this.trainingDesc || undefined);
  }

  // ---- Feedback actions ----
  async approveExample(ex: any): Promise<void> {
    await this.service.updateConversationExample(ex.id, { is_active: true });
  }

  editExample(ex: any): void {
    this.editExampleForm = { id: ex.id, question: ex.question, answer: ex.answer };
    this.showEditExampleModal.set(true);
  }

  async submitEditExample(): Promise<void> {
    if (!this.editExampleForm.question || !this.editExampleForm.answer) return;
    await this.service.updateConversationExample(this.editExampleForm.id, {
      question: this.editExampleForm.question,
      answer: this.editExampleForm.answer,
      is_active: true,
    });
    this.showEditExampleModal.set(false);
  }

  async rejectExample(ex: any): Promise<void> {
    await this.service.deleteConversationExample(ex.id);
  }

  getPendingDocsCount(): number {
    return this.service.trainingDocuments().filter(d => d.status === 'pending' || d.status === 'processing').length;
  }

  getActiveRulesCount(): number {
    return this.service.businessRules().filter(r => r.isActive).length;
  }

  // ---- Helpers ----
  getDocIconClass(fileType: string | null | undefined): string {
    switch (fileType) {
      case 'pdf': return 'bg-blue';
      case 'csv':
      case 'xlsx': return 'bg-amber';
      default: return 'bg-purple';
    }
  }

  getDocIcon(fileType: string | null | undefined): string {
    switch (fileType) {
      case 'pdf': return 'lucide-file-text';
      case 'csv':
      case 'xlsx': return 'lucide-file-spreadsheet';
      default: return 'lucide-file';
    }
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
}
