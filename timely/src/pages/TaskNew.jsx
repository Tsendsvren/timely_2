import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { TODAY } from '../lib/dates.js';
import TaskForm from '../components/TaskForm.jsx';

export default function TaskNew() {
  const { actions } = useApp();
  const navigate = useNavigate();

  const onSubmit = (v) => {
    const res = actions.addTask(v);
    if (res.ok) navigate('/planner');
    return res;
  };

  return (
    <section className="page" data-testid="page-task-new">
      <div className="page-header">
        <div>
          <h1>Шинэ даалгавар</h1>
          <p className="muted">Deadline, хугацаагаа оруулбал planner study block санал болгоно.</p>
        </div>
      </div>
      <TaskForm today={TODAY} submitLabel="Нэмэх" onSubmit={onSubmit} onCancel={() => navigate('/planner')} />
    </section>
  );
}