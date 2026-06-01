/**
 * E2E Tests — PositionDetails component
 * File: cypress/integration/position.spec.js
 *
 * Seed data used (verified via PostgreSQL MCP and seed.ts):
 *
 *  Position:
 *    id=1  "Senior Full-Stack Engineer"  interviewFlowId=1
 *
 *  InterviewSteps (flowId=1):
 *    id=1  "Initial Screening"    orderIndex=1
 *    id=2  "Technical Interview"  orderIndex=2
 *    id=3  "Manager Interview"    orderIndex=2
 *
 *  Candidates for position 1:
 *    candidateId=3  "Carlos García"  applicationId=4  currentInterviewStep=1  (Initial Screening)
 *    candidateId=1  "John Doe"       applicationId=1  currentInterviewStep=2  (Technical Interview)
 *    candidateId=2  "Jane Smith"     applicationId=3  currentInterviewStep=2  (Technical Interview)
 *
 *  Route: /positions/1  (see App.js → <Route path="/positions/:id" />)
 *  Backend base URL: http://localhost:3010  (proxied by Cypress baseUrl http://localhost:3000)
 */

// ---------------------------------------------------------------------------
// Shared API fixture payloads — mirror exact backend response shapes
// ---------------------------------------------------------------------------

const INTERVIEW_FLOW_RESPONSE = {
  interviewFlow: {
    positionName: 'Senior Full-Stack Engineer',
    interviewFlow: {
      interviewSteps: [
        { id: 1, name: 'Initial Screening' },
        { id: 2, name: 'Technical Interview' },
        { id: 3, name: 'Manager Interview' },
      ],
    },
  },
};

const CANDIDATES_RESPONSE = [
  {
    candidateId: 3,
    fullName: 'Carlos García',
    currentInterviewStep: 'Initial Screening',
    averageScore: 0,
    applicationId: 4,
  },
  {
    candidateId: 1,
    fullName: 'John Doe',
    currentInterviewStep: 'Technical Interview',
    averageScore: 5,
    applicationId: 1,
  },
  {
    candidateId: 2,
    fullName: 'Jane Smith',
    currentInterviewStep: 'Technical Interview',
    averageScore: 4,
    applicationId: 3,
  },
];

// ---------------------------------------------------------------------------
// Helper — register the two GET intercepts and visit the page
// ---------------------------------------------------------------------------
const arrangeAndVisit = () => {
  cy.intercept('GET', '/positions/1/interviewFlow', {
    statusCode: 200,
    body: INTERVIEW_FLOW_RESPONSE,
  }).as('getInterviewFlow');

  cy.intercept('GET', '/positions/1/candidates', {
    statusCode: 200,
    body: CANDIDATES_RESPONSE,
  }).as('getCandidates');

  cy.visit('/positions/1');

  cy.wait('@getInterviewFlow');
  cy.wait('@getCandidates');
};

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('PositionDetails Page', () => {

  // -------------------------------------------------------------------------
  // Test 1: Page load
  // Verifies: position title, all stage columns, candidates in correct columns
  // -------------------------------------------------------------------------
  it('loads the page with title, columns, and candidates in correct stages', () => {
    // Arrange
    arrangeAndVisit();

    // Assert — position title
    cy.get('[data-testid="position-title"]')
      .should('be.visible')
      .and('have.text', 'Senior Full-Stack Engineer');

    // Assert — all three stage columns are visible
    cy.get('[data-testid="stage-column-initial-screening"]').should('be.visible');
    cy.get('[data-testid="stage-column-technical-interview"]').should('be.visible');
    cy.get('[data-testid="stage-column-manager-interview"]').should('be.visible');

    // Assert — stage headers display the correct labels
    cy.get('[data-testid="stage-header-initial-screening"]')
      .should('be.visible')
      .and('have.text', 'Initial Screening');
    cy.get('[data-testid="stage-header-technical-interview"]')
      .should('be.visible')
      .and('have.text', 'Technical Interview');
    cy.get('[data-testid="stage-header-manager-interview"]')
      .should('be.visible')
      .and('have.text', 'Manager Interview');

    // Assert — Carlos García (candidateId=3) is in the Initial Screening column
    cy.get('[data-testid="stage-body-initial-screening"]')
      .find('[data-testid="candidate-card-3"]')
      .should('be.visible');
    cy.get('[data-testid="candidate-name-3"]')
      .should('have.text', 'Carlos García');

    // Assert — John Doe (candidateId=1) is in the Technical Interview column
    cy.get('[data-testid="stage-body-technical-interview"]')
      .find('[data-testid="candidate-card-1"]')
      .should('be.visible');
    cy.get('[data-testid="candidate-name-1"]')
      .should('have.text', 'John Doe');

    // Assert — Jane Smith (candidateId=2) is in the Technical Interview column
    cy.get('[data-testid="stage-body-technical-interview"]')
      .find('[data-testid="candidate-card-2"]')
      .should('be.visible');
    cy.get('[data-testid="candidate-name-2"]')
      .should('have.text', 'Jane Smith');

    // Assert — Manager Interview column starts with no candidate cards
    cy.get('[data-testid="stage-body-manager-interview"]')
      .find('[data-testid^="candidate-card-"]')
      .should('have.length', 0);
  });

  // -------------------------------------------------------------------------
  // Test 2: Drag & drop
  // Simulates moving Carlos García (candidateId=3, applicationId=4) from
  // "Initial Screening" (step id=1) to "Technical Interview" (step id=2).
  // Verifies PUT /candidates/3 is called with the correct request body.
  // -------------------------------------------------------------------------
  it('drag & drop moves candidate and calls PUT /candidates/:id with correct body', () => {
    // Arrange — register PUT intercept BEFORE visiting so no request slips through
    cy.intercept('PUT', '/candidates/3').as('updateCandidate');

    arrangeAndVisit();

    // Act — drag Carlos García from Initial Screening to Technical Interview
    cy.dragAndDrop(
      '[data-testid="candidate-card-3"]',
      '[data-testid="stage-body-technical-interview"]'
    );

    // Assert — backend receives the correct body
    cy.wait('@updateCandidate').then((interception) => {
      expect(interception.request.body).to.deep.include({
        applicationId: 4,        // applicationId of Carlos García
        currentInterviewStep: 2, // id of the "Technical Interview" step
      });
    });

    // Assert — Content-Type header is application/json
    cy.get('@updateCandidate').then((interception) => {
      expect(interception.request.headers['content-type']).to.include('application/json');
    });
  });
});
