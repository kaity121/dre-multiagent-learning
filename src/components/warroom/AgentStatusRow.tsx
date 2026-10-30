import React from 'react';
import { AgentName, AgentState } from '../../types/reasoning';
import { AgentAvatar } from '../shared/AgentAvatar';
import { Users2 } from 'lucide-react';

interface AgentStatusRowProps {
  agentStates: Record<AgentName, AgentState>;
  activeAgents?: AgentName[];
}

const defaultAgents: AgentName[] = ['Cô Lam', 'Trí', 'Bo', 'An', 'Minh Khang', 'Linh Chi', 'Assessor'];

export const AgentStatusRow: React.FC<AgentStatusRowProps> = ({
  agentStates,
  activeAgents = defaultAgents,
}) => {
  return (
    <div className="w-full bg-white border border-[#E2EAD2] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Users2 className="w-4 h-4 text-stone-700" />
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Bàn tròn tác tử tham gia phiên
          </span>
        </div>
        <span className="text-xs text-stone-500 font-mono">
          {activeAgents.length} tác tử sẵn sàng
        </span>
      </div>

      <div className="flex items-center justify-around gap-2 sm:gap-4 overflow-x-auto py-1">
        {activeAgents.map((agent) => (
          <div key={agent} className="shrink-0 px-2">
            <AgentAvatar
              name={agent}
              state={agentStates[agent] || 'idle'}
              size="md"
              showLabel={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
