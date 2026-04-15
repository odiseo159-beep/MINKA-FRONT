import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad — Minka",
  description:
    "Política de privacidad y protección de datos personales de Minka, conforme a la Ley N° 29733 del Perú.",
};

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-minka-500">Minka</span>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>&#8592;</span> Volver
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Política de Privacidad y Protección de Datos Personales
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Fecha de vigencia: 14 de abril de 2026
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            1. Responsable del tratamiento
          </h2>
          <p className="text-gray-600 leading-relaxed">
            SimplifAI, representado por Daniel (
            <a
              href="mailto:odiseo159@gmail.com"
              className="text-minka-500 hover:underline"
            >
              odiseo159@gmail.com
            </a>
            ), es el responsable del tratamiento de los datos personales
            ingresados en la plataforma Minka.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            2. Datos que recopilamos
          </h2>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-1">
            <li>
              <span className="font-medium text-gray-700">Del abogado:</span>{" "}
              nombre, correo electrónico, nombre del estudio jurídico.
            </li>
            <li>
              <span className="font-medium text-gray-700">De los casos:</span>{" "}
              nombre y teléfono de clientes, número de expediente, tipo de caso,
              estado procesal, notas internas, documentos adjuntos.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            3. Finalidad del tratamiento
          </h2>
          <p className="text-gray-600 leading-relaxed mb-2">
            Los datos se utilizan exclusivamente para:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-1">
            <li>Gestionar el seguimiento de casos legales del abogado.</li>
            <li>
              Generar respuestas de asistencia mediante inteligencia artificial.
            </li>
            <li>
              Enviar notificaciones a clientes vía WhatsApp cuando el abogado lo
              indique.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            4. Proveedores tecnológicos (encargados del tratamiento)
          </h2>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
            <li>
              <span className="font-medium text-gray-700">Anthropic PBC:</span>{" "}
              procesamiento de consultas mediante IA (datos enviados solo al
              formular preguntas al asistente).
            </li>
            <li>
              <span className="font-medium text-gray-700">
                Cloudflare Inc.:
              </span>{" "}
              almacenamiento cifrado de documentos en la nube (Cloudflare R2,
              AES-256).
            </li>
            <li>
              <span className="font-medium text-gray-700">
                Railway Technologies:
              </span>{" "}
              alojamiento del servidor backend.
            </li>
            <li>
              <span className="font-medium text-gray-700">Vercel Inc.:</span>{" "}
              alojamiento del frontend.
            </li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            Ninguno de estos proveedores usa los datos para entrenar modelos
            propios.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            5. Derechos ARCO
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Como titular de los datos tienes derecho a:{" "}
            <span className="font-medium text-gray-700">
              Acceso, Rectificación, Cancelación y Oposición
            </span>{" "}
            al tratamiento de tus datos personales. Para ejercer estos
            derechos, escribe a{" "}
            <a
              href="mailto:odiseo159@gmail.com"
              className="text-minka-500 hover:underline"
            >
              odiseo159@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            6. Confidencialidad
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Minka no accede ni revisa el contenido de tus casos. Los datos son
            procesados de forma automatizada. El abogado es el único responsable
            de la información que ingresa a la plataforma y de cumplir con el
            secreto profesional aplicable.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            7. Modificaciones
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Esta política puede actualizarse. Te notificaremos de cambios
            significativos al iniciar sesión.
          </p>
        </section>

        <div className="border-t border-gray-200 pt-8 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} SimplifAI — Minka. Todos los
            derechos reservados.
          </p>
        </div>
      </main>
    </div>
  );
}
