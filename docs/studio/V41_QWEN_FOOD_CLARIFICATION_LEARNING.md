# FinanzasOSS v41 · Qwen: resolución y aprendizaje de una respuesta «food»

**Estado:** la v41 implementa el alias `food`, elección de subcategoría, confirmación individual y revocación de reglas por comercio. Consulta la [nota de cierre](./V41_IMPLEMENTATION_PROGRESS.md) para conocer las diferencias frente al diseño original.

## 1. Contrato semántico para «food»

Entrada de aclaración: `"food"` (inglés). El normalizador controlado admite alias explícitos `food`, `comida`, `alimentación`, `alimentacion` → `category="Alimentación"` (valor **exacto** de `TAXONOMY`). Nunca guardar `food` como nombre de categoría, ni inferir por este dato la subcategoría ni modificar la naturaleza económica del movimiento. El normalizador toma la **respuesta de aclaración**, no aplica coincidencias indiscriminadas de palabra sobre descripciones bancarias.

El catálogo actual permite las ocho subcategorías precisas de Alimentación:
- `Onces`
- `Restaurantes`
- `Mercado`
- `Domicilios`
- `Café y bebidas`
- `Panadería`
- `Comida rápida`
- `Snacks y dulces`

En el código también figura `Otros`, pero `setCategory` lo rechaza como categoría final vaga. Si ninguna subcategoría encaja, pedir una explicación libre y revisión en vez de inventar una subcategoría.

**Regla:** una respuesta `food` genera `needs_subcategory` y nunca dispara una actualización de `quick_movement_categories`, `quick_auto_categories` o `quick_category_preferences` hasta que se confirme una subcategoría concreta. Una sugerencia no significa confirmación; es posible conservar el borrador y cerrar el chat.

## 2. Experiencia conversacional

1. El usuario abre una pregunta pendiente referida a un **único movimiento** del perfil autenticado (la identidad se deriva de Cloudflare Access).
2. Qwen pregunta: «No pude clasificar este movimiento con suficiente seguridad. ¿Qué compraste o pagaste?».
3. El usuario responde `food`.
4. El Worker valida que el movimiento pertenece al propietario, sigue vigente y es una compra `kind='purchase'`; en caso contrario solicita revisión de naturaleza económica, sin reclasificar automáticamente transferencias propias, pagos de deuda, inversiones o abonos como consumo.
5. El normalizador reconoce `food → Alimentación` con regla determinista, sin gastar una llamada al modelo. La respuesta se registra **solo en el estado pendiente del diálogo** (`category='Alimentación', subcategory=null, stage='needs_subcategory'`). Una conversación persistida podrá guardar el alias minimizado `food` si hubo consentimiento; nunca es necesario guardar por duplicado textos con datos personales.
6. El chat muestra ocho opciones anteriores, sin seleccionar automáticamente ninguna, más «Ninguna / explicar».
7. El usuario elige una subcategoría (p. ej. `Onces`). La app ofrece una previsualización «Alimentación → Onces», el movimiento al que se aplicará, y una casilla **desmarcada por defecto** «Recordar este comercio para movimientos futuros equivalentes».
8. Con confirmación explícita, registrar **solo la clasificación del movimiento elegido** y marcar la aclaración `resolved`; recalcular los gráficos por categoría derivados del libro sin modificar importe, moneda, fecha, banco, medio de pago o sentido.
9. Si el usuario solicita recordar, evaluar la seguridad del alcance de la preferencia como se define más abajo. Si no es segura, no guardar una regla global y explicar por qué.
10. Si no confirma, cancelar o guardar borrador sin cambiar movimientos; ninguna notificación vuelve a insistir mientras esté `snoozed` o `resolved`.

### Ejemplo breve (simulación)
- Qwen: «¿Qué fue este gasto?»
- Usuario: «food».
- Qwen: «Entendido: Alimentación. ¿Fue Onces, Restaurantes, Mercado, Domicilios, Café y bebidas, Panadería, Comida rápida o Snacks y dulces?»
- Usuario: «Onces».
- Qwen: «Propuesta para **este** movimiento: Alimentación → Onces. ¿Confirmas? ¿Debo recordarlo para futuras compras equivalentes?»
- Usuario: «Confirmar; no recordar».
- Resultado planeado: categoría manual específica confirmada, sin crear una preferencia futura.

## 3. Seguridad de aprendizaje: qué significa recordar

**No hay fine-tuning de Qwen ni entrenamiento de sus pesos.** «Aprender» significa guardar **preferencias explícitas de clasificación por propietario**, con alcance, origen, evidencia y capacidad de corrección o revocación. Una categoría confirmada en un movimiento **no se generaliza** a todos los futuros movimientos por sí sola.

