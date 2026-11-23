# FinanzasOSS · Release gate para staging (beta)

**Estado 23-nov-2026:** la versión candidata superó la prueba controlada al 5 %, se verificó una reversión real y después se promovió al **100 % de staging privado**. La versión anterior permanece disponible para rollback. Esto NO autoriza beta pública, uso productivo ni cambios de base de datos.

## Invariantes obligatorios
1. Fuente identificable mediante PR, commit y artefacto inmutable; sin minificaciones improvisadas ni transferencia parcial.
2. SHA-256 y git blob SHA-1 del mismo artefacto que pasó CI, con tamaño exacto y `node --check`.
3. Mismos bindings, Access, D1, secretos, fechas de compatibilidad y triggers; nunca copiar valores de secretos a GitHub.
4. Ninguna migración de D1 durante un cambio de interfaz. Copias de seguridad, historial y restauración se verifican por separado.
5. Revisión automatizada de navegador + finanzas con datos ficticios y checks de rutas imprescindibles.
6. Cloudflare **no debe promocionar** una versión que no coincida con el manifiesto o con las vinculaciones originales.
7. Tener previamente identificado el `previous_version_id` y poder ejecutar un rollback inmediato.

## Procedimiento operativo
1. Confirmar CI y QA visual terminados con éxito; cotejar `source_pr` y `reviewed_merge_commit` de `releases/finanzasoss-staging-2026-11-23.json`.
2. Ejecutar `node scripts/verify-staging-artifact.mjs <archivo.mjs> releases/finanzasoss-staging-2026-11-23.json`. Una discrepancia bloquea el despliegue.
3. Crear la versión candidata **sin trafico** con `POST .../workers/scripts/{script}/versions`, `bindings_inherit=strict`, y verificar hashes y bindings; conservar el ID previo.
4. Validar que `GET .../deployments` sigue asignando el 100 % a la versión anterior.
5. Solo cuando haya autorización de publicar staging, hacer **canary limitado** mediante `POST .../deployments` con porcentajes explícitos; observar excepciones por versión y no inferir «sin fallos» si no hay tráfico significativo.
6. Promocionar al 100 % únicamente tras verificar el canary, operaciones esenciales y ausencia de regresiones. Verificar el **ID de versión que recibe tráfico** con `GET .../deployments`. Para verificar el paquete, utilizar el SHA-256 del artefacto revisado previo a subir y los metadatos inmutables (`GET .../versions/{version_id}`). **No inferir el SHA de la versión activa desde `GET .../content/v2`**: cuando existe un upload nuevo sin tráfico, ese endpoint puede devolver el contenido más recientemente subido en vez del contenido asociado al deployment activo.
7. Ante aumento de errores, rutas ausentes o saldos incorrectos, ejecutar `POST .../deployments` con `versions:[{version_id: previous_version_id,percentage:100}]`. Confirmar por `GET .../deployments` que el 100 % volvió al ID previo; contrastar ese ID con la metadata/etag del backup de versión previo. El checksum de `GET .../content/v2` por sí solo NO prueba la reversión.
8. Registrar los resultados, commit, paquete, Worker version y responsables en la incidencia de beta de GitHub.

**Restricciones:** nunca se usa `PUT /workers/scripts/{script}` directamente para una promoción sin posibilidad de rollback. No desactivar Cloudflare Access, no recrear bindings, no exponer tokens ni capturar contenido financiero en logs. Si la reversión no está verificada, detener la publicación y no afirmar disponibilidad plena. La validación final depende de iPhone y Android reales.

## Evidencia de la versión de referencia
- Source PR: #237, CI run 45134209446, navegador Chromium/WebKit 45134453598.
- SHA256 del paquete: `ee8e24ea5b7da35d1137d98afba8e209e7e4b4f2a8bfb715e920a4d76443af8e`.
- Git blob SHA1: `8e381b5a23c22c9cc7813bd475d545a78d1ae128`.
- Versión anterior: `6491cfa6-5f71-49b9-bc55-b444e4b33cb7`.
- Candidata sin tráfico: `8c5b5b19-b2a7-4ce6-b6e6-aef5e70f4c89`.

## Hallazgo de la prueba de canary (23-nov-2026)

Se verificó en la cuenta de staging que, al subir `8c5b5b19-b2a7-4ce6-b6e6-aef5e70f4c89` sin tráfico, `GET .../deployments` mantenía 100 % en `6491cfa6-5f71-49b9-bc55-b444e4b33cb7`, mientras que `GET .../content/v2` devolvía el SHA-256 de la versión **nueva**, `ee8e24ea5b7da35d1137d98afba8e209e7e4b4f2a8bfb715e920a4d76443af8e`. El guard de canary abortó de forma segura sin cambios de tráfico, lo que motivó esta aclaración. Nunca comparar el endpoint de contenido como si fuera prueba de porcentaje activo.

## Registro de publicación del 23 de noviembre de 2026

| Control | Resultado |
|---|---|
| PR de recuperación del source | #237, integrado; CI 45134209446 y WebKit/Chromium 45134453598, éxito |
| PR del release gate | #238; ejecución 45176129531, éxito |
| PR sobre checksum vs porcentaje activo | #239; publicado en el procedimiento |
| SHA-256 artefacto aprobado | `ee8e24ea5b7da35d1137d98afba8e209e7e4b4f2a8bfb715e920a4d76443af8e` |
| Binding parity | 24 de 24, sin reemplazar secretos ni D1 |
| Canary | 5 % nuevo + 95 % anterior, verificado |
| Reversión | 100 % anterior, verificada (`af1615ac-3118-42c9-930f-a31a68031eba`) |
| Promoción | 100 % candidato (`050ca277-a7e5-40fc-9fd8-2af5c3713dae`) |
| Versión actual | `8c5b5b19-b2a7-4ce6-b6e6-aef5e70f4c89` |
| Versión anterior recuperable | `6491cfa6-5f71-49b9-bc55-b444e4b33cb7` |
| Datos reales | Sin migraciones, borrados ni cambios directos; solo reemplazo del código del Worker |

**Pendiente:** comprobar uso real en iOS/Android, restauración de copia D1 aislada, seguridad externa y gates jurídicos antes de abrir beta. Sin estas comprobaciones no hay autorización de lanzamiento.
