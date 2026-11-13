import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import TaskForm from '../components/TaskForm.jsx';

export default function TaskEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, mine, actions } = useApp();

  const task = mine.tasks.find((t) => t.id === id);
  const existsForOther = data.tasks.some((t) => t.id === id);

  if (!task) {
    return (
      <section className="page" data-testid="page-task-edit">
        <div className="card warn">
          <h1>{existsForOther ? 'Энэ даалгаварт хандах эрхгүй (403)' : 'Даалгавар олдсонгүй (404)'}</h1>
          <div className="actions">
            <Link to="/planner" className="btn ghost">Planner руу буцах</Link>
          </div>
        </div>
      </section>
    );
  }

  const onSubmit = (v) => {
    const res = actions.updateTask(id, v);
    if (res.ok) navigate('/planner');
    return res;
  };

  const onDelete = () => {
    const res = actions.deleteTask(id);
    if (res.ok) navigate('/planner');
  };

  const onComplete = () => {
    const res = actions.completeTask(id);
    if (res.ok) navigate('/planner');
  };

  return (
    <section className="page" data-testid="page-task-edit">
      <div className="page-header">
        <div>
          <h1>Даалгавар засах</h1>
          <p className="muted">{task.course || 'Хичээлгүй'}</p>
        </div>
      </div>
      <TaskForm
        initial={task}
        allowPast
        submitLabel="Хадгалах"
        onSubmit={onSubmit}
        onDelete={onDelete}
        onCancel={() => navigate('/planner')}
      />
      {task.status === 'completed' ? (
        <p className="notice">Даалгавар дууссан</p>
      ) : (
        <div className="card">
          <p className="muted sm">Дуусгасан гэж тэмдэглэхэд ач холбогдол болон deadline-аас хамаарсан оноо авна.</p>
          <button type="button" className="btn pri" onClick={onComplete} data-testid="complete-task">Даалгавар дуусгах</button>
        </div>
      )}
      {/* M04: <MissedBlocksPanel taskId={id} /> энд орно */}
    </section>
  );
}