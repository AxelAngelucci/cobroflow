import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgenteIaService } from '../../services/agente-ia.service';

interface ToneLevel {
  number: number;
  name: string;
  subtitle: string;
  tags: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  tagBg: string;
  tagText: string;
  badgeColor: string;
}

@Component({
  selector: 'app-personalidad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="personality-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>Personalidad del Agente</h1>
          <p>Define el tono, estilo y comportamiento de comunicación</p>
        </div>
        <div class="header-right">
          <button class="btn-preview">
            <i class="lucide-eye"></i>
            Vista Previa
          </button>
          <button class="btn-save" (click)="save()">
            <i class="lucide-save"></i>
            Guardar
          </button>
        </div>
      </header>

      <div class="personality-grid">
        <!-- Left Column -->
        <div class="left-col">
          <!-- Tone Levels Card -->
          <div class="card">
            <div class="card-header"><h3>Tonos por Nivel de Escalamiento</h3></div>
            <div class="card-body tone-content">
              <div class="tone-info-box">
                <i class="lucide-info info-icon"></i>
                <span>LUNA ajustará automáticamente su tono según el nivel de escalamiento del workflow. Configura cada nivel individualmente.</span>
              </div>

              @for (level of toneLevels; track level.number) {
                <div class="level-card" [style.background]="level.bgColor" [style.border-color]="level.borderColor">
                  <div class="level-header">
                    <div class="level-left">
                      <div class="level-badge" [style.background]="level.badgeColor">{{ level.number }}</div>
                      <div class="level-title-group">
                        <span class="level-name" [style.color]="level.color">{{ level.name }}</span>
                        <span class="level-subtitle" [style.color]="level.color" style="opacity:0.8">{{ level.subtitle }}</span>
                      </div>
                    </div>
                    <i class="lucide-pencil level-edit"></i>
                  </div>
                  <div class="level-tags">
                    @for (tag of level.tags; track tag) {
                      <span class="level-tag" [style.background]="level.tagBg" [style.color]="level.tagText">{{ tag }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Message Templates Link Card -->
          <div class="card">
            <div class="card-header">
              <h3>Plantillas de Mensaje</h3>
              <button class="btn-link-external">
                <i class="lucide-external-link"></i> Ir a Plantillas
              </button>
            </div>
            <div class="card-body link-content">
              <div class="info-box blue">
                <i class="lucide-info info-icon blue"></i>
                <div class="info-text">
                  <span class="info-title">Jerarquía de Comunicación</span>
                  <span class="info-desc">Las plantillas se gestionan centralmente en Comunicaciones → Plantillas. LUNA aplicará el tono del nivel de escalamiento correspondiente.</span>
                </div>
              </div>
              <div class="hierarchy-list">
                <div class="hierarchy-item">
                  <div class="hier-badge b1">1</div>
                  <span>Workflows definen la secuencia y timing</span>
                </div>
                <div class="hierarchy-item">
                  <div class="hier-badge b2">2</div>
                  <span>Plantillas proveen el contenido base</span>
                </div>
                <div class="hierarchy-item">
                  <div class="hier-badge b3">3</div>
                  <span>LUNA aplica el tono del nivel de escalamiento</span>
                </div>
                <div class="hierarchy-item">
                  <div class="hier-badge b4">4</div>
                  <span>Personaliza según historial del cliente</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Phone Preview -->
        <div class="right-col">
          <div class="card preview-card">
            <div class="card-header"><h3>Vista Previa de Conversación</h3></div>
            <div class="card-body preview-body">
              <div class="phone-frame">
                <div class="phone-screen">
                  <div class="phone-header">
                    <i class="lucide-bot phone-bot-icon"></i>
                    <div class="phone-header-info">
                      <span class="phone-name">LUNA</span>
                      <span class="phone-status">En línea</span>
                    </div>
                  </div>
                  <div class="chat-area">
                    <!-- Agent message 1 -->
                    <div class="msg agent">
                      <div class="msg-bubble agent-bubble">¡Hola María! Soy Luna de TechCorp. Te contacto sobre tu cuenta con saldo de $2,450.</div>
                      <span class="msg-time">10:32 AM</span>
                    </div>
                    <!-- User message 1 -->
                    <div class="msg user">
                      <div class="msg-bubble user-bubble">Hola, sí estoy al tanto. ¿Hay opciones de pago?</div>
                      <span class="msg-time">10:33 AM</span>
                    </div>
                    <!-- Agent message 2 -->
                    <div class="msg agent">
                      <div class="msg-bubble agent-bubble">¡Por supuesto! Puedo ofrecerte:<br><br>• Pago único con 10% descuento<br>• 3 cuotas sin interés<br>• 6 cuotas con mínimo interés</div>
                      <span class="msg-time">10:33 AM</span>
                    </div>
                    <!-- User message 2 -->
                    <div class="msg user">
                      <div class="msg-bubble user-bubble">Las 3 cuotas me interesan</div>
                      <span class="msg-time">10:34 AM</span>
                    </div>
                    <!-- Agent message 3 (success) -->
                    <div class="msg agent">
                      <div class="msg-bubble success-bubble">¡Excelente elección! Te envío el link de pago para la primera cuota de $816.67 💳</div>
                      <span class="msg-time">10:34 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .personality-page { display: flex; flex-direction: column; gap: 24px; padding: 32px; }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { font-size: 28px; font-weight: 700; color: #1F2937; margin: 0; }
    .header-left p { font-size: 14px; color: #6B7280; margin: 4px 0 0; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .btn-preview { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: white; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-preview:hover { background: #F9FAFB; }
    .btn-save { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #1E40AF; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-save:hover { background: #1E3A8A; }

    /* Grid */
    .personality-grid { display: grid; grid-template-columns: 1fr 420px; gap: 24px; }
    .left-col, .right-col { display: flex; flex-direction: column; gap: 24px; }

    /* Cards */
    .card { background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #E5E7EB; }
    .card-header h3 { font-size: 16px; font-weight: 600; color: #1F2937; margin: 0; }
    .card-body { padding: 24px; }

    /* Tone Content */
    .tone-content { display: flex; flex-direction: column; gap: 24px; }
    .tone-info-box { display: flex; gap: 10px; padding: 12px; background: #F0F9FF; border-radius: 8px; align-items: flex-start; }
    .info-icon { font-size: 16px; color: #0369A1; flex-shrink: 0; margin-top: 1px; }
    .tone-info-box span { font-size: 12px; font-weight: 500; color: #0C4A6E; line-height: 1.4; }

    /* Level Cards */
    .level-card { padding: 16px; border-radius: 10px; border: 1px solid; display: flex; flex-direction: column; gap: 12px; }
    .level-header { display: flex; justify-content: space-between; align-items: center; }
    .level-left { display: flex; align-items: center; gap: 10px; }
    .level-badge { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 700; flex-shrink: 0; }
    .level-title-group { display: flex; flex-direction: column; gap: 2px; }
    .level-name { font-size: 14px; font-weight: 600; }
    .level-subtitle { font-size: 11px; font-weight: 500; }
    .level-edit { font-size: 16px; color: #6B7280; cursor: pointer; }
    .level-tags { display: flex; gap: 8px; flex-wrap: wrap; }
    .level-tag { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }

    /* Link Card */
    .btn-link-external { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: #EFF6FF; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; color: #1E40AF; cursor: pointer; }
    .link-content { display: flex; flex-direction: column; gap: 16px; }
    .info-box { display: flex; gap: 12px; padding: 16px; border-radius: 8px; align-items: flex-start; }
    .info-box.blue { background: #F0F9FF; }
    .info-icon.blue { color: #0369A1; font-size: 20px; }
    .info-text { display: flex; flex-direction: column; gap: 8px; }
    .info-title { font-size: 14px; font-weight: 600; color: #0C4A6E; }
    .info-desc { font-size: 13px; color: #0369A1; line-height: 1.5; }
    .hierarchy-list { display: flex; flex-direction: column; gap: 12px; }
    .hierarchy-item { display: flex; align-items: center; gap: 12px; }
    .hierarchy-item span { font-size: 13px; font-weight: 500; color: #374151; }
    .hier-badge { width: 24px; height: 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: white; flex-shrink: 0; }
    .hier-badge.b1 { background: #1E40AF; }
    .hier-badge.b2 { background: #3B82F6; }
    .hier-badge.b3 { background: #60A5FA; }
    .hier-badge.b4 { background: #93C5FD; color: #1E40AF; }

    /* Phone Preview */
    .preview-card { height: 100%; }
    .preview-body { display: flex; justify-content: center; padding: 24px; height: 100%; }
    .phone-frame { width: 320px; background: #1F2937; border-radius: 24px; padding: 12px; display: flex; flex-direction: column; }
    .phone-screen { background: #F9FAFB; border-radius: 16px; display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .phone-header { display: flex; align-items: center; gap: 12px; padding: 16px; background: #1E40AF; border-radius: 16px 16px 0 0; }
    .phone-bot-icon { font-size: 20px; color: white; }
    .phone-header-info { display: flex; flex-direction: column; }
    .phone-name { font-size: 14px; font-weight: 600; color: white; }
    .phone-status { font-size: 11px; color: #93C5FD; }
    .chat-area { display: flex; flex-direction: column; gap: 12px; padding: 16px; flex: 1; }

    /* Messages */
    .msg { display: flex; flex-direction: column; gap: 4px; }
    .msg.agent { align-items: flex-start; }
    .msg.user { align-items: flex-end; }
    .msg-bubble { padding: 10px 14px; font-size: 13px; line-height: 1.5; max-width: 240px; }
    .agent-bubble { background: white; color: #1F2937; border-radius: 16px 16px 16px 4px; border: 1px solid #E5E7EB; }
    .user-bubble { background: #1E40AF; color: white; border-radius: 16px 16px 4px 16px; }
    .success-bubble { background: #D1FAE5; color: #065F46; border-radius: 16px 16px 16px 4px; }
    .msg-time { font-size: 10px; color: #9CA3AF; }
  `]
})
export class PersonalidadComponent implements OnInit {
  protected readonly service = inject(AgenteIaService);
  private readonly router = inject(Router);

  readonly toneLevels: ToneLevel[] = [
    { number: 1, name: 'Preventivo', subtitle: 'Antes del vencimiento', tags: ['Amable', 'Empático', 'Casual'], color: '#166534', bgColor: '#F0FDF4', borderColor: '#86EFAC', tagBg: '#DCFCE7', tagText: '#166534', badgeColor: '#10B981' },
    { number: 2, name: 'Temprano', subtitle: '1-15 días de mora', tags: ['Cordial', 'Recordatorio', 'Profesional'], color: '#92400E', bgColor: '#FFFBEB', borderColor: '#FCD34D', tagBg: '#FEF3C7', tagText: '#92400E', badgeColor: '#F59E0B' },
    { number: 3, name: 'Intermedio', subtitle: '16-30 días de mora', tags: ['Firme', 'Directo', 'Solución'], color: '#9A3412', bgColor: '#FFF7ED', borderColor: '#FDBA74', tagBg: '#FFEDD5', tagText: '#9A3412', badgeColor: '#EA580C' },
    { number: 4, name: 'Avanzado', subtitle: '31-60 días de mora', tags: ['Urgente', 'Serio', 'Consecuencias'], color: '#991B1B', bgColor: '#FEF2F2', borderColor: '#FCA5A5', tagBg: '#FEE2E2', tagText: '#991B1B', badgeColor: '#DC2626' },
    { number: 5, name: 'Legal / Pre-judicial', subtitle: '60+ días de mora', tags: ['Formal', 'Legal', 'Última instancia'], color: '#5B21B6', bgColor: '#F5F3FF', borderColor: '#C4B5FD', tagBg: '#EDE9FE', tagText: '#5B21B6', badgeColor: '#7C3AED' },
  ];

  ngOnInit(): void {
    this.service.loadPersonality();
  }

  async save(): Promise<void> {
    await this.service.savePersonality({
      tone: 'professional',
      formality_level: 3,
      empathy_level: 3,
      language: 'es',
    });
  }
}
