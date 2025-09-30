import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "./Project_box.css";
import { authorizedFetch } from '../utils/api.js';

const ProjectBox = ({ project, onAddTask, onEditProject, onShowDeleteDialog, changeView, refreshTasks, isSubscribed }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [editedDescription, setEditedDescription] = useState(project.description || "");
  const [hasTasks, setHasTasks] = useState(false);
  const [runningTaskProgress, setRunningTaskProgress] = useState(null);

  useEffect(() => {
    // Check if the project has tasks and get running task progress
    const fetchTasksAndProgress = async () => {
      try {
        const response = await authorizedFetch(`/api/projects/${project.id}/tasks/`);
        const tasks = await response.json();
        setHasTasks(tasks.length > 0);
        
        // Find running task and get its progress
        const runningTask = tasks.find(task => 
          task.status === 10 || task.status === 20 || task.status === 30 // Processing statuses
        );
        
        if (runningTask) {
          setRunningTaskProgress(runningTask.progress || 0);
        } else {
          setRunningTaskProgress(null);
        }
      } catch (err) {
        console.error("Failed to fetch tasks: " + err.message);
      }
    };

    fetchTasksAndProgress();
  }, [project.id, refreshTasks]); // Added refreshTasks as a dependency to re-run useEffect when tasks are updated

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await authorizedFetch(`/api/projects/${project.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription
        })
      });
      const updatedProject = await response.json();
      onEditProject(project.id, updatedProject);
      setIsEditing(false);
    } catch (err) {
      console.log("Failed to update project: " + err.message);
    }
  };

  const handleCancel = () => {
    setEditedName(project.name);
    setEditedDescription(project.description || "");
    setIsEditing(false);
  };

  return (
    <div className="project-box-outer">
      <div className="project-box-inner">
        {isEditing ? (
          <>
          <div className="editarea">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="edit-input"
              placeholder="Project Name"
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="edit-textarea"
              placeholder="Project Description"
              rows="3"
            />
            </div>
            <div className="project-actions">
              <div className="save-link" onClick={handleSave}>
                💾 Save
              </div>
              <div className="cancel-link" onClick={handleCancel}>
                ❌ Cancel
              </div>
            </div>
          
          </>
        ) : (
          <>
            <div className="project-header">
              <div className="project-title-section">
                <div className="project-title">{project.name}</div>
                <div className="edit-link" onClick={handleEdit}>
                  ✏️
                </div>
              </div>
              <div className="project-description">
                {project.description || "Project description lorem ipsum random words urulakkupperi dhashamoolam"}
              </div>
            </div>
          </>
        )}
      </div>
    
        <div className="project-actions-outer">
          <div className="action-button add-task-btn" onClick={() => {
            if (!isSubscribed) {
              alert('Subscription required');
              return;
            }
            onAddTask(project.id);
          }}>
            +
          </div>
          <div className="action-button delete-btn" onClick={() => onShowDeleteDialog(project)}>
            🗑️
          </div>
          {hasTasks && (
            <div className="action-button view-tasks-btn" onClick={() => changeView("tasks", project.id)}>
              👁️
            </div>
          )}
        </div>

    </div>
  );
};

export default ProjectBox;