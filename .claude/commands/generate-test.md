---
description: Genera un test E2E con Cypress para un componente React del proyecto LTI
---

Usa el agente qa-agent para completar estas tareas:

1. Consulta la BD via MCP PostgreSQL para obtener IDs reales
2. Lee el componente indicado en $ARGUMENTS
3. Añade data-testid a los elementos que los necesiten
4. Crea el archivo de test en frontend/cypress/integration/
5. Usa cy.intercept() para verificar llamadas al backend
6. Crea comandos personalizados en cypress/support/commands.js si son necesarios