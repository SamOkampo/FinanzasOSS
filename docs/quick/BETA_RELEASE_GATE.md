# FinanzasOSS · Release gate para staging (beta)

**Estado 23-nov-2026:** la versión candidata ya está almacenada en Cloudflare Workers, sin tráfico. Se conserva la versión anterior. Esta operación no autoriza beta pública, uso productivo ni cambio de base de datos.

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
6. Promocionar al 100 % únicamente tras verificar el canary, operaciones esenciales y ausencia de regresiones. Verificar el SHA-256 de la versión activa con `GET .../content/v2`.
7. Ante aumento de errores, rutas ausentes o saldos incorrectos, ejecutar `POST .../deployments` con `versions:[{version_id: previous_version_id,percentage:100}]`. Confirmar nuevamente estado y SHA-256.
8. Registrar los resultados, commit, paquete, Worker version y responsables en la incidencia de beta de GitHub.

**Restricciones:** nunca se usa `PUT /workers/scripts/{script}` directamente para una promoción sin posibilidad de rollback. No desactivar Cloudflare Access, no recrear bindings, no exponer tokens ni capturar contenido financiero en logs. Si la reversión no está verificada, detener la publicación y no afirmar disponibilidad plena. La validación final depende de iPhone y Android reales.

## Evidencia de la versión de referencia
- Source PR: #237, CI run 45134209446, navegador Chromium/WebKit 45134453598.
- SHA256 del paquete: `ee8e24ea5b7da35d1137d98afba8e209e7e4b4f2a8bfb715e920a4d76443af8e`.
- Git blob SHA1: `8e381b5a23c22c9cc7813bd475d545a78d1ae128`.
- Versión anterior: `6491cfa6-5f71-49b9-bc55-b444e4b33cb7`.
- Candidata sin tráfico: `8c5b5b19-b2a7-4ce6-b6e6-aef5e70f4c89`.
