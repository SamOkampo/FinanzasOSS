# FinanzasOSS Quick — Atajo avanzado para iPhone (STAGING)

> **Solo datos ficticios.** Esta integración no constituye autorización para almacenar información financiera real. El sitio requiere el inicio de sesión por Cloudflare Access. La revisión humana y la confirmación final de clasificación son obligatorias; el Atajo jamás escribe directamente en D1.

## Funcionamiento

El Atajo solicita **monto (COP)**, **concepto** y **nombre exacto de una cuenta manual existente**. Abre la página privada con esos valores en el fragmento de la URL, por ejemplo:

```text
https://finanzasoss-quick-staging.socampoecheverry.workers.dev/#quick=1&amount=25000&concept=Almuerzo%20de%20prueba&account=Efectivo%20de%20prueba
```

Este fragmento (#...) no se envía en la petición HTTP y el frontend lo elimina de la barra de direcciones **antes de consultar la API**. Sigue siendo temporalmente visible en el Atajo y podría aparecer en historial local o copias del enlace, por eso en staging no usar importes reales ni detalles personales.

## Cómo crear «Registrar gasto Quick» en la app Atajos

1. Abrir **Atajos**, pulsar **+** y llamar al atajo «Registrar gasto Quick».
2. Añadir **Pedir entrada** (tipo **Texto**) con la pregunta **«¿Cuánto? Escribe 25000, sin puntos de miles»**. Usar la variable de resultado como «Cantidad». No introducir el signo $ ni separadores de miles.
3. Añadir **Pedir entrada** (Texto) «¿Concepto de prueba?», por ejemplo «Almuerzo de prueba». Guardar su variable de salida como «Concepto».
4. Añadir **Codificar URL** (también puede llamarse **Codificar texto para URL**, según iOS) para la variable «Concepto». Guardar el resultado como «ConceptoCodificado».
5. Añadir **Pedir entrada** (Texto) «¿Qué cuenta manual?», por ejemplo **Efectivo de prueba**. Guardar el resultado como «Cuenta».
6. Añadir otra acción **Codificar URL** aplicada a «Cuenta». Guardar el resultado como «CuentaCodificada».
7. Añadir la acción **Texto** que contenga la dirección de arriba, reemplazando solo los tres valores de muestra por las **variables mágicas** «Cantidad», «ConceptoCodificado» y «CuentaCodificada». Conservar literalmente `#quick=1&amount=`, `&concept=` y `&account=`. No poner comillas alrededor de las variables.
8. Añadir acción **URL** con el resultado de la acción Texto y luego **Abrir URLs**. Si el editor permite pasar Texto directamente a **Abrir URLs**, puede omitirse el paso URL intermediario.
9. Probar el Atajo con **25000**, **Almuerzo de prueba** y **Efectivo de prueba**. Confirmar que se abre el formulario **sin guardar automáticamente**, que la cuenta coincide y que se solicita seleccionar/revisar el tipo y método de movimiento antes del guardado.
10. Desde el menú de detalles del Atajo, seleccionar **Añadir a pantalla de inicio**. Se podrá invocar por Siri usando su nombre.

## Reglas de protección

- El fragmento debe contener **exactamente** las claves `quick`, `amount`, `concept` y `account`, sin duplicados ni claves adicionales; se borrará incluso si es inválido.
- `amount`: positivo, hasta 10 dígitos enteros y opcionalmente hasta dos decimales con punto, sin signos ni separadores de miles.
- `concept`: texto no vacío de máximo 120 caracteres, sin caracteres de control.
- `account`: texto no vacío de máximo 100 caracteres, sin caracteres de control.
- Solo se selecciona una cuenta si hay **una única coincidencia exacta** de su etiqueta sin distinción de mayúsculas y con moneda COP. Si no existe o hay etiquetas repetidas, **el envío queda bloqueado hasta escoger una cuenta manualmente**.
- El atajo no modifica la clase económica ni el método de pago, no crea cuentas, no envía ningún POST, no guarda en D1 y no aplica autorización propia. Cloudflare Access continúa siendo imprescindible.
- Un inicio de sesión nuevo en Access puede eliminar el fragmento durante la redirección. Para probar, iniciar sesión primero en Safari y luego abrir el Atajo. Cuando se expire la sesión, volver a autenticarse y ejecutar el atajo otra vez.
- No usar «Obtener contenidos de URL» para enviar el movimiento desde Atajos: la API requiere una petición de mismo origen y confirmación humana.
- No se ha realizado todavía la prueba física en un iPhone real. Debe verificarse antes de marcar Q5 como completada.

## Criterios de prueba física pendiente

- [ ] Safari iOS con Cloudflare Access autenticado mantiene el fragmento durante la navegación de Atajos a la web.
- [ ] Monto, concepto y cuenta aparecen precargados; clasificación y método siguen bajo control humano.
- [ ] Rechazar la confirmación no crea entradas.
- [ ] Guardar una vez registra un único movimiento ficticio; refrescar no duplica.
- [ ] Cuenta desconocida o ambigua requiere selección manual.
- [ ] Al cerrar/abrir Safari, no quedan datos precargados en la URL.