Tres ámbitos de aprendizaje:
- `one_movement` (predeterminado): solo el movimiento seleccionado, sin regla de futuro.
- `exact_merchant`: tras consentimiento, se permite una regla por comercio verdadero y firma de concepto suficientemente específica, con exclusión de referencias personales; nuevas compras equivalentes pueden recibir una sugerencia o categoría según política de confianza.
- `manual_review_only`: proveedores de pago, intermediarios, conceptos genéricos o identidades ambiguas; se guarda únicamente la clasificación individual y se puede mostrar como ejemplo contextual **no autoritativo**, nunca como regla que cambie transacciones futuras.

**Intermediarios de pago** tales como `Wompi`, `PayU`, `Mercado Pago`, `PSE` o descripciones genéricas `Transferencia` son `manual_review_only` por defecto: un Wompi clasificado como comida NO implica que los siguientes Wompi sean comida. Si el descriptor bancario verifica inequívocamente al negocio final, la app podrá proponer una firma más estrecha y requerir consentimiento específico. No usar montos, nombres de bancos o cuentas como llave global de aprendizaje por defecto.

**Nunca propagar** una preferencia a movimientos históricos o futuros que ya tienen categoría manual, naturaleza económica protegida, tipo distinto de compra, o discrepancia de descripción. Si se ofrecen reclasificaciones históricas, deben presentarse en un lote separado para aprobación expresa; nunca modificar automáticamente todos los registros por usar «Recordar».

**Precedencia**: clasificación manual confirmada del movimiento > preferencia contextual expresamente aprobada y aplicable > reglas deterministas verificadas > sugerencia Qwen > estado «Por revisar». En discrepancia, el chat pregunta; no sobreescribe corrección manual.

**Reversión**: acción «No recordar este comercio» borra/desactiva la preferencia individual del propietario sin borrar categorías previamente confirmadas, movimientos o historial contable. Las sugerencias automáticas previamente aplicadas requieren un flujo de revisión reversible con auditoría.

## 4. Persistencia propuesta

Reutilizar:
- `quick_movement_categories(owner_id,source,movement_id,category,subcategory,classification_source='manual',updated_at)` para el resultado **confirmado**.
- `quick_auto_categories` solo como sugerencias/propuestas pendientes; la categoría manual prevalece.
- `quick_category_preferences` por propietario para reglas existentes, pero **no** invocar automáticamente la propagación actual de `learnCategory` para intermediarios o alcance dudoso. Sustituir esa propagación amplia por aprendizaje contextual seguro en v41.
- `quick_ai_review_items` y `quick_qwen_threads/messages` de la adenda v41 para estado de la aclaración y conversaciones.

Ampliaciones **propuestas** para una migración aditiva posterior:
- `quick_category_feedback_events`: `id`, `owner_id`, `review_item_id`, `source`, `movement_id`, `answer_alias`, `proposed_category`, `proposed_subcategory NULL`, `status` (`needs_subcategory`, `awaiting_confirmation`, `confirmed`, `dismissed`), `idempotency_key`, `rule_version`, `created_at`, `confirmed_at NULL`; `UNIQUE(owner_id,idempotency_key)`; no almacenar textos bancarios crudos.
- `quick_category_learning_rules`: `id`, `owner_id`, `merchant_signature`, `merchant_kind` (`direct`,`intermediary`,`ambiguous`), `category`, `subcategory`, `scope`, `source_feedback_id`, `consent_at`, `disabled_at NULL`, `updated_at`; índices por `owner_id, merchant_signature`. Se aplican solo a compras y deben superar umbrales de coincidencia contextual.
- `quick_category_rule_audit`: eventos de creación, edición, aplicación, revocación y conflictos, separados por propietario, con retención acotada.

Todas las tablas: `owner_id` derivado del principal Access, consultas preparadas y transacciones atómicas; sin identificadores de otros usuarios y sin reemplazar montos o hechos financieros. Borrar conversaciones o preferencias según opciones de privacidad y retención.

## 5. API de chat (contratos v41 planeados, NO desplegados)

### Aclaración (borrador, sin mutación financiera)
`POST /api/quick/v41/agent/clarifications/{itemId}/answer`

Request, identidad autenticada implícita:
```json
{"answer":"food","idempotencyKey":"client-uuid"}
```

