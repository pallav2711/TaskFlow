import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { PROJECT_COLORS, PROJECT_STATUSES } from '../../utils/constants';

const statusOptions = PROJECT_STATUSES.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

const ProjectForm = ({ initialData, onSubmit, onCancel, loading }) => {
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
      status: initialData?.status || 'active',
      color: initialData?.color || '#6366f1',
    },
  });

  const selectedColor = watch('color');

  // sync initialData when editing
  useEffect(() => {
    if (initialData) {
      setValue('title', initialData.title || '');
      setValue('description', initialData.description || '');
      setValue('status', initialData.status || 'active');
      setValue('color', initialData.color || '#6366f1');
    }
  }, [initialData, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        id="proj-title"
        label="Project title"
        placeholder="e.g. Website Redesign"
        required
        error={errors.title?.message}
        {...register('title', {
          required: 'Title is required',
          minLength: { value: 2, message: 'Title must be at least 2 characters' },
          maxLength: { value: 100, message: 'Title cannot exceed 100 characters' },
        })}
      />

      <Textarea
        id="proj-description"
        label="Description"
        placeholder="What is this project about?"
        rows={3}
        error={errors.description?.message}
        {...register('description', {
          maxLength: { value: 500, message: 'Description cannot exceed 500 characters' },
        })}
      />

      <Select
        id="proj-status"
        label="Status"
        options={statusOptions}
        error={errors.status?.message}
        {...register('status')}
      />

      {/* Color picker */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Project color</label>
        <div className="flex gap-2 flex-wrap">
          {PROJECT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
                selectedColor === color ? 'ring-2 ring-offset-1 ring-gray-700 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
        <input type="hidden" {...register('color')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Save changes' : 'Create project'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
