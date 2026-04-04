import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

type Tab = 'general' | 'usuarios' | 'integraciones' | 'facturacion' | 'notificaciones' | 'seguridad';

interface TabOption {
  id: Tab;
  label: string;
}

@Component({
  selector: 'app-configuracion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="config-page">

      <!-- Header -->
      <header class="page-header">
        <div class="header-text">
          <h1>Configuración</h1>
          <p>Administra tu cuenta, empresa e integraciones</p>
        </div>
      </header>

      <!-- Tab Bar -->
      <nav class="tab-bar">
        @for (tab of tabs; track tab.id) {
          <button
            class="tab-btn"
            [class.active]="activeTab() === tab.id"
            (click)="activeTab.set(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </nav>

      <!-- Tab Content -->
      <div class="tab-content">

        <!-- ==================== GENERAL ==================== -->
        @if (activeTab() === 'general') {
          <div class="two-col-layout">

            <!-- Left Column -->
            <div class="col-main">

              <!-- Card: Información de la Empresa -->
              <div class="card">
                <div class="card-header">
                  <span class="card-title">Información de la Empresa</span>
                  <button class="btn-edit">Editar</button>
                </div>
                <div class="card-body">
                  <div class="logo-row">
                    <div class="logo-box">
                      <lucide-icon name="building-2" style="width:32px;height:32px;color:#9CA3AF;"></lucide-icon>
                    </div>
                    <div class="logo-meta">
                      <span class="logo-label">Logo de empresa</span>
                      <button class="btn-ghost-sm">Cambiar logo</button>
                    </div>
                  </div>
                  <div class="field-grid">
                    <div class="field-group">
                      <label class="field-label">Razón Social</label>
                      <div class="field-value">CobroFlow S.A. de C.V.</div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Nombre comercial</label>
                      <div class="field-value">CobroFlow</div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Teléfono</label>
                      <div class="field-value">+52 55 1234 5678</div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Sitio web</label>
                      <div class="field-value">www.cobroflow.com</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Card: Datos Fiscales -->
              <div class="card">
                <div class="card-header">
                  <span class="card-title">Datos Fiscales</span>
                  <button class="btn-edit">Editar</button>
                </div>
                <div class="card-body">
                  <div class="field-grid">
                    <div class="field-group">
                      <label class="field-label">RFC / CUIT</label>
                      <div class="field-value">CFW230415XY3</div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Régimen fiscal</label>
                      <div class="field-value">General de Ley Personas Morales</div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Moneda</label>
                      <div class="field-value">MXN — Peso Mexicano</div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">País</label>
                      <div class="field-value">México</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Right Column -->
            <div class="col-side">

              <!-- Card: Dirección Fiscal -->
              <div class="card">
                <div class="card-header">
                  <span class="card-title">Dirección Fiscal</span>
                  <button class="btn-edit">Editar</button>
                </div>
                <div class="card-body">
                  <div class="address-row">
                    <lucide-icon name="map-pin" class="address-icon"></lucide-icon>
                    <p class="address-text">
                      Av. Insurgentes Sur 1425, Piso 3<br>
                      Col. Insurgentes Mixcoac<br>
                      Ciudad de México, CDMX 03920<br>
                      México
                    </p>
                  </div>
                </div>
              </div>

              <!-- Card: Preferencias Regionales -->
              <div class="card">
                <div class="card-header">
                  <span class="card-title">Preferencias Regionales</span>
                </div>
                <div class="card-body pref-list">
                  <div class="pref-row">
                    <div class="pref-left">
                      <lucide-icon name="clock" class="pref-icon"></lucide-icon>
                      <span class="pref-label">Zona horaria</span>
                    </div>
                    <span class="pref-value">(UTC-6) Ciudad de México</span>
                  </div>
                  <div class="pref-row">
                    <div class="pref-left">
                      <lucide-icon name="dollar-sign" class="pref-icon"></lucide-icon>
                      <span class="pref-label">Moneda</span>
                    </div>
                    <span class="pref-value">MXN — Peso Mexicano</span>
                  </div>
                  <div class="pref-row">
                    <div class="pref-left">
                      <lucide-icon name="globe" class="pref-icon"></lucide-icon>
                      <span class="pref-label">Idioma</span>
                    </div>
                    <span class="pref-value">Español (México)</span>
                  </div>
                  <div class="pref-row">
                    <div class="pref-left">
                      <lucide-icon name="calendar" class="pref-icon"></lucide-icon>
                      <span class="pref-label">Formato de fecha</span>
                    </div>
                    <span class="pref-value">DD/MM/AAAA</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        }

        <!-- ==================== USUARIOS ==================== -->
        @if (activeTab() === 'usuarios') {
          <div class="section">
            <div class="section-header">
              <span class="section-title">Usuarios del equipo</span>
              <button class="btn-primary">
                <lucide-icon name="plus" style="width:16px;height:16px;"></lucide-icon>
                Nuevo Usuario
              </button>
            </div>

            <div class="card table-card">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width:250px;">Usuario</th>
                    <th style="width:150px;">Rol</th>
                    <th style="width:100px;">Estado</th>
                    <th>Último acceso</th>
                    <th style="width:80px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users; track user.email) {
                    <tr>
                      <td>
                        <div class="user-cell">
                          <div class="avatar" [style.background]="user.avatarColor">
                            {{ user.initials }}
                          </div>
                          <div class="user-info">
                            <span class="user-name">{{ user.name }}</span>
                            <span class="user-email">{{ user.email }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="role-badge" [style.background]="user.roleBg" [style.color]="user.roleColor">
                          {{ user.role }}
                        </span>
                      </td>
                      <td>
                        <div class="status-cell">
                          <div class="status-dot" [class.active]="user.active"></div>
                          <span>{{ user.active ? 'Activo' : 'Inactivo' }}</span>
                        </div>
                      </td>
                      <td class="last-access">{{ user.lastAccess }}</td>
                      <td>
                        <div class="actions-cell">
                          <button class="icon-btn" title="Editar">
                            <lucide-icon name="pencil" style="width:15px;height:15px;"></lucide-icon>
                          </button>
                          <button class="icon-btn danger" title="Eliminar">
                            <lucide-icon name="trash-2" style="width:15px;height:15px;"></lucide-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ==================== INTEGRACIONES ==================== -->
        @if (activeTab() === 'integraciones') {
          <div class="section">
            <div class="section-header">
              <span class="section-title">Integraciones Disponibles</span>
              <button class="btn-primary">
                <lucide-icon name="plus" style="width:16px;height:16px;"></lucide-icon>
                Agregar integración
              </button>
            </div>

            <div class="integrations-grid">

              <!-- WhatsApp -->
              <div class="integration-card">
                <div class="int-header">
                  <div class="int-icon-wrap" style="background:#25D366;">
                    <lucide-icon name="message-circle" style="width:22px;height:22px;color:white;"></lucide-icon>
                  </div>
                  <div class="int-meta">
                    <span class="int-name">WhatsApp Business</span>
                    <span class="int-provider">Twilio</span>
                  </div>
                  <div class="int-status connected">Conectado</div>
                </div>
                <p class="int-desc">Envía mensajes de cobranza por WhatsApp de forma automatizada.</p>
                <div class="int-stats">
                  <div class="stat-item">
                    <span class="stat-val">8,234</span>
                    <span class="stat-lbl">Mensajes/mes</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-val green">72%</span>
                    <span class="stat-lbl">Tasa apertura</span>
                  </div>
                </div>
              </div>

              <!-- Email -->
              <div class="integration-card">
                <div class="int-header">
                  <div class="int-icon-wrap" style="background:#1E40AF;">
                    <lucide-icon name="mail" style="width:22px;height:22px;color:white;"></lucide-icon>
                  </div>
                  <div class="int-meta">
                    <span class="int-name">Email</span>
                    <span class="int-provider">SendGrid</span>
                  </div>
                  <div class="int-status connected">Conectado</div>
                </div>
                <p class="int-desc">Plataforma de envío de correos masivos con alta entregabilidad.</p>
                <div class="int-stats">
                  <div class="stat-item">
                    <span class="stat-val">3,421</span>
                    <span class="stat-lbl">Emails/mes</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-val yellow">58%</span>
                    <span class="stat-lbl">Tasa apertura</span>
                  </div>
                </div>
              </div>

              <!-- SMS -->
              <div class="integration-card">
                <div class="int-header">
                  <div class="int-icon-wrap" style="background:#8B5CF6;">
                    <lucide-icon name="smartphone" style="width:22px;height:22px;color:white;"></lucide-icon>
                  </div>
                  <div class="int-meta">
                    <span class="int-name">SMS</span>
                    <span class="int-provider">Twilio</span>
                  </div>
                  <div class="int-status connected">Conectado</div>
                </div>
                <p class="int-desc">Envío de SMS masivos para notificaciones urgentes de cobranza.</p>
                <div class="int-stats">
                  <div class="stat-item">
                    <span class="stat-val">892</span>
                    <span class="stat-lbl">SMS/mes</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-val green">95%</span>
                    <span class="stat-lbl">Entrega</span>
                  </div>
                </div>
              </div>

              <!-- Mercado Pago (coming soon) -->
              <div class="integration-card soon">
                <div class="int-header">
                  <div class="int-icon-wrap" style="background:#F3F4F6;">
                    <lucide-icon name="lock" style="width:22px;height:22px;color:#9CA3AF;"></lucide-icon>
                  </div>
                  <div class="int-meta">
                    <span class="int-name" style="color:#9CA3AF;">Mercado Pago</span>
                    <span class="int-provider">Pagos</span>
                  </div>
                  <span class="badge-soon">Próximamente</span>
                </div>
                <p class="int-desc" style="color:#9CA3AF;">Integración con Mercado Pago para gestión de cobros en línea.</p>
              </div>

              <!-- Stripe (coming soon) -->
              <div class="integration-card soon">
                <div class="int-header">
                  <div class="int-icon-wrap" style="background:#F3F4F6;">
                    <lucide-icon name="lock" style="width:22px;height:22px;color:#9CA3AF;"></lucide-icon>
                  </div>
                  <div class="int-meta">
                    <span class="int-name" style="color:#9CA3AF;">Stripe</span>
                    <span class="int-provider">Pagos</span>
                  </div>
                  <span class="badge-soon">Próximamente</span>
                </div>
                <p class="int-desc" style="color:#9CA3AF;">Procesamiento de pagos internacional con Stripe.</p>
              </div>

              <!-- Salesforce (coming soon) -->
              <div class="integration-card soon">
                <div class="int-header">
                  <div class="int-icon-wrap" style="background:#F3F4F6;">
                    <lucide-icon name="lock" style="width:22px;height:22px;color:#9CA3AF;"></lucide-icon>
                  </div>
                  <div class="int-meta">
                    <span class="int-name" style="color:#9CA3AF;">Salesforce</span>
                    <span class="int-provider">CRM</span>
                  </div>
                  <span class="badge-soon">Próximamente</span>
                </div>
                <p class="int-desc" style="color:#9CA3AF;">Sincronización bidireccional con Salesforce CRM.</p>
              </div>

            </div>

            <!-- API Keys Section -->
            <div class="section-header" style="margin-top:32px;">
              <span class="section-title">API Keys</span>
              <button class="btn-primary">
                <lucide-icon name="plus" style="width:16px;height:16px;"></lucide-icon>
                Nueva API Key
              </button>
            </div>

            <div class="warning-note">
              <lucide-icon name="alert-triangle" style="width:16px;height:16px;color:#D97706;flex-shrink:0;"></lucide-icon>
              <span>Las API keys dan acceso total a tu cuenta. Mantenlas seguras y no las compartas.</span>
            </div>

            <div class="card table-card">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>API Key</th>
                    <th>Fecha creación</th>
                    <th style="width:100px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Producción</td>
                    <td><code class="api-key">cf_live_••••••••••••••••••••••••3f2a</code></td>
                    <td class="last-access">15 Ene 2025</td>
                    <td><button class="btn-danger-sm">Revocar</button></td>
                  </tr>
                  <tr>
                    <td>Desarrollo</td>
                    <td><code class="api-key">cf_test_••••••••••••••••••••••••9b1c</code></td>
                    <td class="last-access">20 Feb 2025</td>
                    <td><button class="btn-danger-sm">Revocar</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ==================== FACTURACIÓN ==================== -->
        @if (activeTab() === 'facturacion') {
          <div class="section">

            <!-- Plan Card -->
            <div class="plan-card">
              <div class="plan-top">
                <div>
                  <span class="plan-current-label">Tu plan actual</span>
                  <h2 class="plan-name">Pro</h2>
                </div>
                <button class="btn-upgrade">Upgrade a Enterprise</button>
              </div>
              <div class="plan-stats">
                <div class="plan-stat">
                  <span class="plan-stat-val">$149/mes</span>
                  <span class="plan-stat-lbl">Precio</span>
                </div>
                <div class="plan-stat-divider"></div>
                <div class="plan-stat">
                  <span class="plan-stat-val">15 Ene 2025</span>
                  <span class="plan-stat-lbl">Próx. facturación</span>
                </div>
                <div class="plan-stat-divider"></div>
                <div class="plan-stat">
                  <span class="plan-stat-val">10 Usuarios</span>
                  <span class="plan-stat-lbl">Incluidos</span>
                </div>
                <div class="plan-stat-divider"></div>
                <div class="plan-stat">
                  <span class="plan-stat-val">50,000</span>
                  <span class="plan-stat-lbl">Contactos</span>
                </div>
              </div>
            </div>

            <!-- Usage + Payment Row -->
            <div class="billing-row">

              <!-- Usage Card -->
              <div class="card" style="flex:1;">
                <div class="card-header">
                  <span class="card-title">Uso del Plan</span>
                </div>
                <div class="card-body usage-list">

                  <div class="usage-item">
                    <div class="usage-header">
                      <span class="usage-label">Usuarios</span>
                      <span class="usage-value">7 / 10</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width:70%;"></div>
                    </div>
                  </div>

                  <div class="usage-item">
                    <div class="usage-header">
                      <span class="usage-label">Contactos</span>
                      <span class="usage-value">32,450 / 50,000</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width:65%;"></div>
                    </div>
                  </div>

                  <div class="usage-item">
                    <div class="usage-header">
                      <span class="usage-label">Mensajes</span>
                      <span class="usage-value">12,847 / 20,000</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width:64%;"></div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Payment Card -->
              <div class="card" style="width:360px;flex-shrink:0;">
                <div class="card-header">
                  <span class="card-title">Método de Pago</span>
                  <button class="btn-edit">Editar</button>
                </div>
                <div class="card-body">
                  <div class="payment-card">
                    <div class="payment-card-brand">
                      <span class="visa-logo">VISA</span>
                    </div>
                    <div class="payment-card-number">•••• •••• •••• 4532</div>
                    <div class="payment-card-exp">Expira 08/2026</div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Invoice History -->
            <div class="section-header" style="margin-top:8px;">
              <span class="section-title">Historial de Facturas</span>
            </div>

            <div class="card table-card">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th style="width:80px;">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  @for (inv of invoices; track inv.date) {
                    <tr>
                      <td>{{ inv.date }}</td>
                      <td>{{ inv.amount }}</td>
                      <td>
                        <span class="status-badge paid">{{ inv.status }}</span>
                      </td>
                      <td>
                        <button class="icon-btn" title="Descargar PDF">
                          <lucide-icon name="download" style="width:15px;height:15px;"></lucide-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

          </div>
        }

        <!-- ==================== NOTIFICACIONES ==================== -->
        @if (activeTab() === 'notificaciones') {
          <div class="notif-section">

            <!-- Email Notifications -->
            <div class="card">
              <div class="card-header">
                <div class="notif-card-title">
                  <div class="notif-icon-wrap" style="background:#DBEAFE;">
                    <lucide-icon name="mail" style="width:18px;height:18px;color:#1E40AF;"></lucide-icon>
                  </div>
                  <span class="card-title">Notificaciones por Email</span>
                </div>
              </div>
              <div class="card-body toggle-list">
                <div class="toggle-row">
                  <div class="toggle-text">
                    <span class="toggle-label">Pagos recibidos</span>
                    <span class="toggle-desc">Recibí un aviso cuando un deudor realiza un pago</span>
                  </div>
                  <div class="toggle on"></div>
                </div>
                <div class="toggle-row">
                  <div class="toggle-text">
                    <span class="toggle-label">Facturas vencidas</span>
                    <span class="toggle-desc">Alerta cuando una factura supera su fecha de vencimiento</span>
                  </div>
                  <div class="toggle on"></div>
                </div>
                <div class="toggle-row">
                  <div class="toggle-text">
                    <span class="toggle-label">Resumen semanal</span>
                    <span class="toggle-desc">Reporte semanal del estado de tu cartera</span>
                  </div>
                  <div class="toggle"></div>
                </div>
                <div class="toggle-row">
                  <div class="toggle-text">
                    <span class="toggle-label">Actividad del equipo</span>
                    <span class="toggle-desc">Notificaciones de acciones de tus colaboradores</span>
                  </div>
                  <div class="toggle on"></div>
                </div>
              </div>
            </div>

            <!-- Push Notifications -->
            <div class="card">
              <div class="card-header">
                <div class="notif-card-title">
                  <div class="notif-icon-wrap" style="background:#FEF3C7;">
                    <lucide-icon name="bell" style="width:18px;height:18px;color:#D97706;"></lucide-icon>
                  </div>
                  <span class="card-title">Notificaciones Push</span>
                </div>
              </div>
              <div class="card-body toggle-list">
                <div class="toggle-row">
                  <div class="toggle-text">
                    <span class="toggle-label">Nuevos mensajes</span>
                    <span class="toggle-desc">Alertas de mensajes entrantes de deudores</span>
                  </div>
                  <div class="toggle on"></div>
                </div>
                <div class="toggle-row">
                  <div class="toggle-text">
                    <span class="toggle-label">Tareas pendientes</span>
                    <span class="toggle-desc">Recordatorios de seguimiento de cuentas</span>
                  </div>
                  <div class="toggle on"></div>
                </div>
                <div class="toggle-row">
                  <div class="toggle-text">
                    <span class="toggle-label">Actualizaciones del sistema</span>
                    <span class="toggle-desc">Nuevas funciones y mejoras de la plataforma</span>
                  </div>
                  <div class="toggle on"></div>
                </div>
              </div>
            </div>

            <!-- SMS Notifications -->
            <div class="card">
              <div class="card-header">
                <div class="notif-card-title">
                  <div class="notif-icon-wrap" style="background:#DCFCE7;">
                    <lucide-icon name="smartphone" style="width:18px;height:18px;color:#16A34A;"></lucide-icon>
                  </div>
                  <span class="card-title">Notificaciones SMS</span>
                </div>
              </div>
              <div class="card-body toggle-list">
                <div class="toggle-row">
                  <div class="toggle-text">
                    <span class="toggle-label">Alertas críticas</span>
                    <span class="toggle-desc">Notificaciones urgentes de cuentas en mora</span>
                  </div>
                  <div class="toggle"></div>
                </div>
                <div class="toggle-row">
                  <div class="toggle-text">
                    <span class="toggle-label">Confirmación de pagos</span>
                    <span class="toggle-desc">SMS cuando se confirma un pago importante</span>
                  </div>
                  <div class="toggle on"></div>
                </div>
                <div class="toggle-row phone-row">
                  <div class="toggle-text">
                    <span class="toggle-label">Teléfono para SMS</span>
                    <span class="toggle-desc">+52 55 1234 5678</span>
                  </div>
                  <button class="btn-ghost-sm">Cambiar</button>
                </div>
              </div>
            </div>

          </div>
        }

        <!-- ==================== SEGURIDAD ==================== -->
        @if (activeTab() === 'seguridad') {
          <div class="security-section">

            <!-- 2FA Card -->
            <div class="card">
              <div class="card-header">
                <div class="notif-card-title">
                  <div class="notif-icon-wrap" style="background:#DCFCE7;">
                    <lucide-icon name="shield-check" style="width:18px;height:18px;color:#16A34A;"></lucide-icon>
                  </div>
                  <span class="card-title">Autenticación de Dos Factores</span>
                </div>
                <span class="badge-active">Activado</span>
              </div>
              <div class="card-body">
                <div class="info-box">
                  <span>Método actual: <strong>Aplicación de autenticación (Google Authenticator)</strong></span>
                </div>
                <div class="btn-row">
                  <button class="btn-secondary-sm">Cambiar método</button>
                  <button class="btn-outline-sm">Ver códigos de respaldo</button>
                </div>
              </div>
            </div>

            <!-- Password Card -->
            <div class="card">
              <div class="card-header">
                <div class="notif-card-title">
                  <div class="notif-icon-wrap" style="background:#DBEAFE;">
                    <lucide-icon name="lock" style="width:18px;height:18px;color:#1E40AF;"></lucide-icon>
                  </div>
                  <span class="card-title">Contraseña</span>
                </div>
                <button class="btn-primary">Cambiar contraseña</button>
              </div>
              <div class="card-body">
                <div class="info-box">
                  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;">Política de contraseñas</p>
                  <div class="policy-list">
                    <div class="policy-item">
                      <lucide-icon name="check" style="width:14px;height:14px;color:#16A34A;"></lucide-icon>
                      <span>Mínimo 8 caracteres</span>
                    </div>
                    <div class="policy-item">
                      <lucide-icon name="check" style="width:14px;height:14px;color:#16A34A;"></lucide-icon>
                      <span>Al menos una mayúscula</span>
                    </div>
                    <div class="policy-item">
                      <lucide-icon name="check" style="width:14px;height:14px;color:#16A34A;"></lucide-icon>
                      <span>Al menos un número</span>
                    </div>
                    <div class="policy-item">
                      <lucide-icon name="check" style="width:14px;height:14px;color:#16A34A;"></lucide-icon>
                      <span>Al menos un carácter especial</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Sessions Card -->
            <div class="card">
              <div class="card-header">
                <div class="notif-card-title">
                  <div class="notif-icon-wrap" style="background:#FEF3C7;">
                    <lucide-icon name="monitor" style="width:18px;height:18px;color:#D97706;"></lucide-icon>
                  </div>
                  <span class="card-title">Sesiones Activas</span>
                </div>
                <button class="btn-danger-outline">Cerrar todas las sesiones</button>
              </div>
              <div class="card-body session-list">
                <div class="session-row">
                  <lucide-icon name="monitor" class="session-icon"></lucide-icon>
                  <div class="session-info">
                    <span class="session-device">Chrome · Windows</span>
                    <span class="session-ip">190.45.123.88 — Ciudad de México</span>
                  </div>
                  <span class="session-current">Sesión actual</span>
                </div>
                <div class="session-row">
                  <lucide-icon name="smartphone" class="session-icon"></lucide-icon>
                  <div class="session-info">
                    <span class="session-device">Safari · iPhone</span>
                    <span class="session-ip">190.45.123.88 — Hace 2 horas</span>
                  </div>
                  <button class="btn-close-session">Cerrar</button>
                </div>
                <div class="session-row">
                  <lucide-icon name="monitor" class="session-icon"></lucide-icon>
                  <div class="session-info">
                    <span class="session-device">Firefox · macOS</span>
                    <span class="session-ip">201.88.55.12 — Hace 3 días</span>
                  </div>
                  <button class="btn-close-session">Cerrar</button>
                </div>
              </div>
            </div>

            <!-- Audit Log Card -->
            <div class="card">
              <div class="card-header">
                <div class="notif-card-title">
                  <div class="notif-icon-wrap" style="background:#F3F4F6;">
                    <lucide-icon name="file-text" style="width:18px;height:18px;color:#6B7280;"></lucide-icon>
                  </div>
                  <span class="card-title">Registro de Auditoría</span>
                </div>
              </div>
              <div class="card-body audit-list">
                @for (event of auditEvents; track event.ts) {
                  <div class="audit-row">
                    <div class="audit-dot"></div>
                    <div class="audit-content">
                      <span class="audit-event">{{ event.label }}</span>
                      <span class="audit-ts">{{ event.ts }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .config-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 32px;
      min-height: 100%;
    }

    /* ---- Header ---- */
    .page-header {
      margin-bottom: 4px;
    }

    .header-text h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1F2937;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }

    .header-text p {
      font-size: 15px;
      color: #6B7280;
      margin: 0;
    }

    /* ---- Tab Bar ---- */
    .tab-bar {
      display: flex;
      gap: 4px;
      background: #F3F4F6;
      border-radius: 10px;
      padding: 4px;
      width: fit-content;
    }

    .tab-btn {
      padding: 8px 16px;
      background: transparent;
      border: none;
      border-radius: 7px;
      font-size: 14px;
      font-weight: 500;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #1F2937;
    }

    .tab-btn.active {
      background: #FFFFFF;
      color: #1F2937;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* ---- Shared Card ---- */
    .card {
      background: white;
      border-radius: 12px;
      border: 1px solid #E5E7EB;
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #F3F4F6;
    }

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #1F2937;
    }

    .card-body {
      padding: 20px;
    }

    /* ---- Buttons ---- */
    .btn-edit {
      padding: 6px 14px;
      background: #EFF6FF;
      color: #1E40AF;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-edit:hover {
      background: #DBEAFE;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      background: #1E40AF;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-primary:hover {
      background: #1E3A8A;
    }

    .btn-secondary-sm {
      padding: 8px 16px;
      background: #F9FAFB;
      color: #374151;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-outline-sm {
      padding: 8px 16px;
      background: transparent;
      color: #374151;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-ghost-sm {
      padding: 6px 12px;
      background: transparent;
      color: #1E40AF;
      border: none;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: underline;
    }

    .btn-danger-sm {
      padding: 5px 10px;
      background: #FEE2E2;
      color: #DC2626;
      border: none;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-danger-outline {
      padding: 8px 16px;
      background: transparent;
      color: #EF4444;
      border: 1px solid #EF4444;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }

    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: transparent;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      cursor: pointer;
      color: #6B7280;
    }

    .icon-btn:hover {
      background: #F9FAFB;
    }

    .icon-btn.danger:hover {
      background: #FEF2F2;
      color: #DC2626;
      border-color: #FCA5A5;
    }

    /* ---- Section layout ---- */
    .section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1F2937;
    }

    /* ---- General Tab ---- */
    .two-col-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
      align-items: start;
    }

    .col-main {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .col-side {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .logo-box {
      width: 100px;
      height: 100px;
      background: #F3F4F6;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .logo-label {
      font-size: 14px;
      color: #6B7280;
    }

    .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 12px;
      font-weight: 500;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .field-value {
      font-size: 14px;
      color: #1F2937;
      font-weight: 500;
    }

    .address-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .address-icon {
      width: 18px;
      height: 18px;
      color: #6B7280;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .address-text {
      font-size: 14px;
      color: #374151;
      line-height: 1.7;
      margin: 0;
    }

    .pref-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 0;
    }

    .pref-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      border-bottom: 1px solid #F3F4F6;
    }

    .pref-row:last-child {
      border-bottom: none;
    }

    .pref-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pref-icon {
      width: 16px;
      height: 16px;
      color: #9CA3AF;
    }

    .pref-label {
      font-size: 14px;
      color: #6B7280;
    }

    .pref-value {
      font-size: 14px;
      font-weight: 500;
      color: #1F2937;
    }

    /* ---- Users Tab ---- */
    .table-card {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead tr {
      background: #F9FAFB;
    }

    .data-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #E5E7EB;
    }

    .data-table td {
      padding: 14px 16px;
      font-size: 14px;
      color: #374151;
      border-bottom: 1px solid #F9FAFB;
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .data-table tbody tr:hover td {
      background: #FAFAFA;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: #1F2937;
    }

    .user-email {
      font-size: 12px;
      color: #9CA3AF;
    }

    .role-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #6B7280;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #D1D5DB;
    }

    .status-dot.active {
      background: #10B981;
    }

    .last-access {
      font-size: 13px;
      color: #9CA3AF;
    }

    .actions-cell {
      display: flex;
      gap: 6px;
    }

    /* ---- Integrations Tab ---- */
    .integrations-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .integration-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #E5E7EB;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .integration-card.soon {
      border-style: dashed;
      opacity: 0.7;
    }

    .int-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .int-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .int-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .int-name {
      font-size: 14px;
      font-weight: 600;
      color: #1F2937;
    }

    .int-provider {
      font-size: 12px;
      color: #9CA3AF;
    }

    .int-status {
      font-size: 12px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
    }

    .int-status.connected {
      background: #DCFCE7;
      color: #16A34A;
    }

    .int-desc {
      font-size: 13px;
      color: #6B7280;
      line-height: 1.5;
      margin: 0;
    }

    .int-stats {
      display: flex;
      gap: 20px;
      padding-top: 8px;
      border-top: 1px solid #F3F4F6;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-val {
      font-size: 16px;
      font-weight: 700;
      color: #1F2937;
    }

    .stat-val.green { color: #16A34A; }
    .stat-val.yellow { color: #D97706; }

    .stat-lbl {
      font-size: 11px;
      color: #9CA3AF;
    }

    .badge-soon {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      background: #F3F4F6;
      color: #6B7280;
      border-radius: 20px;
      margin-left: auto;
    }

    .warning-note {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #FEF3C7;
      border-radius: 8px;
      font-size: 13px;
      color: #92400E;
    }

    .api-key {
      font-family: monospace;
      font-size: 13px;
      color: #374151;
      background: #F9FAFB;
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* ---- Billing Tab ---- */
    .plan-card {
      background: linear-gradient(135deg, #1E40AF, #3B82F6);
      border-radius: 16px;
      padding: 24px 28px;
      color: white;
    }

    .plan-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .plan-current-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }

    .plan-name {
      font-size: 36px;
      font-weight: 800;
      margin: 4px 0 0;
      letter-spacing: -1px;
    }

    .btn-upgrade {
      padding: 10px 20px;
      background: white;
      color: #1E40AF;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }

    .plan-stats {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .plan-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .plan-stat-val {
      font-size: 18px;
      font-weight: 700;
    }

    .plan-stat-lbl {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }

    .plan-stat-divider {
      width: 1px;
      height: 36px;
      background: rgba(255, 255, 255, 0.25);
    }

    .billing-row {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .usage-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .usage-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .usage-header {
      display: flex;
      justify-content: space-between;
    }

    .usage-label {
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }

    .usage-value {
      font-size: 13px;
      color: #6B7280;
    }

    .progress-bar {
      height: 8px;
      background: #F3F4F6;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #3B82F6;
      border-radius: 4px;
    }

    .payment-card {
      background: #1E3A8A;
      border-radius: 12px;
      padding: 20px;
      color: white;
    }

    .payment-card-brand {
      margin-bottom: 16px;
    }

    .visa-logo {
      font-size: 18px;
      font-weight: 900;
      font-style: italic;
      color: white;
      letter-spacing: 1px;
    }

    .payment-card-number {
      font-size: 16px;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }

    .payment-card-exp {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
    }

    .status-badge.paid {
      display: inline-block;
      padding: 3px 10px;
      background: #DCFCE7;
      color: #16A34A;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    /* ---- Notifications Tab ---- */
    .notif-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .notif-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .notif-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 0;
    }

    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      border-bottom: 1px solid #F9FAFB;
    }

    .toggle-row:last-child {
      border-bottom: none;
    }

    .phone-row {
      background: #F9FAFB;
    }

    .toggle-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .toggle-label {
      font-size: 14px;
      font-weight: 500;
      color: #1F2937;
    }

    .toggle-desc {
      font-size: 13px;
      color: #9CA3AF;
    }

    .toggle {
      width: 44px;
      height: 24px;
      border-radius: 12px;
      background: #D1D5DB;
      position: relative;
      flex-shrink: 0;
      cursor: pointer;
    }

    .toggle::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .toggle.on {
      background: #1E40AF;
    }

    .toggle.on::after {
      transform: translateX(20px);
    }

    /* ---- Security Tab ---- */
    .security-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .badge-active {
      padding: 4px 12px;
      background: #DCFCE7;
      color: #16A34A;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    .info-box {
      background: #F9FAFB;
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 14px;
      color: #374151;
    }

    .btn-row {
      display: flex;
      gap: 10px;
      margin-top: 12px;
    }

    .policy-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }

    .policy-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #374151;
    }

    .session-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 0;
    }

    .session-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      border-bottom: 1px solid #F9FAFB;
    }

    .session-row:last-child {
      border-bottom: none;
    }

    .session-icon {
      width: 20px;
      height: 20px;
      color: #9CA3AF;
      flex-shrink: 0;
    }

    .session-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .session-device {
      font-size: 14px;
      font-weight: 500;
      color: #1F2937;
    }

    .session-ip {
      font-size: 12px;
      color: #9CA3AF;
    }

    .session-current {
      font-size: 12px;
      font-weight: 600;
      color: #16A34A;
      background: #DCFCE7;
      padding: 3px 10px;
      border-radius: 20px;
    }

    .btn-close-session {
      padding: 5px 12px;
      background: transparent;
      color: #EF4444;
      border: 1px solid #EF4444;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }

    .audit-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 0;
    }

    .audit-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 20px;
      border-bottom: 1px solid #F9FAFB;
    }

    .audit-row:last-child {
      border-bottom: none;
    }

    .audit-dot {
      width: 8px;
      height: 8px;
      background: #3B82F6;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .audit-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
    }

    .audit-event {
      font-size: 14px;
      color: #374151;
    }

    .audit-ts {
      font-size: 12px;
      color: #9CA3AF;
    }

    /* ---- Responsive ---- */
    @media (max-width: 1100px) {
      .two-col-layout {
        grid-template-columns: 1fr;
      }

      .integrations-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .billing-row {
        flex-direction: column;
      }

      .billing-row .card[style] {
        width: auto !important;
      }
    }

    @media (max-width: 768px) {
      .config-page {
        padding: 20px;
        gap: 20px;
      }

      .tab-bar {
        width: 100%;
        overflow-x: auto;
        flex-wrap: nowrap;
      }

      .integrations-grid {
        grid-template-columns: 1fr;
      }

      .field-grid {
        grid-template-columns: 1fr;
      }

      .plan-stats {
        flex-direction: column;
        gap: 12px;
      }

      .plan-stat-divider {
        display: none;
      }
    }
  `]
})
export class ConfiguracionComponent {
  activeTab = signal<Tab>('general');

  readonly tabs: TabOption[] = [
    { id: 'general', label: 'General' },
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'integraciones', label: 'Integraciones' },
    { id: 'facturacion', label: 'Facturación' },
    { id: 'notificaciones', label: 'Notificaciones' },
    { id: 'seguridad', label: 'Seguridad' },
  ];

  readonly users = [
    {
      name: 'Ana García',
      email: 'ana@cobroflow.com',
      initials: 'AG',
      avatarColor: '#1E40AF',
      role: 'Administrador',
      roleBg: '#DBEAFE',
      roleColor: '#1E40AF',
      active: true,
      lastAccess: 'Hace 5 min'
    },
    {
      name: 'Carlos López',
      email: 'carlos@cobroflow.com',
      initials: 'CL',
      avatarColor: '#10B981',
      role: 'Manager',
      roleBg: '#F3E8FF',
      roleColor: '#7C3AED',
      active: true,
      lastAccess: 'Hace 2 horas'
    },
    {
      name: 'María Torres',
      email: 'maria@cobroflow.com',
      initials: 'MT',
      avatarColor: '#F59E0B',
      role: 'Agente',
      roleBg: '#FEF3C7',
      roleColor: '#D97706',
      active: true,
      lastAccess: 'Hace 4 horas'
    },
    {
      name: 'Pedro Ramírez',
      email: 'pedro@cobroflow.com',
      initials: 'PR',
      avatarColor: '#EC4899',
      role: 'Agente',
      roleBg: '#FEF3C7',
      roleColor: '#D97706',
      active: false,
      lastAccess: 'Hace 3 días'
    },
    {
      name: 'Sofía Martínez',
      email: 'sofia@cobroflow.com',
      initials: 'SM',
      avatarColor: '#6366F1',
      role: 'Viewer',
      roleBg: '#DCFCE7',
      roleColor: '#16A34A',
      active: true,
      lastAccess: 'Hace 1 día'
    },
  ];

  readonly invoices = [
    { date: '1 Mar 2025', amount: '$149.00', status: 'Pagado' },
    { date: '1 Feb 2025', amount: '$149.00', status: 'Pagado' },
    { date: '1 Ene 2025', amount: '$149.00', status: 'Pagado' },
    { date: '1 Dic 2024', amount: '$149.00', status: 'Pagado' },
  ];

  readonly auditEvents = [
    { label: 'Inicio de sesión exitoso — Chrome, Windows', ts: 'Hace 5 min' },
    { label: 'Cambio de contraseña', ts: 'Hace 3 días' },
    { label: 'Exportación de datos de clientes', ts: 'Hace 5 días' },
    { label: 'Nuevo usuario agregado: sofia@cobroflow.com', ts: 'Hace 7 días' },
  ];
}
