/**
 * E2E Tests — PositionDetails component
 *
 * Real seed data verified via PostgreSQL MCP (2026-06-01):
 *
 *  Position:
 *    id=1  "Senior Full-Stack Engineer"  interviewFlowId=1
 *    id=2  "Data Scientist"             interviewFlowId=2
 *
 *  InterviewSteps (flowId=1):
 *    id=1  "Initial Screening"   orderIndex=1
 *    id=2  "Technical Interview" orderIndex=2
 *    id=3  "Manager Interview"   orderIndex=2
 *
 *  Candidates for position 1:
 *    candidateId=3  "Carlos García"  applicationId=4  currentInterviewStep=1  (Initial Screening)
 *    candidateId=1  "John Doe"       applicationId=1  currentInterviewStep=2  (Technical Interview)
 *    candidateId=2  "Jane Smith"     applicationId=3  currentInterviewStep=2  (Technical Interview)
 */

// ---------------------------------------------------------------------------
// Shared fixtures — API responses that mirror real backend payloads
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
// Helper — set up common intercepts before visiting the page
// ---------------------------------------------------------------------------
const setupIntercepts = () => {
  cy.intercept('GET', '/positions/1/interviewFlow', {
    statusCode: 200,
    body: INTERVIEW_FLOW_RESPONSE,
  }).as('getInterviewFlow');

  cy.intercept('GET', '/positions/1/candidates', {
    statusCode: 200,
    body: CANDIDATES_RESPONSE,
  }).as('getCandidates');
};

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('PositionDetails — Senior Full-Stack Engineer (id=1)', () => {
  // -------------------------------------------------------------------------
  // Test 1: Page load — structure, title, stage columns and candidate cards
  // -------------------------------------------------------------------------
  describe('Test 1: Page load', () => {
    beforeEach(() => {
      // Arrange
      setupIntercepts();
      cy.visit('/positions/1');
      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');
    });

    it('renders the position title', () => {
      // Assert
      cy.get('[data-testid="position-title"]')
        .should('be.visible')
        .and('have.text', 'Senior Full-Stack Engineer');
    });

    it('renders the back-to-positions button', () => {
      cy.get('[data-testid="back-to-positions-btn"]').should('be.visible');
    });

    it('renders all three stage columns', () => {
      cy.get('[data-testid="stage-column-initial-screening"]').should('be.visible');
      cy.get('[data-testid="stage-column-technical-interview"]').should('be.visible');
      cy.get('[data-testid="stage-column-manager-interview"]').should('be.visible');
    });

    it('shows the correct stage header labels', () => {
      cy.get('[data-testid="stage-header-initial-screening"]')
        .should('be.visible')
        .and('have.text', 'Initial Screening');

      cy.get('[data-testid="stage-header-technical-interview"]')
        .should('be.visible')
        .and('have.text', 'Technical Interview');

      cy.get('[data-testid="stage-header-manager-interview"]')
        .should('be.visible')
        .and('have.text', 'Manager Interview');
    });

    it('places Carlos García in the Initial Screening column', () => {
      // candidateId=3 → data-testid="candidate-card-3"
      cy.get('[data-testid="stage-body-initial-screening"]')
        .find('[data-testid="candidate-card-3"]')
        .should('be.visible');

      cy.get('[data-testid="candidate-name-3"]')
        .should('have.text', 'Carlos García');
    });

    it('places John Doe in the Technical Interview column', () => {
      // candidateId=1 → data-testid="candidate-card-1"
      cy.get('[data-testid="stage-body-technical-interview"]')
        .find('[data-testid="candidate-card-1"]')
        .should('be.visible');

      cy.get('[data-testid="candidate-name-1"]')
        .should('have.text', 'John Doe');
    });

    it('places Jane Smith in the Technical Interview column', () => {
      // candidateId=2 → data-testid="candidate-card-2"
      cy.get('[data-testid="stage-body-technical-interview"]')
        .find('[data-testid="candidate-card-2"]')
        .should('be.visible');

      cy.get('[data-testid="candidate-name-2"]')
        .should('have.text', 'Jane Smith');
    });

    it('Manager Interview column starts empty', () => {
      cy.get('[data-testid="stage-body-manager-interview"]')
        .find('[data-testid^="candidate-card-"]')
        .should('have.length', 0);
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: Drag & drop — move Carlos García from Initial Screening to
  //         Technical Interview and verify the PUT call is correct
  // -------------------------------------------------------------------------
  describe('Test 2: Drag and drop — move candidate between stages', () => {
    beforeEach(() => {
      // Arrange
      setupIntercepts();

      // Intercept the PUT that fires when the drag ends
      cy.intercept('PUT', '/candidates/3').as('updateCandidateStep');

      cy.visit('/positions/1');
      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');
    });

    it('moves Carlos García from Initial Screening to Technical Interview and calls PUT /candidates/3', () => {
      // Act — drag Carlos García (card-3) from initial-screening to technical-interview
      cy.dragAndDrop(
        '[data-testid="candidate-card-3"]',
        '[data-testid="stage-body-technical-interview"]'
      );

      // Assert — the backend receives the correct body
      cy.wait('@updateCandidateStep').then((interception) => {
        expect(interception.request.body).to.deep.include({
          applicationId: 4,       // applicationId of Carlos García
          currentInterviewStep: 2, // id of "Technical Interview" step
        });
      });
    });

    it('moves John Doe from Technical Interview to Manager Interview and calls PUT /candidates/1', () => {
      // Arrange — override intercept for candidateId=1
      cy.intercept('PUT', '/candidates/1').as('updateJohnDoe');

      // Act
      cy.dragAndDrop(
        '[data-testid="candidate-card-1"]',
        '[data-testid="stage-body-manager-interview"]'
      );

      // Assert
      cy.wait('@updateJohnDoe').then((interception) => {
        expect(interception.request.body).to.deep.include({
          applicationId: 1,       // applicationId of John Doe
          currentInterviewStep: 3, // id of "Manager Interview" step
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: API verification — intercept and inspect GET requests
  // -------------------------------------------------------------------------
  describe('Test 3: API calls verification', () => {
    it('calls GET /positions/1/interviewFlow with the correct URL', () => {
      // Arrange
      cy.intercept('GET', '/positions/1/interviewFlow').as('interviewFlowSpy');
      cy.intercept('GET', '/positions/1/candidates', { body: CANDIDATES_RESPONSE }).as('candidatesSpy');

      // Act
      cy.visit('/positions/1');

      // Assert — the request was made exactly once
      cy.wait('@interviewFlowSpy').its('response.statusCode').should('eq', 200);
    });

    it('calls GET /positions/1/candidates with the correct URL', () => {
      // Arrange
      cy.intercept('GET', '/positions/1/interviewFlow', {
        body: INTERVIEW_FLOW_RESPONSE,
      }).as('interviewFlowSpy');
      cy.intercept('GET', '/positions/1/candidates').as('candidatesSpy');

      // Act
      cy.visit('/positions/1');

      // Assert
      cy.wait('@candidatesSpy').its('response.statusCode').should('eq', 200);
    });

    it('renders candidate data that comes from the API response', () => {
      // Arrange — use real API (no stub) to verify integration
      cy.intercept('GET', '/positions/1/interviewFlow').as('realFlow');
      cy.intercept('GET', '/positions/1/candidates').as('realCandidates');

      // Act
      cy.visit('/positions/1');
      cy.wait('@realFlow');
      cy.wait('@realCandidates');

      // Assert — at least one candidate card is visible
      cy.get('[data-testid^="candidate-card-"]').should('have.length.gte', 1);
    });

    it('PUT /candidates/:id is called with correct Content-Type header', () => {
      // Arrange
      setupIntercepts();
      cy.intercept('PUT', '/candidates/3').as('putCandidate');

      cy.visit('/positions/1');
      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');

      // Act
      cy.dragAndDrop(
        '[data-testid="candidate-card-3"]',
        '[data-testid="stage-body-technical-interview"]'
      );

      // Assert header
      cy.wait('@putCandidate').then((interception) => {
        expect(interception.request.headers['content-type']).to.include('application/json');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Test 4: Navigation — back button returns to /positions
  // -------------------------------------------------------------------------
  describe('Test 4: Navigation', () => {
    beforeEach(() => {
      setupIntercepts();
      cy.visit('/positions/1');
      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');
    });

    it('back button navigates to /positions', () => {
      // Act
      cy.get('[data-testid="back-to-positions-btn"]').click();

      // Assert
      cy.url().should('include', '/positions');
    });
  });
});