Respuesta:
```json
{
 "status":"needs_subcategory",
 "recognizedAlias":"food",
 "category":"Alimentación",
 "subcategory":null,
 "allowedSubcategories":[
  "Onces","Restaurantes","Mercado","Domicilios",
  "Café y bebidas","Panadería","Comida rápida","Snacks y dulces"
 ],
 "storedClassification":false,
 "learningRuleCreated":false
}
```

### Propuesta y confirmación separadas
`POST /api/quick/v41/agent/clarifications/{itemId}/propose`

```json
{"subcategory":"Onces","rememberScope":"one_movement","idempotencyKey":"client-uuid"}
```

Devuelve vista previa con `requiresConfirmation:true` y un token de desafío ligado a propietario, movimiento, categoría/subcategoría y versión. **Todavía no guarda categoría manual**.

`POST /api/quick/v41/agent/clarifications/{itemId}/confirm`

```json
{"challengeId":"server-issued-challenge","confirmed":true,"idempotencyKey":"client-uuid"}
```

Verifica titularidad, estado, versión, taxonomía, consentimiento, que el movimiento no haya sido eliminado/reclasificado, y alcance de aprendizaje. Ejecuta escritura atómica de categoría manual, evento de feedback, cierre de alerta y (solo si se solicita y es seguro) preferencia explícita. Responde `{saved:true,category:"Alimentación",subcategory:"Onces",learningScope:"one_movement"}`; reintentos idénticos devuelven mismo resultado sin duplicar notificaciones.

Errores: 403 propietario equivocado, 404 movimiento inexistente, 409 versión o confirmación conflictiva, 422 categoría imprecisa, 429 solo si se intenta inferencia de modelo y se excedió su cuota. La normalización determinista de `food` debe funcionar aun si la cuota Qwen está agotada, respetando que mostrar el chat exige los permisos correspondientes.

## 6. Chat y notificaciones

- Una sola pregunta `needs_review` por `(owner_id,source,movement_id,rule_version)`, sin push repetido por reintentos.
- Si el usuario responde `food` y falta subcategoría, mostrar la siguiente pregunta **en el chat**. No crear múltiples Push por cada paso conversacional.
- Al confirmar `Alimentación → Onces`, resolver la alerta original. No asumir que todo el extracto se ha conciliado.
- El digest diario puede decir «Tienes 2 movimientos por clasificar», sin datos bancarios sensibles en la notificación.
- En caso de no consentimiento o Qwen inaccesible, ofrecer el selector manual con el mismo catálogo y sin bloqueo.

## 7. QA obligatorio: escenarios

1. `food` → `Alimentación`, `subcategory=null`, `needs_subcategory`, **cero actualizaciones al libro**.
2. `food` + `Onces` sin confirmación → borrador únicamente.
3. Confirmación → una categoría manual para **un** movimiento propietario; importe, fecha, banco, sentido y tipo intactos.
4. Seleccionar «recordar» para un comercio inequívoco → preferencia contextual creada para su propietario; «no recordar» no la crea.
5. Respuesta `food` sobre intermediario `Wompi SAS` → regla global bloqueada y explicación visible; ninguna compra Wompi posterior clasificada automáticamente como Alimentación.
6. Cuatro compras legítimas del mismo importe y comercio quedan como cuatro movimientos; clasificar uno no los fusiona.
7. Un movimiento de transferencia propia o ingreso no puede convertirse en gasto de Alimentación por responder `food`; revisión de finalidad obligatoria.
8. Conflictos: cambio manual concurrente, eliminación del movimiento, segundo usuario, reintento duplicado → rechazo o respuesta idempotente, sin propagación.
9. Cuota IA agotada → alias y selector manual disponibles; ningún cambio sin consentimiento.
10. Dashboard de categorías se recalcula tras confirmación sin modificar los totales financieros de gastos ni saldos.
11. Revocar una regla de aprendizaje no borra las clasificaciones confirmadas; la auditoría registra el cambio.
12. Notificaciones Push: una sola alerta por caso, ninguna al cerrar/resolver, contenido privado fuera del Push.

## 8. Distinción entre v40 y v41 (importante)

**Ya existe en código v40:** taxonomía española, `setCategory`, `learnCategory`, reglas por comercio, preguntas Qwen por texto natural, consentimiento, cuotas y Push de clasificación.

**No existe todavía:** flujo v41 de múltiples pasos `food` → subcategoría → confirmación, feedback auditado con idempotencia, bloqueo especial de intermediarios, aprendizaje contextual granular, chat flotante con estado persistente y una cola proactiva integrada.

Este documento **no activa ni prueba esas funciones** y no muta movimientos reales. Para implementación, añadir migración, endpoints y pruebas sintéticas antes de un despliegue a staging.
