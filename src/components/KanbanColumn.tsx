import { KanbanCard } from './KanbanCard';
import type { TableRaws } from '../lib/taylordb.types';

type BacklogItem = TableRaws<'backlog'>;

interface KanbanColumnProps {
  title: string;
  tasks: BacklogItem[];
}

export function KanbanColumn({ title, tasks }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-80 bg-gray-50 rounded-lg p-4 min-h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No tasks in {title.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
}