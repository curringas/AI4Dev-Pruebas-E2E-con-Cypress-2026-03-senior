# prompts-iniciales.md

## Ejercicio 11 — Pruebas E2E con Cypress
**Master IA4Dev — Módulo 11**  
**Alumno:** Curro Martínez  
**Fecha:** Junio 2026

---

## Descripción del Ejercicio

Implementar pruebas E2E con Cypress para la interfaz `PositionDetails` del sistema LTI (Talent Tracking System), verificando:
1. Carga correcta de la página con título, columnas y candidatos
2. Drag & drop de candidatos entre columnas con verificación del endpoint `PUT /candidates/:id`

---

## Herramientas de Claude Code utilizadas

| Herramienta | Uso |
|-------------|-----|
| `/init` | Generación automática del CLAUDE.md con contexto del proyecto |
| MCP PostgreSQL | Consulta de IDs reales de la BD para construir tests con datos fiables |
| Agente QA (`qa-agent`) | Generación y depuración de los tests E2E |
| Comando `/generate-test` | Comando personalizado reutilizable para generar tests Cypress |

---

## Configuración del entorno

### MCP PostgreSQL
Se configuró el MCP de PostgreSQL para conectar Claude Code directamente a la base de datos del proyecto, permitiendo consultar IDs reales de posiciones y candidatos antes de generar los tests.

```bash
claude mcp add --transport stdio postgres -- npx -y @modelcontextprotocol/server-postgres "postgresql://[credenciales]@localhost:5432/mydatabase"
```

Configurado también en `.claude/settings.json` para que cualquier miembro del equipo tenga el MCP disponible al clonar el proyecto.

### Agente QA
Creado en `.claude/agents/qa-agent.md`. Agente especializado en generación de tests E2E con contexto completo del proyecto LTI: stack, convenciones de selectores, endpoints del backend y estructura de Cypress.

### Comando personalizado `/generate-test`
Creado en `.claude/commands/generate-test.md`. Comando genérico y reutilizable que usa el agente QA para analizar un componente React, añadir `data-testid` donde falten y generar el test E2E correspondiente.

---

## Prompts utilizados

### Prompt 1 — Generación del CLAUDE.md
**Herramienta:** `/init` en Claude Code  
**Acción:** Escaneo automático del proyecto para generar el CLAUDE.md con arquitectura, comandos y convenciones.

---

### Prompt 2 — Generación de los tests E2E
**Herramienta:** Comando `/generate-test` + Agente QA  
**Prompt:**
```
/generate-test PositionDetails.js — genera position.spec.js con dos tests: 
1) carga de página verificando título, columnas y candidatos en su columna correcta, 
2) drag & drop entre columnas verificando llamada PUT /candidates/:id
```

**Resultado:**
- Consulta a la BD via MCP para obtener IDs reales de posiciones y candidatos
- Añadidos `data-testid` a `PositionDetails.js`, `StageColumn.js` y `CandidateCard.js`
- Generado `cypress/integration/position.spec.js` con los dos tests requeridos
- Generado `cypress/support/commands.js` con el comando `cy.dragAndDrop()`

---

### Prompt 3 — Depuración del test de drag & drop
**Herramienta:** Claude Code terminal  
**Contexto:** El test 2 fallaba porque `react-beautiful-dnd` usa `requestAnimationFrame` internamente y los eventos de ratón simulados en Electron headless no calculaban correctamente el `destination.droppableId`.

**Prompt:**
```
El test 2 de position.spec.js falla porque [data-testid="candidate-card-3"] no se encuentra. 
Añade después de arrangeAndVisit() y antes de cy.dragAndDrop() la línea:
cy.get('[data-testid="candidate-card-3"]').should('be.visible');
```

**Iteraciones de depuración:**
1. Añadir espera explícita del elemento antes del drag
2. Reescribir `cy.dragAndDrop()` usando `dispatchEvent` nativo sobre `window`
3. Añadir `cy.wait(200)` entre fase de lift y fase de drop para respetar el rAF
4. **Solución final:** usar el sensor de teclado de react-beautiful-dnd (`Space` → lift, `ArrowRight` → mover, `Space` → drop) que procesa síncronamente sin depender de coordenadas

---

## Resultado final

```bash
cd frontend && npx cypress run --spec cypress/integration/position.spec.js
```

```
✅ Test 1 — loads the page with title, columns, and candidates in correct stages
✅ Test 2 — drag & drop moves candidate and calls PUT /candidates/:id with correct body

2 passing
```

---

## Instrucciones de ejecución

### Requisitos previos
```bash
# 1. Base de datos
docker-compose up -d

# 2. Backend
cd backend && npm start

# 3. Frontend
cd frontend && npm start
```

### Ejecutar los tests
```bash
# Modo interactivo
cd frontend && npx cypress open

# Modo headless
cd frontend && npx cypress run --spec cypress/integration/position.spec.js
```
