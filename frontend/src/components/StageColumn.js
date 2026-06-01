import React from 'react';
import { Col, Card } from 'react-bootstrap';
import { Droppable } from 'react-beautiful-dnd';
import CandidateCard from './CandidateCard';

const StageColumn = ({ stage, index, onCardClick }) => (
    <Col md={3} data-testid={`stage-column-${stage.title.replace(/\s+/g, '-').toLowerCase()}`}>
        <Droppable droppableId={`${index}`}>
            {(provided) => (
                <Card
                    className="mb-4"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    data-testid={`stage-droppable-${stage.title.replace(/\s+/g, '-').toLowerCase()}`}
                >
                    <Card.Header
                        className="text-center"
                        data-testid={`stage-header-${stage.title.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                        {stage.title}
                    </Card.Header>
                    <Card.Body data-testid={`stage-body-${stage.title.replace(/\s+/g, '-').toLowerCase()}`}>
                        {stage.candidates.map((candidate, idx) => (
                            <CandidateCard key={candidate.id} candidate={candidate} index={idx} onClick={onCardClick} />
                        ))}
                        {provided.placeholder}
                    </Card.Body>
                </Card>
            )}
        </Droppable>
    </Col>
);

export default StageColumn;
