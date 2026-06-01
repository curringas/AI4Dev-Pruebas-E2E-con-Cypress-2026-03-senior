// ***********************************************
// Custom Cypress commands for the LTI project
// ***********************************************

/**
 * cy.dragAndDrop(sourceSelector, targetSelector)
 *
 * Simulates a drag-and-drop interaction compatible with react-beautiful-dnd.
 * react-beautiful-dnd relies on pointer events, so we simulate the full
 * pointerdown → pointermove → pointerup sequence.
 *
 * @param {string} sourceSelector - data-testid selector of the draggable card
 * @param {string} targetSelector - data-testid selector of the droppable container
 *
 * Example:
 *   cy.dragAndDrop(
 *     '[data-testid="candidate-card-3"]',
 *     '[data-testid="stage-body-technical-interview"]'
 *   );
 */
Cypress.Commands.add('dragAndDrop', (sourceSelector, targetSelector) => {
  // react-beautiful-dnd v13 has a keyboard sensor that is far more reliable
  // in headless Electron than mouse event simulation:
  //   Space  = lift the item
  //   ArrowRight/Left = move between droppable columns
  //   Space  = drop the item
  //
  // We derive how many arrow presses are needed by reading the droppable IDs
  // (data-rbd-droppable-id) of the source and target containers.

  cy.get(sourceSelector)
    .closest('[data-rbd-droppable-id]')
    .invoke('attr', 'data-rbd-droppable-id')
    .then((srcId) => {
      cy.get(targetSelector)
        .closest('[data-rbd-droppable-id]')
        .invoke('attr', 'data-rbd-droppable-id')
        .then((tgtId) => {
          const delta = parseInt(tgtId, 10) - parseInt(srcId, 10);
          const arrowKey = delta > 0 ? 'ArrowRight' : 'ArrowLeft';
          const arrowKeyCode = delta > 0 ? 39 : 37;
          const presses = Math.abs(delta);

          // Lift
          cy.get(sourceSelector)
            .focus()
            .trigger('keydown', { key: ' ', keyCode: 32, code: 'Space', force: true });

          // Let rbd process the lift via requestAnimationFrame
          cy.wait(100);

          // Move one column at a time
          Cypress._.times(presses, () => {
            cy.get(sourceSelector).trigger('keydown', {
              key: arrowKey,
              keyCode: arrowKeyCode,
              code: arrowKey,
              force: true,
            });
            cy.wait(50);
          });

          // Drop
          cy.get(sourceSelector).trigger('keydown', {
            key: ' ',
            keyCode: 32,
            code: 'Space',
            force: true,
          });
        });
    });
});
