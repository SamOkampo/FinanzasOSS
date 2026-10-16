# FinanzasOSS Quick — Atajo avanzado de iPhone (STAGING)

> **Solo datos ficticios.** Cloudflare Access protege el Worker. El Atajo precarga el formulario; nunca llama directamente a la API ni guarda entradas. Se requiere revisión humana de tipo económico y confirmación antes de persistir.

## Nuevo flujo

El Atajo pregunta **monto en COP**, **concepto**, **cuenta manual existente** y **método de pago**. Solamente al seleccionar **tarjeta débito**, **tarjeta crédito** o **transferencia bancaria** preguntará además **«¿Qué banco es?»** (nombre libre, sin conexión bancaria). Efectivo, billetera digital y otro método no preguntan el banco. Método y banco se precargan y, una vez confirmados, quedan registrados con el movimiento en D1.

Ejemplo ficticio para tarjeta:

~~~text
https://finanzasoss-quick-staging.socampoecheverry.workers.dev/#quick=1&amount=25000&concept=Almuerzo%20de%20prueba&account=Efectivo%20de%20prueba&method=debit_card&bank=Banco%20de%20prueba
~~~

Ejemplo ficticio para efectivo, sin banco:

~~~text
https://finanzasoss-quick-staging.socampoecheverry.workers.dev/#quick=1&amount=25000&concept=Almuerzo%20de%20prueba&account=Efectivo%20de%20prueba&method=cash&bank=
~~~

El fragmento después de # no se envía en la petición HTTP y se borra de la barra de direcciones antes de las consultas D1. Aun así puede permanecer temporalmente en el historial local de Atajos o ser compartido. **No usar datos reales en staging.**

## Construcción en iOS de «Registrar gasto Quick»

1. Abrir **Atajos**, pulsar **+**, nombrar «Registrar gasto Quick».
2. Añadir **Pedir entrada** tipo **Texto** con «¿Cuánto? (COP, por ejemplo 25000)». Guardar variable **Cantidad**, sin signo de pesos ni separadores de miles.
3. Añadir **Pedir entrada** tipo Texto «¿En qué?», guardar como **Concepto**; acción **Codificar URL** y almacenar como **ConceptoCodificado**.
4. Añadir **Pedir entrada** tipo Texto «¿Desde qué cuenta manual?», por ejemplo **Efectivo de prueba**; guardar como **Cuenta**, luego **Codificar URL** y guardar **CuentaCodificada**.
5. Inicializar **BancoCodificado** con una acción **Texto** vacío y **Establecer variable**. Así, los métodos sin banco enviarán un valor vacío.
6. Añadir **Elegir del menú** con pregunta «¿Cómo pagaste?» y seis opciones. Dentro de cada rama poner acción **Texto** con su código y **Establecer variable MetodoCodigo**:
   - Tarjeta débito → debit_card
   - Tarjeta crédito → credit_card
   - Transferencia bancaria → bank_transfer
   - Efectivo → cash
   - Billetera digital → digital_wallet
   - Otro → other
7. **Solo dentro de las tres ramas Tarjeta débito, Tarjeta crédito y Transferencia bancaria**, agregar tras «Establecer variable MetodoCodigo»: **Pedir entrada** de tipo Texto «¿Qué banco es?»; **Codificar URL** el resultado; **Establecer variable BancoCodificado** con el resultado codificado. En las otras tres ramas no preguntar banco.
8. Después de **Fin del menú**, añadir **Texto** con esta plantilla, sustituyendo los seis campos entre corchetes por las **variables mágicas** (no escribir los corchetes):

~~~text
https://finanzasoss-quick-staging.socampoecheverry.workers.dev/#quick=1&amount=[Cantidad]&concept=[ConceptoCodificado]&account=[CuentaCodificada]&method=[MetodoCodigo]&bank=[BancoCodificado]
~~~

9. Añadir acción **URL** usando ese texto y **Abrir URLs** con su resultado. Algunas versiones de iOS permiten pasar el texto directamente a Abrir URLs.
10. Probar con valores **ficticios**. Safari debe mostrar monto, cuenta, método y banco precargados según corresponda. Revisar y elegir el tipo económico (gasto/transferencia propia/inversión) y confirmar antes de guardar.
11. En los detalles del Atajo escoger **Añadir a pantalla de inicio**. Siri puede activarlo por nombre.

## Validaciones

- Los enlaces previos de cuatro campos (quick, amount, concept, account) siguen funcionando; permiten seleccionar método y banco manualmente en la web.
- La variante nueva exige exactamente seis claves: quick, amount, concept, account, method y bank; sin claves repetidas/adicionales ni campos faltantes.
- Método admitido: cash, debit_card, credit_card, bank_transfer, digital_wallet, other.
- Para tarjeta débito, crédito y transferencia bancaria: banco obligatorio de 1 a 80 caracteres, sin caracteres de control. Para efectivo, billetera u otro: bank vacío; la API también valida esta coherencia.
- Monto positivo en COP, máximo 10 cifras enteras y 2 decimales con punto, sin separador de miles; concepto hasta 120 y cuenta hasta 100 caracteres.
- Solo se preselecciona una cuenta COP si hay una coincidencia única y exacta de etiqueta (sin importar mayúsculas). Si falta o está duplicada, el formulario obliga a seleccionarla manualmente. El **banco pagador** no es lo mismo que la **cuenta manual de origen**.
- Si se cambia el método a efectivo/billetera/otro, el banco se borra y desaparece. El historial muestra el banco cuando consta.
- El Atajo no guarda automáticamente, no crea cuentas ni tiene credenciales. Sigue haciendo falta Cloudflare Access y la confirmación del formulario.
- Si una nueva sesión Cloudflare Access pierde el fragmento, iniciar sesión primero en Safari y ejecutar el Atajo de nuevo.
- No utilizar «Obtener contenidos de URL» para enviar pagos o movimientos. Nunca pedir credenciales de bancos, PIN, CVV ni números de tarjeta.

## Evidencia automatizada

- [x] Prefill legado de cuatro claves sin ruptura.
- [x] Débito, crédito y transferencia requieren y precargan banco; efectivo, billetera y otros lo omiten.
- [x] Formato inválido, banco faltante, método erróneo o banco sobrante son rechazados.
- [x] Cambiar método a efectivo borra el banco.
- [x] No hay POST sin interacción y confirmación humanas.
- [x] D1/API verifican obligación de banco y rechazan banco con efectivo u otros métodos.

## Pruebas físicas pendientes

- [ ] iPhone Atajos → Safari con sesión Access conserva los datos hasta que la página los procese.
- [ ] Las tres opciones bancarias preguntan «¿Qué banco es?» y efectivo no lo pregunta.
- [ ] Banco, método, concepto, cuenta y monto se precargan; tipo de movimiento editable, sin guardado automático.
- [ ] Cancelar la confirmación no escribe; guardar una sola vez preserva bank_label y la clasificación adecuada.
- [ ] Historial, reintento, cuenta ambigua, navegación/redirección Access y error de red probados en iPhone.
