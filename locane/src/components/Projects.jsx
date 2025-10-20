import React, { useState } from 'react';
import { authorizedFetch } from '../utils/api.js';
import ProjectBox from './Project_box';
import './Projects.css';
import AddIcon from "@mui/icons-material/Add";
import {Grid, Skeleton} from "@mui/material";

const Projects = ({ projects, loading, onAddProject, onAddTask, onEditProject, fetchProjects, changeView }) => {
  const [deleteDialogProject, setDeleteDialogProject] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function for real-time subscription check
  const checkSubscriptionStatus = async () => {
    try {
      const response = await authorizedFetch('/api/users/subscription-status');
      const data = await response.json();
      return data.is_subscribed || false;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  };

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
      <button className="add-button" onClick={async () => {
          const isCurrentlySubscribed = await checkSubscriptionStatus();
          if (!isCurrentlySubscribed) {
              alert('Subscription required');
              return;
          }
          onAddProject();
      }}>
        New Project
          <AddIcon sx={{marginLeft:2}}/>

      </button>
      {loading ? (
          <Grid container spacing={3}> {/* spacing adds gaps between items */}
              {/* Map over an array to create 9 items */}
              {Array.from({ length: 5 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                      {/* md={4} means 4/12 columns = 3 columns on medium screens and up
                  sm={6} means 6/12 columns = 2 columns on small screens
                  xs={12} means 12/12 columns = 1 column on extra-small screens
                */}
                      <Skeleton variant="rounded" width={350} animation={"wave"} >
                          {/* The ProjectBox is placed inside to inherit its dimensions,
                        but it won't be visible due to the Skeleton overlay.
                        Its height/width should be defined by the Skeleton's size.
                    */}
                          <ProjectBox
                              project={{ id: 0, name: "Loading...", description: "Loading..." }}
                          />
                      </Skeleton>
                  </Grid>
              ))}
          </Grid>
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