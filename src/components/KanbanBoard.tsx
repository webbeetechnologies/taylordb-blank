import { useEffect, useState } from "react";
import { KanbanComponent, ColumnsDirective, ColumnDirective } from "@syncfusion/ej2-react-kanban";
import { queryBuilder } from "../lib/taylordb.client";
import { BacklogStatusOptions } from '../lib/taylordb.types';
import { useAuth } from '../hooks/useAuth';

interface KanbanData {
  Id: number;
  Title: string;
  Status: string;
  Priority?: string;
  Type?: string;
  Estimate?: number;
  Description?: string;
  Summary?: string;
}

export function KanbanBoard() {
  const { isAuthenticated } = useAuth();
  const [kanbanData, setKanbanData] = useState<KanbanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const result = await queryBuilder
          .selectFrom("backlog")
          .selectAll()
          .execute();

        // Transform TaylorDB data to Syncfusion Kanban format
        const transformedData: KanbanData[] = result.map((task) => ({
          Id: task.id || 0,
          Title: task.title || '',
          Status: task.status || 'Backlog',
          Priority: task.prio,
          Type: task.type,
          Estimate: task.est,
          Description: task.description,
          Summary: task.title || '',
        }));

        setKanbanData(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [isAuthenticated]);

  const cardTemplate = (props: KanbanData) => {
    return (
      <div className="kanban-card">
        <div className="card-header">
          <div className="card-title">{props.Title}</div>
        </div>
        <div className="card-content">
          <div className="card-tags">
            {props.Priority && (
              <span className="tag priority">{props.Priority}</span>
            )}
            {props.Type && (
              <span className="tag type">{props.Type}</span>
            )}
          </div>
          {props.Estimate && (
            <div className="estimate">Est: {props.Estimate}h</div>
          )}
          {props.Description && (
            <div className="description">{props.Description}</div>
          )}
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">
          Please authenticate to view the Kanban board
        </div>
      </div>
    );
  }

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Task Kanban Board</h1>
      <div className="kanban-wrapper">
        <KanbanComponent
          id="kanban"
          keyField="Status"
          dataSource={kanbanData}
          cardSettings={{
            contentField: "Summary",
            headerField: "Id",
            template: cardTemplate,
          }}
          height="600px"
        >
          <ColumnsDirective>
            {BacklogStatusOptions.map((status) => (
              <ColumnDirective
                key={status}
                headerText={status}
                keyField={status}
                allowToggle={true}
              />
            ))}
          </ColumnsDirective>
        </KanbanComponent>
      </div>

      <style>{`
        .kanban-wrapper {
          height: 600px;
        }

        .kanban-card {
          padding: 12px;
          margin-bottom: 8px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .card-header {
          margin-bottom: 8px;
        }

        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          line-height: 1.4;
        }

        .card-content {
          font-size: 12px;
        }

        .card-tags {
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }

        .tag {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }

        .tag.priority {
          background: #fef3c7;
          color: #92400e;
        }

        .tag.type {
          background: #e0e7ff;
          color: #3730a3;
        }

        .estimate {
          color: #6b7280;
          margin-bottom: 4px;
        }

        .description {
          color: #6b7280;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
