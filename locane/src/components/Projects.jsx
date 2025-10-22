import React, { useState } from 'react';
import { authorizedFetch } from '../utils/api.js';
import ProjectBox from './Project_box';
import './Projects.css';
import AddIcon from "@mui/icons-material/Add";
import SortIcon from "@mui/icons-material/Sort";
import {Grid, Skeleton, FormControl, Select, MenuItem, InputLabel, Box} from "@mui/material";

// Import reusable notification components
import NotificationSnackbar from "./NotificationSnackbar";
import { useNotification } from "../hooks/useNotification";

const Projects = ({ projects, loading, onAddProject, onAddTask, onEditProject, fetchProjects, changeView, onShowDeleteDialog, sortBy, onSortChange }) => {
  const { error, success, showError, clearNotifications } = useNotification();

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





  return (
    <div className="projects-container">
      <div className="projects-header">
        <button className="add-btn" onClick={async () => {
            const isCurrentlySubscribed = await checkSubscriptionStatus();
            if (!isCurrentlySubscribed) {
                showError('Subscription required');
                return;
            }
            onAddProject();
        }}>
          <h1>New Project</h1>
            <AddIcon sx={{marginLeft:2}}/>
        </button>
        
        <Box className="sort-controls">
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <Select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              displayEmpty
              sx={{
                backgroundColor: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'gray',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgb(52, 183, 255)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgb(52, 183, 255)',
                }
              }}
            >
              <MenuItem value="date-desc">Date Created (Newest First)</MenuItem>
              <MenuItem value="date-asc">Date Created (Oldest First)</MenuItem>
              <MenuItem value="name-asc">Name (A to Z)</MenuItem>
              <MenuItem value="name-desc">Name (Z to A)</MenuItem>
              <MenuItem value="tasks-desc">Tasks (Most to Least)</MenuItem>
              <MenuItem value="tasks-asc">Tasks (Least to Most)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </div>
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
              onShowDeleteDialog={onShowDeleteDialog}
              changeView={changeView}
            />
          ))}
        </div>
      )}


      {/* Notification Snackbar */}
      <NotificationSnackbar 
        error={error}
        success={success}
        onClose={clearNotifications}
      />
    </div>
  );
};

export default Projects;