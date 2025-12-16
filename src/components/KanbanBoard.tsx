import { useEffect, useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { queryBuilder } from '../lib/taylordb.client';
import type { TableRaws } from '../lib/taylordb.types';
import { BacklogStatusOptions } from '../lib/taylordb.types';

type BacklogItem = TableRaws<'backlog'>;

export function KanbanBoard() {
  const [tasks, setTasks] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const result = await queryBuilder
          .selectFrom('backlog')
          .selectAll()
          .execute();

        setTasks(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const groupTasksByStatus = (tasks: BacklogItem[]) => {
    const grouped: Record<string, BacklogItem[]> = {};

    BacklogStatusOptions.forEach(status => {
      grouped[status] = [];
    });

    tasks.forEach(task => {
      if (task.status) {
        if (grouped[task.status]) {
          grouped[task.status].push(task);
        } else {
          // Fallback for statuses not in the predefined options
          if (!grouped['Other']) {
            grouped['Other'] = [];
          }
          grouped['Other'].push(task);
        }
      } else {
        if (!grouped['No Status']) {
          grouped['No Status'] = [];
        }
        grouped['No Status'].push(task);
      }
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const groupedTasks = groupTasksByStatus(tasks);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Task Kanban Board</h1>
      <div className="flex gap-6 overflow-x-auto pb-6">
        {Object.entries(groupedTasks).map(([status, statusTasks]) => (
          <KanbanColumn
            key={status}
            title={status}
            tasks={statusTasks}
          />
        ))}
      </div>
    </div>
  );
}