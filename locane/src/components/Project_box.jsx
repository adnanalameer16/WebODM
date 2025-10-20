import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "./Project_box.css";
import { authorizedFetch } from '../utils/api.js';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import {CancelOutlined, CancelRounded} from "@mui/icons-material";

import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {ArrowRight} from "@mui/icons-material";
import Tasks from "./Tasks.jsx";


const ProjectBox = ({ project, onAddTask, onEditProject, onShowDeleteDialog, changeView, refreshTasks }) => {
  const [hovering,setHover]=useState(false);
    const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [editedDescription, setEditedDescription] = useState(project.description || "");
  const [hasTasks, setHasTasks] = useState(false);
  const [Progress, setProgress] = useState(null);
  const [CompletedTasks, setCompletedTasks] = useState(0);
  const [Tasks, setTasks] = useState(0);

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

  useEffect(() => {
    // Check if the project has tasks and get running task progress
    const fetchTasksAndProgress = async () => {
      try {
        const response = await authorizedFetch(`/api/projects/${project.id}/tasks/`);
        const tasks = await response.json();
        setHasTasks(tasks.length > 0);
        setTasks(tasks.length);

          const completedTasksArray = tasks.filter(task => task.status === 40);

          // Now, get the count from the new array's length
          const completedCount = completedTasksArray.length;

          setCompletedTasks( completedCount);

        if (CompletedTasks) {
          setProgress(CompletedTasks);
        } else {
            setProgress(0);
        }
      } catch (err) {
        console.error("Failed to fetch tasks: " + err.message);
      }
    };

    fetchTasksAndProgress();
  }, [project.id, refreshTasks]); // Added refreshTasks as a dependency to re-run useEffect when tasks are updated

  const handleEdit = async () => {
    const isCurrentlySubscribed = await checkSubscriptionStatus();
    if (!isCurrentlySubscribed) {
      alert('Subscription required');
      return;
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    const isCurrentlySubscribed = await checkSubscriptionStatus();
    if (!isCurrentlySubscribed) {
      alert('Subscription required');
      return;
    }
    
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
    <div className="project-box-outer" onMouseEnter={() => setHover(true)} onMouseLeave={()=>{setHover(false)}}>
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
              <div className="cancel">
              <CancelRounded onClick={handleCancel}/></div>
            <div className="save-button" >


                <SaveOutlinedIcon
                    onClick={handleSave}
                    sx={{color:"gray"}}

                />

            </div>
          
          </>
        ) : (
          <>
            <div className="project-header">
              <div className="project-title-section">
                <div className="project-title">{project.name.toUpperCase()}</div>
                  {hovering&&(<div className="edit-link" onClick={

                      handleEdit}>

                      <EditIcon sx={{color:"gray"}}/>
                  </div>)}

              </div>
              <div className="project-description">
                {project.description || "Project description lorem ipsum random words urulakkupperi dhashamoolam"}
              </div>
            </div>
          </>

        )}


         {!isEditing && (
          <><div className="progress">

             <div className="progress-bar">
             <div
             className="progress-fill"
             style={{
             width: `${Tasks>0?(CompletedTasks/Tasks)*100:0}%`,
             transition: "width 0.5s ease",
         }}
      />

    </div>
              {hovering&&(
    <div>{CompletedTasks}/{Tasks}</div>)}
</div>

                  <div className="project-actions-outer"><div className="view-tasks">
                      {hasTasks && (
                      <Button
                          size="small"
                          variant="outlined"
                          sx={{
                              color: "white",
                              backgroundColor: "black",
                              borderColor: "gray",
                              borderRadius: "40px",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                  paddingInline: 3,
                              },
                          }}
                          onClick={() => {
                              changeView("tasks", project.id);
                          }}
                      >
                          {Tasks} Tasks <ArrowRightIcon />
                      </Button>
                   )}</div>
                      <div className="project-actions">
                          <div
                              className="delete-icon"
                              onClick={() => onShowDeleteDialog(project)}
                          >
                              <DeleteIcon sx={{ color: "grey" }} />
                          </div>
                          <Fab
                              sx={{ zIndex: 10 }}
                              color="primary"
                              size="small"
                              aria-label="add"
                              onClick={async () => {
                                  const isCurrentlySubscribed = await checkSubscriptionStatus();
                                  if (!isCurrentlySubscribed) {
                                      alert('Subscription required');
                                      return;
                                  }
                                  onAddTask(project.id);
                              }}
                          >
                              <AddIcon />
                          </Fab>
                      </div>
                  </div>





          </>
      )}


      </div>



    </div>
  );
};

export default ProjectBox;