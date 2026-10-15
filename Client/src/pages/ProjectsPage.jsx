import { useState } from 'react';
import toast from 'react-hot-toast';
import * as projectApi from '../api/projectApi';
import useProjects from '../hooks/useProjects';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectForm from '../components/projects/ProjectForm';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';
import SkeletonCard from '../components/ui/SkeletonCard';
import { useAuth } from '../context/AuthContext';

const ProjectsPage = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const { projects, setProjects, loading, error, refetch } = useProjects();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Create ──────────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    setSaving(true);
    try {
      const res = await projectApi.createProject(data);
      setProjects((prev) => [res.data.data, ...prev]);
      setShowCreateModal(false);
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────
  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      const res = await projectApi.updateProject(editTarget._id, data);
      setProjects((prev) =>
        prev.map((p) => (p._id === editTarget._id ? res.data.data : p))
      );
      setEditTarget(null);
      toast.success('Project updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectApi.deleteProject(deleteTarget._id);
      setProjects((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        actions={isManager ? (
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            New Project
          </Button>
        ) : undefined}
      />

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard count={6} />
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrorMessage message={error} onRetry={refetch} />}

      {/* Empty */}
      {!loading && !error && projects.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
          title="No projects yet"
          description="Create your first project to start organizing tasks and collaborating with your team."
          actionLabel={isManager ? 'Create Project' : undefined}
          onAction={isManager ? () => setShowCreateModal(true) : undefined}
        />
      )}

      {/* Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {isManager && <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create new project"
      >
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={saving}
        />
      </Modal>}

      {/* Edit modal */}
      {isManager && <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit project"
      >
        <ProjectForm
          initialData={editTarget}
          onSubmit={handleUpdate}
          onCancel={() => setEditTarget(null)}
          loading={saving}
        />
      </Modal>}

      {/* Delete confirm */}
      {isManager && <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete project?"
        message={`"${deleteTarget?.title}" and all its tasks will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete project"
        loading={deleting}
      />}
    </div>
  );
};

export default ProjectsPage;
