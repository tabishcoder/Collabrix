import KanbanTask from "./KanbanTask";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

const KanbanColumn = ({ column, tasks }) => {
  return (
    <div
      style={{
        width: "250px",
        background: "#f4f5f7",
        padding: "10px",
        borderRadius: "8px",
      }}
    >
      <h3>{column.title}</h3>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <KanbanTask key={task.id} task={task} />
        ))}
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
