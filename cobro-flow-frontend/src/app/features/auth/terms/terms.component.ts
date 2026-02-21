import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-terms',
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
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Términos y Condiciones</h1>
          <p class="text-gray-500 mb-8">Última actualización: Enero 2026</p>

          <div class="prose prose-gray max-w-none">
            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">1. Aceptación de los Términos</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Al acceder y utilizar CobroFlow ("el Servicio"), usted acepta estar sujeto a estos Términos y Condiciones. 
                Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al Servicio.
              </p>
              <p class="text-gray-600 leading-relaxed">
                Estos Términos y Condiciones se aplican a todos los visitantes, usuarios y otras personas que accedan o utilicen el Servicio.
              </p>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">2. Descripción del Servicio</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                CobroFlow es una plataforma de gestión de cobranzas que permite a las empresas:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Gestionar y automatizar procesos de cobranza</li>
                <li>Crear y administrar campañas de recuperación de cartera</li>
                <li>Utilizar inteligencia artificial para optimizar comunicaciones</li>
                <li>Generar reportes y análisis de desempeño</li>
                <li>Integrar con sistemas de terceros mediante API</li>
              </ul>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">3. Registro y Cuenta</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Para utilizar el Servicio, debe crear una cuenta proporcionando información precisa, completa y actualizada. 
                Usted es responsable de:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Mantener la confidencialidad de su contraseña</li>
                <li>Todas las actividades que ocurran bajo su cuenta</li>
                <li>Notificar inmediatamente cualquier uso no autorizado</li>
                <li>Mantener actualizada la información de su cuenta</li>
              </ul>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">4. Uso Aceptable</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Usted se compromete a no utilizar el Servicio para:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Violar leyes o regulaciones aplicables</li>
                <li>Enviar comunicaciones no solicitadas o spam</li>
                <li>Acosar, amenazar o intimidar a terceros</li>
                <li>Transmitir virus o código malicioso</li>
                <li>Interferir con el funcionamiento del Servicio</li>
                <li>Recopilar información de otros usuarios sin consentimiento</li>
              </ul>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">5. Propiedad Intelectual</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                El Servicio y su contenido original, características y funcionalidad son propiedad de CobroFlow y están 
                protegidos por leyes de propiedad intelectual. Usted no puede copiar, modificar, distribuir, vender o 
                arrendar ninguna parte del Servicio sin autorización expresa.
              </p>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">6. Protección de Datos</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                El tratamiento de datos personales se rige por nuestra Política de Privacidad. Al utilizar el Servicio, 
                usted acepta el procesamiento de sus datos de acuerdo con dicha política.
              </p>
              <p class="text-gray-600 leading-relaxed">
                Nos comprometemos a implementar medidas de seguridad técnicas y organizativas para proteger sus datos 
                contra acceso no autorizado, pérdida o alteración.
              </p>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">7. Pagos y Facturación</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Los servicios de pago se facturan por adelantado de forma mensual o anual. Usted acepta:
              </p>
              <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Proporcionar información de pago válida y actualizada</li>
                <li>Pagar todas las tarifas aplicables según el plan seleccionado</li>
                <li>Que los cargos son no reembolsables salvo indicación expresa</li>
                <li>Que podemos modificar precios con 30 días de anticipación</li>
              </ul>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">8. Limitación de Responsabilidad</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                En la máxima medida permitida por la ley, CobroFlow no será responsable por daños indirectos, 
                incidentales, especiales, consecuentes o punitivos, incluyendo pérdida de beneficios, datos, 
                uso u otras pérdidas intangibles.
              </p>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">9. Modificaciones</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán 
                en vigor inmediatamente después de su publicación. El uso continuado del Servicio constituye 
                aceptación de los términos modificados.
              </p>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">10. Terminación</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Podemos suspender o terminar su acceso al Servicio inmediatamente, sin previo aviso, por cualquier 
                motivo, incluyendo incumplimiento de estos Términos. Usted puede cancelar su cuenta en cualquier 
                momento desde la configuración de su cuenta.
              </p>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">11. Ley Aplicable</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Estos Términos se regirán e interpretarán de acuerdo con las leyes de la República Argentina, 
                sin tener en cuenta sus disposiciones sobre conflictos de leyes. Cualquier disputa será sometida 
                a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-semibold text-gray-800 mb-4">12. Contacto</h2>
              <p class="text-gray-600 leading-relaxed">
                Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos en:
              </p>
              <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                <p class="text-gray-700 font-medium">CobroFlow</p>
                <p class="text-gray-600">Email: legal&#64;cobroflow.com</p>
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
            <a routerLink="/auth/privacy" class="text-sm text-gray-500 hover:text-emerald-600">Política de Privacidad</a>
            <a href="mailto:soporte&#64;cobroflow.com" class="text-sm text-gray-500 hover:text-emerald-600">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class TermsComponent {}
