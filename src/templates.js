export const TEMPLATE = {
  name: 'research-flow',
  label: 'Research Flow — agentic research system with persistent memory',
  repo: 'dangquan1402/research-flow',
  postInstall: ['uv sync'],
  seedLabels: [
    { name: 'research-goal', color: '0E8A16', description: 'Parent research goal' },
    { name: 'hypothesis', color: '1D76DB', description: 'One angle on a research goal' },
    { name: 'finding', color: 'FBCA04', description: 'Significant finding' },
    { name: 'synthesis', color: '5319E7', description: 'Consolidation of findings' },
    { name: 'maintenance', color: 'C5DEF5', description: 'Memory hygiene work' },
  ],
  projectColumns: ['Backlog', 'In Progress', 'Synthesizing', 'Done'],
  projectName: 'Research Flow',
};
