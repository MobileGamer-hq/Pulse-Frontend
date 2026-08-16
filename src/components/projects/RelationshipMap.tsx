import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ObsidianGraphCanvas } from '../relationships/ObsidianGraphCanvas';
import type { EntityType } from '../../types';

interface RelationshipMapProps {
  projectId?: string;
}

export const RelationshipMap: React.FC<RelationshipMapProps> = ({ projectId }) => {
  const { pushPanel } = useApp();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    projectId ? `proj-${projectId}` : 'proj-proj-1'
  );

  const handleSelectNode = (id: string, type: EntityType) => {
    setSelectedNodeId(id);
    if (type === 'project') pushPanel({ type: 'project', id });
    else if (type === 'person') pushPanel({ type: 'person', id });
    else if (type === 'task') pushPanel({ type: 'task', id });
    else if (type === 'goal') pushPanel({ type: 'goal', id });
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950">
      <ObsidianGraphCanvas
        selectedNodeId={selectedNodeId}
        onSelectNode={handleSelectNode}
      />
    </div>
  );
};
