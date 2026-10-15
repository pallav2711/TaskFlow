import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../utils/constants';
import * as projectApi from '../../api/projectApi';

const priorityOptions = TASK_PRIORITIES.map((p) => ({ value: p, label: p }));
const statusOptions = TASK_STATUSES.map((s) => ({ value: s, label: s }));

/**
 * Reusable task form for create and edit flows.
 * Props: initialData, projectId, projectMembers, onSubmit, onCancel, loading,
 *        showProjectSelect (bool), projects (array) — for global task creation
 */
const TaskForm = ({ initialData, projectId, projectMembers = [], onSubmit, onCancel, loading, showProjectSelect = false, projects = [] }) => {
  const [members, setMembers] = useState(projectMembers);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: initialData?.priority || 'Medium',
      status: initialData?.status || 'To Do',
      assignee: initialData?.assignee?._id || initialData?.assignee || '',
      dueDate: initialData?.dueDate
        ? new Date(initialData.dueDate).toISOString().split('T')[0]
        : '',
      project: projectId || initialData?.project?._id || initialData?.project || '',
    },
  });

  // sync projectMembers prop
  useEffect(() => { setMembers(projectMembers); }, [projectMembers]);

  // When project selection changes (global create), fetch its members
  const watchedProject = watch('project');
  useEffect(() => {
    if (!showProjectSelect || !watchedProject) { setMembers([]); return; }
    setLoadingMembers(true);
    projectApi.getProject(watchedProject)
      .then((res) => {
        const proj = res.data.data;
        setMembers([proj.owner, ...(proj.members || [])]);
      })
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [watchedProject, showProjectSelect]);

  useEffect(() => {
    if (initialData) {
      setValue('title', initialData.title || '');
      setValue('description', initialData.description || '');
      setValue('priority', initialData.priority || 'Medium');
      setValue('status', initialData.status || 'To Do');
      setValue('assignee', initialData.assignee?._id || initialData.assignee || '');
      setValue(
        'dueDate',
        initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ''
      );
    }
  }, [initialData, setValue]);

  const memberOptions = members.map((m) => ({
    value: m?._id || m,
    label: m?.name || m,
  }));

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      assignee: data.assignee || null,
      dueDate: data.dueDate || undefined,
      project: data.project || projectId,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
      {/* Project selector — shown only on global task create */}
      {showProjectSelect && (
        <Select
          id="task-project"
          label="Project"
          placeholder="Select a project"
          required
          options={projects.map((p) => ({ value: p._id, label: p.title }))}
          error={errors.project?.message}
          {...register('project', { required: 'Project is required' })}
        />
      )}

      <Input
        id="task-title"
        label="Task title"
        placeholder="e.g. Design landing page"
        required
        error={errors.title?.message}
        {...register('title', {
          required: 'Title is required',
          minLength: { value: 2, message: 'Title must be at least 2 characters' },
          maxLength: { value: 150, message: 'Title cannot exceed 150 characters' },
        })}
      />

      <Textarea
        id="task-description"
        label="Description"
        placeholder="Add more details about this task…"
        rows={3}
        error={errors.description?.message}
        {...register('description', {
          maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' },
        })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="task-priority"
          label="Priority"
          options={priorityOptions}
          error={errors.priority?.message}
          {...register('priority')}
        />
        <Select
          id="task-status"
          label="Status"
          options={statusOptions}
          error={errors.status?.message}
          {...register('status')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="task-assignee"
          label={`Assignee${loadingMembers ? ' (loading…)' : ''}`}
          placeholder="Unassigned"
          options={memberOptions}
          error={errors.assignee?.message}
          {...register('assignee')}
        />
        <Input
          id="task-dueDate"
          label="Due date"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
