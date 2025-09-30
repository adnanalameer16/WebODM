import React, { useState } from 'react';
import { authorizedFetch } from '../utils/api.js';
import ProjectBox from './Project_box';
import './Projects.css';

const Projects = ({ projects, loading, onAddProject, onAddTask, onEditProject, fetchProjects, changeView, isSubscribed }) => {
  const [deleteDialogProject, setDeleteDialogProject] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProject = async (project) => {
    setIsDeleting(true);
    try {
      await authorizedFetch(`/api/projects/${project.id}/`, {
        method: "DELETE",
      });
      setDeleteDialogProject(null);
      if (fetchProjects) await fetchProjects();
    } catch (err) {
      alert("Failed to delete project: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="projects-container">
      <button className="add-button" onClick={() => {
        if (!isSubscribed) {
          alert('Subscription required');
          return;
        }
        onAddProject();
      }}>
        ➕ New Project
      </button>
      {loading ? (
        <p className="loading">Loading projects...</p>
      ) : (
        <div className="project-grid">
          {projects.map((proj) => (
            <ProjectBox
              key={proj.id}
              project={proj}
              onAddTask={() => onAddTask(proj.id)}
              onEditProject={onEditProject}
              onShowDeleteDialog={setDeleteDialogProject}
              changeView={changeView}
              isSubscribed={isSubscribed}
            />
          ))}
        </div>
      )}
      {deleteDialogProject && (
        <div className="modal-overlay">
          <div className="dialog">
            <p>Are you sure you want to delete this project?</p>
            <div className="delete-dialog-actions">
              <button onClick={() => handleDeleteProject(deleteDialogProject)} className="delete-dialog-btn" disabled={isDeleting}>Yes</button>
              <button onClick={() => setDeleteDialogProject(null)} className="delete-dialog-btn no" disabled={isDeleting}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;