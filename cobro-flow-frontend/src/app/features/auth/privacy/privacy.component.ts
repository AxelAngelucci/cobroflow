import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a routerLink="/auth/login" class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#0F172A] rounded-lg"></div>
            <span class="text-xl font-bold text-gray-800">CobroFlow</span>
          </a>
          <a routerLink="/auth/registro" class="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:underline">
            <i-lucide name="arrow-left" [size]="16" />
            Volver al registro
          </a>
        </div>
      </header>

      <!-- Content -->
      <main class="max-w-4xl mx-auto px-6 py-12">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 lg:p-12">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Política de Privacidad</h1>
          <p class="text-gray-500 mb-8">Última actualización: Enero 2026</p>

          <div class="prose prose-gray max-w-none">
            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">1. Información que Recopilamos</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Recopilamos información que usted nos proporciona directamente, incluyendo:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Información de registro (nombre, email, teléfono, empresa)</li>
                <li>Datos de facturación y pago</li>
                <li>Información de clientes que usted carga en la plataforma</li>
                <li>Comunicaciones con nuestro equipo de soporte</li>
                <li>Preferencias y configuraciones de cuenta</li>
              </ul>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">2. Información Recopilada Automáticamente</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Cuando utiliza nuestro Servicio, recopilamos automáticamente:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Dirección IP y ubicación aproximada</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Páginas visitadas y tiempo de permanencia</li>
                <li>Acciones realizadas en la plataforma</li>
                <li>Cookies y tecnologías similares</li>
              </ul>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">3. Uso de la Información</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Proporcionar, mantener y mejorar el Servicio</li>
                <li>Procesar transacciones y enviar notificaciones relacionadas</li>
                <li>Responder a comentarios, preguntas y solicitudes</li>
                <li>Enviar comunicaciones de marketing (con su consentimiento)</li>
                <li>Detectar, investigar y prevenir actividades fraudulentas</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">4. Compartir Información</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                No vendemos su información personal. Podemos compartir información con:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Proveedores de servicios que nos ayudan a operar el Servicio</li>
                <li>Socios de integración cuando usted lo autoriza</li>
                <li>Autoridades legales cuando sea requerido por ley</li>
                <li>En caso de fusión, adquisición o venta de activos</li>
              </ul>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">5. Seguridad de Datos</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Encriptación SSL/TLS para datos en tránsito</li>
                <li>Encriptación AES-256 para datos en reposo</li>
                <li>Autenticación de dos factores disponible</li>
                <li>Auditorías de seguridad periódicas</li>
                <li>Acceso restringido basado en roles</li>
              </ul>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">6. Retención de Datos</h2>
              <p class="text-gray-600 leading-relaxed">
                Retenemos su información mientras su cuenta esté activa o según sea necesario para proporcionarle 
                servicios. Puede solicitar la eliminación de su cuenta y datos asociados en cualquier momento. 
                Algunos datos pueden retenerse según requisitos legales o para fines legítimos de negocio.
              </p>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">7. Sus Derechos</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Usted tiene derecho a:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar datos inexactos</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Oponerse al procesamiento de sus datos</li>
                <li>Solicitar la portabilidad de sus datos</li>
                <li>Retirar su consentimiento en cualquier momento</li>
              </ul>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">8. Cookies</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Mantener su sesión activa</li>
                <li>Recordar sus preferencias</li>
                <li>Analizar el uso del Servicio</li>
                <li>Personalizar su experiencia</li>
              </ul>
              <p class="text-gray-600 leading-relaxed mt-4">
                Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del Servicio.
              </p>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">9. Transferencias Internacionales</h2>
              <p class="text-gray-600 leading-relaxed">
                Sus datos pueden ser transferidos y procesados en servidores ubicados fuera de su país de residencia. 
                Nos aseguramos de que dichas transferencias cumplan con las leyes de protección de datos aplicables 
                mediante cláusulas contractuales estándar u otros mecanismos legales.
              </p>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">10. Menores de Edad</h2>
              <p class="text-gray-600 leading-relaxed">
                El Servicio no está dirigido a menores de 18 años. No recopilamos intencionalmente información 
                de menores. Si descubrimos que hemos recopilado datos de un menor, los eliminaremos de inmediato.
              </p>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">11. Cambios a esta Política</h2>
              <p class="text-gray-600 leading-relaxed">
                Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios 
                significativos por email o mediante un aviso destacado en el Servicio. Le recomendamos revisar 
                esta política periódicamente.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-semibold text-gray-800 mb-4">12. Contacto</h2>
              <p class="text-gray-600 leading-relaxed">
                Para ejercer sus derechos o realizar consultas sobre privacidad:
              </p>
              <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                <p class="text-gray-700 font-medium">Oficial de Protección de Datos</p>
                <p class="text-gray-600">Email: privacidad&#64;cobroflow.com</p>
                <p class="text-gray-600">Teléfono: +54 11 1234-5678</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-gray-200 bg-white">
        <div class="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-500">&copy; 2026 CobroFlow. Todos los derechos reservados.</p>
          <div class="flex items-center gap-6">
            <a routerLink="/auth/terms" class="text-sm text-gray-500 hover:text-emerald-600">Términos y Condiciones</a>
            <a href="mailto:soporte&#64;cobroflow.com" class="text-sm text-gray-500 hover:text-emerald-600">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class PrivacyComponent {}
