import type { KnowledgeNode, KnowledgeConnection } from '../store/useGraphStore';

const generateNodes = (count: number): KnowledgeNode[] => {
  const nodes: KnowledgeNode[] = [];
  const types: KnowledgeNode['type'][] = ['IDEA', 'KNOWLEDGE', 'ACTIVITY', 'REFLECTION', 'GOAL', 'PROJECT', 'LEARNING'];
  const titles = [
    'AI + Education', 'Behavioral Psychology', 'Spaced Repetition', 'Feynman Technique',
    'Personal Knowledge Management', 'Second Brain', 'Zettelkasten', 'Networked Thought',
    'Cognitive Load Theory', 'UX Research', 'Information Architecture', 'Interaction Design'
  ];

  for (let i = 0; i < count; i++) {
    // Math to place them in an orbit around the black hole
    // Higher gravity score means they are closer to the center
    const gravityScore = Math.floor(Math.random() * 100);
    const distance = 5 + (100 - gravityScore) * 0.15 + Math.random() * 2; // Closer if gravity is higher
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 4; // Spread on the Y axis

    nodes.push({
      id: `node-${i}`,
      title: titles[i % titles.length] + (i > titles.length ? ` ${i}` : ''),
      type: types[Math.floor(Math.random() * types.length)],
      description: 'This is a sample description for this knowledge node. It contains insights and relationships to other ideas.',
      tags: ['Learning', 'Design'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gravityScore,
      connections: [],
      position: [Math.cos(angle) * distance, height, Math.sin(angle) * distance]
    });
  }
  return nodes;
};

const generateConnections = (nodes: KnowledgeNode[]): KnowledgeConnection[] => {
  const connections: KnowledgeConnection[] = [];
  nodes.forEach((node) => {
    // connect to 1-3 random nodes
    const numConnections = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numConnections; j++) {
      const target = nodes[Math.floor(Math.random() * nodes.length)];
      if (target.id !== node.id) {
        connections.push({
          sourceId: node.id,
          targetId: target.id,
          strength: Math.random()
        });
      }
    }
  });
  return connections;
};

export const MOCK_NODES = generateNodes(60);
export const MOCK_CONNECTIONS = generateConnections(MOCK_NODES);
