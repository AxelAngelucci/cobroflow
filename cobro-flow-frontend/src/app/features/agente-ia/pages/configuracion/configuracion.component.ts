import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgenteIaService } from '../../services/agente-ia.service';
import {
  CHANNEL_LABELS, ESCALATION_REASON_LABELS, DAY_LABELS,
  ChannelType, EscalationReason,
} from '../../models/agente-ia.models';

type ConfigTab = 'general' | 'canales' | 'horarios' | 'escalado' | 'integraciones';

@Component({
  selector: 'app-configuracion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="config-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>Configuración del Agente</h1>
          <p>Personaliza el comportamiento y canales de tu agente IA</p>
        </div>
        <div class="header-right">
          <button class="btn-save" (click)="saveConfig()">
            <i class="lucide-save"></i>
            Guardar Cambios
          </button>
        </div>
      </header>

      <!-- Tabs -->
      <div class="config-tabs">
        @for (tab of tabs; track tab.key) {
          <button class="tab" [class.active]="activeTab() === tab.key" (click)="activeTab.set(tab.key)">
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- General Tab Content -->
      @if (activeTab() === 'general') {
        <div class="config-grid">
          <!-- Left Column -->
          <div class="left-col">
            <!-- General Info Card -->
            <div class="card">
              <div class="card-header"><h3>Información General</h3></div>
              <div class="card-body form-fields">
                <div class="form-group">
                  <label>Nombre del Agente</label>
                  <input type="text" class="form-input" [ngModel]="service.config()?.name" (ngModelChange)="setDraft('name', $event)" placeholder="LUNA" />
                </div>
                <div class="form-group">
                  <label>Descripción</label>
                  <textarea class="form-textarea" rows="3" [ngModel]="configDraft['description'] ?? ''" (ngModelChange)="setDraft('description', $event)" placeholder="Agente de cobranza inteligente que adapta su tono según el nivel de morosidad del cliente."></textarea>
                </div>
                <div class="form-group">
                  <label>Idioma Principal</label>
                  <select class="form-select" [ngModel]="configDraft['language'] ?? 'es'" (ngModelChange)="setDraft('language', $event)">
                    <option value="es">Español (Latinoamérica)</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Behavior Card -->
            <div class="card">
              <div class="card-header"><h3>Comportamiento del Agente</h3></div>
              <div class="card-body toggle-list">
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-title">Modo Piloto Automático</span>
                    <span class="toggle-desc">El agente responde automáticamente sin supervisión</span>
                  </div>
                  <label class="switch">
                    <input type="checkbox" [ngModel]="service.config()?.autoRespond ?? true" (ngModelChange)="setDraft('auto_respond', $event)" />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-title">Análisis de Sentimiento</span>
                    <span class="toggle-desc">Detectar emociones y adaptar respuestas</span>
                  </div>
                  <label class="switch">
                    <input type="checkbox" [ngModel]="configDraft['sentiment_analysis'] ?? true" (ngModelChange)="setDraft('sentiment_analysis', $event)" />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-title">Escalar automáticamente</span>
                    <span class="toggle-desc">Transferir a humano si detecta frustración</span>
                  </div>
                  <label class="switch">
                    <input type="checkbox" [ngModel]="configDraft['auto_escalate'] ?? true" (ngModelChange)="setDraft('auto_escalate', $event)" />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-title">Generar links de pago</span>
                    <span class="toggle-desc">Crear enlaces personalizados automáticamente</span>
                  </div>
                  <label class="switch">
                    <input type="checkbox" [ngModel]="configDraft['generate_payment_links'] ?? false" (ngModelChange)="setDraft('generate_payment_links', $event)" />
                    <span class="switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="right-col">
            <!-- Connected Channels -->
            <div class="card">
              <div class="card-header">
                <h3>Canales Conectados</h3>
                <button class="btn-add" (click)="openChannelModal()">
                  <i class="lucide-plus"></i> Configurar
                </button>
              </div>
              <div class="card-body channel-list">
                <div class="channel-item">
                  <div class="channel-icon-bg whatsapp"><i class="lucide-message-circle ch-ico"></i></div>
                  <div class="channel-info">
                    <span class="channel-name">WhatsApp Business</span>
                    <span class="channel-meta">API conectada &bull; Activo</span>
                  </div>
                  <i class="lucide-settings ch-settings"></i>
                </div>
                <div class="channel-item">
                  <div class="channel-icon-bg email"><i class="lucide-mail ch-ico"></i></div>
                  <div class="channel-info">
                    <span class="channel-name">Email SMTP</span>
                    <span class="channel-meta">Configurado &bull; Activo</span>
                  </div>
                  <i class="lucide-settings ch-settings"></i>
                </div>
                <div class="channel-item">
                  <div class="channel-icon-bg sms"><i class="lucide-smartphone ch-ico"></i></div>
                  <div class="channel-info">
                    <span class="channel-name">SMS Twilio</span>
                    <span class="channel-meta">Configurado &bull; Activo</span>
                  </div>
                  <i class="lucide-settings ch-settings"></i>
                </div>
                <div class="channel-item">
                  <div class="channel-icon-bg voice"><i class="lucide-phone ch-ico"></i></div>
                  <div class="channel-info">
                    <span class="channel-name">Llamadas VoIP</span>
                    <span class="channel-meta">Pendiente configuración</span>
                  </div>
                  <i class="lucide-settings ch-settings"></i>
                </div>
                <div class="channel-note">
                  <i class="lucide-info note-icon"></i>
                  <span>Los canales se activan por cada workflow. Aquí solo se configuran las credenciales.</span>
                </div>
              </div>
            </div>

            <!-- Operation Limits -->
            <div class="card">
              <div class="card-header"><h3>Límites de Operación</h3></div>
              <div class="card-body limits-list">
                <div class="limit-item">
                  <div class="limit-header">
                    <span class="limit-label">Mensajes por día</span>
                    <span class="limit-value">5,000</span>
                  </div>
                  <div class="limit-bar"><div class="limit-fill" style="width: 65%;"></div></div>
                  <span class="limit-text">3,247 usados hoy</span>
                </div>
                <div class="limit-item">
                  <div class="limit-header">
                    <span class="limit-label">Llamadas por hora</span>
                    <span class="limit-value">100</span>
                  </div>
                  <div class="limit-bar"><div class="limit-fill" style="width: 23%;"></div></div>
                  <span class="limit-text">23 realizadas esta hora</span>
                </div>
                <div class="limit-item">
                  <div class="limit-header">
                    <span class="limit-label">Monto máximo negociable</span>
                    <span class="limit-value">$50,000</span>
                  </div>
                  <span class="limit-text">Montos mayores requieren aprobación humana</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Canales Tab -->
      @if (activeTab() === 'canales') {
        <div class="config-grid single">
          <div class="card">
            <div class="card-header">
              <h3>Canales de Comunicación</h3>
              <button class="btn-add" (click)="openChannelModal()">
                <i class="lucide-plus"></i> Agregar Canal
              </button>
            </div>
            <div class="card-body">
              @for (ch of service.channelConfigs(); track ch.id) {
                <div class="list-item">
                  <div class="list-item-info">
                    <span class="list-item-title">{{ CHANNEL_LABELS[ch.channel] }}</span>
                    <span class="list-item-sub">Max {{ ch.maxMessagesPerConversation }} mensajes/conversación</span>
                  </div>
                  <div class="list-item-actions">
                    <span class="status-pill" [class.pill-active]="ch.isEnabled" [class.pill-inactive]="!ch.isEnabled">
                      {{ ch.isEnabled ? 'Activo' : 'Inactivo' }}
                    </span>
                    <button class="btn-icon" (click)="toggleChannel(ch)"><i class="lucide-settings"></i></button>
                    <button class="btn-icon danger" (click)="openDeleteConfirm('channel', ch.id, CHANNEL_LABELS[ch.channel])"><i class="lucide-trash-2"></i></button>
                  </div>
                </div>
              }
              @if (service.channelConfigs().length === 0) {
                <div class="empty-state">No hay canales configurados</div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Horarios Tab -->
      @if (activeTab() === 'horarios') {
        <div class="config-grid single">
          <div class="card">
            <div class="card-header">
              <h3>Horarios de Operación</h3>
              <button class="btn-add" (click)="openHoursModal()">
                <i class="lucide-plus"></i> Agregar Horario
              </button>
            </div>
            <div class="card-body">
              @for (h of service.operatingHours(); track h.id) {
                <div class="list-item">
                  <div class="list-item-info">
                    <span class="list-item-title">{{ DAY_LABELS[h.dayOfWeek] }}</span>
                    <span class="list-item-sub">{{ h.startTime }} - {{ h.endTime }} ({{ h.timezone }})</span>
                  </div>
                  <div class="list-item-actions">
                    <span class="status-pill" [class.pill-active]="h.isActive" [class.pill-inactive]="!h.isActive">
                      {{ h.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                    <button class="btn-icon danger" (click)="openDeleteConfirm('hours', h.id, DAY_LABELS[h.dayOfWeek])"><i class="lucide-trash-2"></i></button>
                  </div>
                </div>
              }
              @if (service.operatingHours().length === 0) {
                <div class="empty-state">No hay horarios configurados</div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Escalado Tab -->
      @if (activeTab() === 'escalado') {
        <div class="config-grid single">
          <div class="card">
            <div class="card-header">
              <h3>Reglas de Escalación</h3>
              <button class="btn-add" (click)="openRuleModal()">
                <i class="lucide-plus"></i> Nueva Regla
              </button>
            </div>
            <div class="card-body">
              @for (rule of service.escalationRules(); track rule.id) {
                <div class="list-item">
                  <div class="list-item-info">
                    <span class="list-item-title">{{ ESCALATION_REASON_LABELS[rule.reason] }}</span>
                    <span class="list-item-sub">Prioridad: {{ rule.priority }}</span>
                  </div>
                  <div class="list-item-actions">
                    <span class="status-pill" [class.pill-active]="rule.isActive" [class.pill-inactive]="!rule.isActive">
                      {{ rule.isActive ? 'Activa' : 'Inactiva' }}
                    </span>
                    <button class="btn-icon danger" (click)="openDeleteConfirm('rule', rule.id, ESCALATION_REASON_LABELS[rule.reason])"><i class="lucide-trash-2"></i></button>
                  </div>
                </div>
              }
              @if (service.escalationRules().length === 0) {
                <div class="empty-state">No hay reglas de escalación</div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Integraciones Tab -->
      @if (activeTab() === 'integraciones') {
        <div class="config-grid single">
          <div class="card">
            <div class="card-header"><h3>Integraciones</h3></div>
            <div class="card-body">
              <div class="empty-state">Las integraciones estarán disponibles próximamente</div>
            </div>
          </div>
        </div>
      }

      <!-- ============ MODAL: Agregar Canal ============ -->
      @if (showChannelModal()) {
        <div class="modal-overlay" (click)="showChannelModal.set(false)">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Agregar Canal</h3>
              <button class="modal-close" (click)="showChannelModal.set(false)"><i class="lucide-x"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Tipo de Canal</label>
                <select class="form-select" [ngModel]="channelForm.channel" (ngModelChange)="channelForm.channel = $event">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="call">Llamada</option>
                  <option value="ai_voice">IA Voice</option>
                </select>
              </div>
              <div class="form-group">
                <label>Máx. mensajes por conversación</label>
                <input type="number" class="form-input" [ngModel]="channelForm.maxMessages" (ngModelChange)="channelForm.maxMessages = $event" min="1" max="500" />
              </div>
              <div class="form-group">
                <label>Mensaje de bienvenida (opcional)</label>
                <textarea class="form-textarea" rows="3" [ngModel]="channelForm.greeting" (ngModelChange)="channelForm.greeting = $event" placeholder="Hola, soy LUNA. ¿En qué puedo ayudarte?"></textarea>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="toggle-title">Habilitado</span>
                  <span class="toggle-desc">Activar este canal inmediatamente</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [ngModel]="channelForm.isEnabled" (ngModelChange)="channelForm.isEnabled = $event" />
                  <span class="switch-slider"></span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showChannelModal.set(false)">Cancelar</button>
              <button class="btn-primary" (click)="submitChannel()">Agregar Canal</button>
            </div>
          </div>
        </div>
      }

      <!-- ============ MODAL: Agregar Horario ============ -->
      @if (showHoursModal()) {
        <div class="modal-overlay" (click)="showHoursModal.set(false)">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Agregar Horario de Operación</h3>
              <button class="modal-close" (click)="showHoursModal.set(false)"><i class="lucide-x"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Día de la semana</label>
                <select class="form-select" [ngModel]="hoursForm.dayOfWeek" (ngModelChange)="hoursForm.dayOfWeek = $event">
                  <option [ngValue]="0">Lunes</option>
                  <option [ngValue]="1">Martes</option>
                  <option [ngValue]="2">Miércoles</option>
                  <option [ngValue]="3">Jueves</option>
                  <option [ngValue]="4">Viernes</option>
                  <option [ngValue]="5">Sábado</option>
                  <option [ngValue]="6">Domingo</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Hora inicio</label>
                  <input type="time" class="form-input" [ngModel]="hoursForm.startTime" (ngModelChange)="hoursForm.startTime = $event" />
                </div>
                <div class="form-group">
                  <label>Hora fin</label>
                  <input type="time" class="form-input" [ngModel]="hoursForm.endTime" (ngModelChange)="hoursForm.endTime = $event" />
                </div>
              </div>
              <div class="form-group">
                <label>Zona horaria</label>
                <select class="form-select" [ngModel]="hoursForm.timezone" (ngModelChange)="hoursForm.timezone = $event">
                  <option value="America/Mexico_City">Ciudad de México (CST)</option>
                  <option value="America/Monterrey">Monterrey (CST)</option>
                  <option value="America/Cancun">Cancún (EST)</option>
                  <option value="America/Tijuana">Tijuana (PST)</option>
                  <option value="America/Hermosillo">Hermosillo (MST)</option>
                  <option value="America/Bogota">Bogotá (COT)</option>
                  <option value="America/Lima">Lima (PET)</option>
                  <option value="America/Santiago">Santiago (CLT)</option>
                </select>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="toggle-title">Activo</span>
                  <span class="toggle-desc">Habilitar este horario de operación</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [ngModel]="hoursForm.isActive" (ngModelChange)="hoursForm.isActive = $event" />
                  <span class="switch-slider"></span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showHoursModal.set(false)">Cancelar</button>
              <button class="btn-primary" (click)="submitHours()">Agregar Horario</button>
            </div>
          </div>
        </div>
      }

      <!-- ============ MODAL: Agregar Regla de Escalación ============ -->
      @if (showRuleModal()) {
        <div class="modal-overlay" (click)="showRuleModal.set(false)">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Nueva Regla de Escalación</h3>
              <button class="modal-close" (click)="showRuleModal.set(false)"><i class="lucide-x"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Razón de escalación</label>
                <select class="form-select" [ngModel]="ruleForm.reason" (ngModelChange)="ruleForm.reason = $event">
                  <option value="negative_sentiment">Sentimiento negativo</option>
                  <option value="high_debt">Deuda alta</option>
                  <option value="repeated_failure">Falla repetida</option>
                  <option value="client_request">Solicitud del cliente</option>
                  <option value="agent_uncertainty">Incertidumbre del agente</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div class="form-group">
                <label>Prioridad (0 = máxima)</label>
                <input type="number" class="form-input" [ngModel]="ruleForm.priority" (ngModelChange)="ruleForm.priority = $event" min="0" max="100" />
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="toggle-title">Regla activa</span>
                  <span class="toggle-desc">Aplicar esta regla inmediatamente</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [ngModel]="ruleForm.isActive" (ngModelChange)="ruleForm.isActive = $event" />
                  <span class="switch-slider"></span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showRuleModal.set(false)">Cancelar</button>
              <button class="btn-primary" (click)="submitRule()">Crear Regla</button>
            </div>
          </div>
        </div>
      }

      <!-- ============ MODAL: Confirmación de eliminación ============ -->
      @if (showDeleteModal()) {
        <div class="modal-overlay" (click)="showDeleteModal.set(false)">
          <div class="modal-panel modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header danger">
              <h3>Confirmar eliminación</h3>
              <button class="modal-close" (click)="showDeleteModal.set(false)"><i class="lucide-x"></i></button>
            </div>
            <div class="modal-body">
              <div class="delete-content">
                <div class="delete-icon-bg">
                  <i class="lucide-alert-triangle"></i>
                </div>
                <p>¿Estás seguro de que deseas eliminar <strong>{{ deleteTarget.name }}</strong>?</p>
                <p class="delete-warning">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showDeleteModal.set(false)">Cancelar</button>
              <button class="btn-danger" (click)="confirmDelete()">Eliminar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .config-page { display: flex; flex-direction: column; gap: 24px; padding: 32px; }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { font-size: 28px; font-weight: 700; color: #1F2937; margin: 0; }
    .header-left p { font-size: 14px; color: #6B7280; margin: 4px 0 0; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .btn-save { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #1E40AF; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-save:hover { background: #1E3A8A; }

    /* Tabs */
    .config-tabs { display: flex; gap: 8px; padding: 4px; background: #F3F4F6; border-radius: 10px; }
    .tab { padding: 10px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; color: #6B7280; cursor: pointer; background: transparent; }
    .tab.active { background: #FFFFFF; color: #1F2937; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .tab:hover:not(.active) { color: #374151; }

    /* Grid */
    .config-grid { display: grid; grid-template-columns: 1fr 400px; gap: 24px; }
    .config-grid.single { grid-template-columns: 1fr; }
    .left-col, .right-col { display: flex; flex-direction: column; gap: 24px; }

    /* Card */
    .card { background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #E5E7EB; }
    .card-header h3 { font-size: 16px; font-weight: 600; color: #1F2937; margin: 0; }
    .card-body { padding: 24px; }

    /* Form fields */
    .form-fields { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 14px; font-weight: 500; color: #374151; }
    .form-input, .form-textarea, .form-select { padding: 12px 16px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 14px; color: #1F2937; background: white; font-family: inherit; }
    .form-input:focus, .form-textarea:focus, .form-select:focus { outline: none; border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .form-textarea { resize: vertical; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    /* Toggle list */
    .toggle-list { display: flex; flex-direction: column; gap: 16px; }
    .toggle-row { display: flex; justify-content: space-between; align-items: center; }
    .toggle-info { display: flex; flex-direction: column; gap: 2px; }
    .toggle-title { font-size: 14px; font-weight: 500; color: #1F2937; }
    .toggle-desc { font-size: 12px; color: #6B7280; }
    .switch { position: relative; width: 44px; height: 24px; cursor: pointer; flex-shrink: 0; }
    .switch input { opacity: 0; width: 0; height: 0; position: absolute; }
    .switch input:checked + .switch-slider { background: #10B981; }
    .switch input:checked + .switch-slider::before { left: 22px; }
    .switch input:not(:checked) + .switch-slider { background: #E5E7EB; }
    .switch input:not(:checked) + .switch-slider::before { left: 2px; }
    .switch-slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #10B981; border-radius: 12px; transition: 0.3s; }
    .switch-slider::before { content: ''; position: absolute; height: 20px; width: 20px; left: 22px; bottom: 2px; background: white; border-radius: 50%; transition: 0.3s; }

    /* Channel list */
    .channel-list { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
    .channel-item { display: flex; align-items: center; gap: 12px; padding: 16px; background: #F9FAFB; border-radius: 10px; border: 1px solid #E5E7EB; }
    .channel-icon-bg { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
    .channel-icon-bg.whatsapp { background: #25D366; }
    .channel-icon-bg.email { background: #1E40AF; }
    .channel-icon-bg.sms { background: #8B5CF6; }
    .channel-icon-bg.voice { background: #F59E0B; }
    .ch-ico { font-size: 20px; }
    .channel-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .channel-name { font-size: 14px; font-weight: 600; color: #1F2937; }
    .channel-meta { font-size: 12px; color: #6B7280; }
    .ch-settings { font-size: 18px; color: #6B7280; cursor: pointer; }
    .channel-note { display: flex; gap: 10px; padding: 12px; background: #FEF3C7; border-radius: 8px; align-items: flex-start; }
    .note-icon { font-size: 16px; color: #D97706; flex-shrink: 0; margin-top: 1px; }
    .channel-note span { font-size: 12px; font-weight: 500; color: #92400E; line-height: 1.4; }

    /* Limits */
    .limits-list { display: flex; flex-direction: column; gap: 16px; }
    .limit-item { display: flex; flex-direction: column; gap: 8px; }
    .limit-header { display: flex; justify-content: space-between; align-items: center; }
    .limit-label { font-size: 14px; font-weight: 500; color: #374151; }
    .limit-value { font-size: 14px; font-weight: 600; color: #1E40AF; }
    .limit-bar { height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden; }
    .limit-fill { height: 100%; background: #1E40AF; border-radius: 4px; }
    .limit-text { font-size: 12px; color: #6B7280; }

    /* List items (for other tabs) */
    .list-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #F3F4F6; }
    .list-item:last-child { border-bottom: none; }
    .list-item-info { display: flex; flex-direction: column; gap: 4px; }
    .list-item-title { font-size: 14px; font-weight: 500; color: #1F2937; }
    .list-item-sub { font-size: 13px; color: #6B7280; }
    .list-item-actions { display: flex; align-items: center; gap: 12px; }
    .status-pill { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .pill-active { background: #D1FAE5; color: #059669; }
    .pill-inactive { background: #F3F4F6; color: #6B7280; }

    .btn-add { display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: #EFF6FF; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; color: #1E40AF; cursor: pointer; }
    .btn-add:hover { background: #DBEAFE; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #6B7280; padding: 6px; border-radius: 6px; font-size: 18px; }
    .btn-icon:hover { background: #F3F4F6; }
    .btn-icon.danger:hover { background: #FEE2E2; color: #991B1B; }
    .empty-state { padding: 32px; text-align: center; color: #9CA3AF; font-size: 14px; }

    /* =========== Modal Styles =========== */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.15s ease-out; }
    .modal-panel { background: white; border-radius: 16px; width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); animation: slideUp 0.2s ease-out; }
    .modal-panel.modal-sm { width: 400px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 24px 0; }
    .modal-header h3 { font-size: 18px; font-weight: 700; color: #1F2937; margin: 0; }
    .modal-header.danger h3 { color: #DC2626; }
    .modal-close { background: none; border: none; cursor: pointer; color: #6B7280; font-size: 20px; padding: 4px; border-radius: 6px; }
    .modal-close:hover { background: #F3F4F6; }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px 24px; }
    .btn-cancel { padding: 10px 20px; background: #F3F4F6; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; color: #374151; cursor: pointer; }
    .btn-cancel:hover { background: #E5E7EB; }
    .btn-primary { padding: 10px 20px; background: #1E40AF; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; color: white; cursor: pointer; }
    .btn-primary:hover { background: #1E3A8A; }
    .btn-danger { padding: 10px 20px; background: #DC2626; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; color: white; cursor: pointer; }
    .btn-danger:hover { background: #B91C1C; }

    /* Delete confirm */
    .delete-content { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; }
    .delete-icon-bg { width: 56px; height: 56px; border-radius: 28px; background: #FEE2E2; display: flex; align-items: center; justify-content: center; color: #DC2626; font-size: 28px; }
    .delete-content p { font-size: 14px; color: #374151; margin: 0; line-height: 1.5; }
    .delete-warning { font-size: 13px; color: #6B7280; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ConfiguracionComponent implements OnInit {
  protected readonly service = inject(AgenteIaService);
  private readonly router = inject(Router);

  readonly CHANNEL_LABELS = CHANNEL_LABELS;
  readonly ESCALATION_REASON_LABELS = ESCALATION_REASON_LABELS;
  readonly DAY_LABELS = DAY_LABELS;

  readonly activeTab = signal<ConfigTab>('general');
  configDraft: Record<string, any> = {};

  // Modal visibility signals
  readonly showChannelModal = signal(false);
  readonly showHoursModal = signal(false);
  readonly showRuleModal = signal(false);
  readonly showDeleteModal = signal(false);

  // Form state for modals
  channelForm = { channel: 'whatsapp' as ChannelType, maxMessages: 50, greeting: '', isEnabled: true };
  hoursForm = { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', timezone: 'America/Mexico_City', isActive: true };
  ruleForm = { reason: 'negative_sentiment' as EscalationReason, priority: 0, isActive: true };
  deleteTarget = { type: '' as 'channel' | 'hours' | 'rule', id: '', name: '' };

  tabs: { key: ConfigTab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'canales', label: 'Canales' },
    { key: 'horarios', label: 'Horarios' },
    { key: 'escalado', label: 'Escalado' },
    { key: 'integraciones', label: 'Integraciones' },
  ];

  setDraft(key: string, value: any): void {
    this.configDraft[key] = value;
  }

  ngOnInit(): void {
    this.service.loadConfig();
    this.service.loadChannelConfigs();
    this.service.loadOperatingHours();
    this.service.loadEscalationRules();
  }

  async saveConfig(): Promise<void> {
    const config = this.service.config();
    if (!config) return;
    await this.service.updateConfig(config.id, this.configDraft as any);
    this.configDraft = {};
  }

  // ---- Channel modal ----
  openChannelModal(): void {
    this.channelForm = { channel: 'whatsapp', maxMessages: 50, greeting: '', isEnabled: true };
    this.showChannelModal.set(true);
  }

  submitChannel(): void {
    this.service.createChannelConfig({
      channel: this.channelForm.channel,
      is_enabled: this.channelForm.isEnabled,
      max_messages_per_conversation: this.channelForm.maxMessages,
      greeting_message: this.channelForm.greeting || null,
    });
    this.showChannelModal.set(false);
  }

  toggleChannel(ch: any): void {
    this.service.updateChannelConfig(ch.id, { is_enabled: !ch.isEnabled });
  }

  // ---- Hours modal ----
  openHoursModal(): void {
    this.hoursForm = { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', timezone: 'America/Mexico_City', isActive: true };
    this.showHoursModal.set(true);
  }

  submitHours(): void {
    this.service.createOperatingHours({
      day_of_week: this.hoursForm.dayOfWeek,
      is_active: this.hoursForm.isActive,
      start_time: this.hoursForm.startTime,
      end_time: this.hoursForm.endTime,
      timezone: this.hoursForm.timezone,
    });
    this.showHoursModal.set(false);
  }

  // ---- Escalation rule modal ----
  openRuleModal(): void {
    this.ruleForm = { reason: 'negative_sentiment', priority: 0, isActive: true };
    this.showRuleModal.set(true);
  }

  submitRule(): void {
    this.service.createEscalationRule({
      reason: this.ruleForm.reason,
      is_active: this.ruleForm.isActive,
      priority: this.ruleForm.priority,
    });
    this.showRuleModal.set(false);
  }

  // ---- Delete confirmation modal ----
  openDeleteConfirm(type: 'channel' | 'hours' | 'rule', id: string, name: string): void {
    this.deleteTarget = { type, id, name };
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const { type, id } = this.deleteTarget;
    if (type === 'channel') this.service.deleteChannelConfig(id);
    else if (type === 'hours') this.service.deleteOperatingHours(id);
    else if (type === 'rule') this.service.deleteEscalationRule(id);
    this.showDeleteModal.set(false);
  }
}
