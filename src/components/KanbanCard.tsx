import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { TableRaws } from '../lib/taylordb.types';

type BacklogItem = TableRaws<'backlog'>;

interface KanbanCardProps {
  task: BacklogItem;
}

export function KanbanCard({ task }: KanbanCardProps) {
  return (
    <Card className="mb-2 cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-2">
          {task.prio && (
            <Badge variant="secondary" className="text-xs">
              {task.prio}
            </Badge>
          )}
          {task.type && (
            <Badge variant="outline" className="text-xs">
              {task.type}
            </Badge>
          )}
        </div>
        {task.est && (
          <div className="text-xs text-muted-foreground">
            Est: {task.est}h
          </div>
        )}
        {task.description && (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}