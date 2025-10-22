import React, { useState, useEffect, useCallback } from 'react';
import './Tasks.css';
import ProjectViewer from "./ProjectContainer.jsx";
import Export from './Export.jsx';
import { authorizedFetch } from '../utils/api.js';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import {Chip, Grid, IconButton, Skeleton} from "@mui/material";
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseIcon from "@mui/icons-material/Close";

// Helper function from the first code block for processing time format
const formatProcessingTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// New TaskBox component
const TaskBox = ({ task, onAction, onShowDeleteDialog, fetchJSON, isDeleteDialogOpen = false, openExportTaskId, setOpenExportTaskId }) => {
  const [lastError, setLastError] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  
  // NOTE: task.processing_time is used directly

  const fetchLastError = useCallback(async () => {
    if (task.status === 30) {
      try {
        // Use authorizedFetch directly since fetchJSON is passed down as authorizedFetch
        const response = await fetchJSON(`/api/projects/${task.projectId}/tasks/${task.id}/`);
        setLastError(response.last_error || "No error details available");
      } catch (err) {
        console.error("Failed to fetch last error:", err);
      }
    }
  }, [task, fetchJSON]);

  const fetchThumbnail = useCallback(() => {
    if (task.status === 40 && !thumbnailUrl) {
      const url = `/api/projects/${task.projectId}/tasks/${task.id}/thumbnail?size=164`;
      setThumbnailUrl(url);
    }
  }, [task, thumbnailUrl]);

  useEffect(() => {
    fetchLastError();
    // Removed redundant logic for setting processing time here
  }, [fetchLastError, task]);

  const getStatusText = (statusCode) => {
    switch (statusCode) {
      case 10: return 'QUEUED';
      case 20: return 'RUNNING';
      case 30: return 'FAILED';
      case 40: return 'COMPLETED';
      case 50: return 'CANCELED';
      default: return 'RUNNING';
    }
  };

  const getStatusClass = (statusCode) => {
    switch (statusCode) {
      case 10: return 'status-queued';
      case 20: return 'status-running';
      case 30: return 'status-failed';
      case 40: return 'status-completed';
      case 50: return 'status-canceled';
      default: return 'status-running';
    }
  };

  const handleAction = (actionType) => {
    onAction(task, actionType);
  };

  const effectiveStatus = task.status === null ? 20 : task.status;

  return (
    <div 
      className={`task-box ${getStatusClass(effectiveStatus)}`}
      onMouseEnter={() => {
        setIsHovering(true);
        fetchThumbnail();
      }}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="main-content-area">
        <div className="task-header">
          <div className="task-info">
            <h3 className="task-name">{task.taskName}</h3>
            <p className="task-project-name">{task.projectName}</p>
          </div>
          <div className="task-status-info">
            <div className={`status-indicator ${getStatusClass(effectiveStatus)}`}></div>
            <span className={`status-badge ${getStatusClass(effectiveStatus)}`}>
              {getStatusText(effectiveStatus)}
            </span>
          </div>
        </div>
        <div className="task-id-row">
          <span className="task-id">ID: {task.id}</span>
        </div>
        <div className="task-content">
          {effectiveStatus === 30 && lastError && (
            <p className="task-error"><strong>Error:</strong> {lastError}</p>
          )}
          {effectiveStatus === 20 && (
            <div className="task-progress">
              <div className="progress-info">
                <span>
                  {task.running_progress === 0 ? 'Uploading and Resizing...' : `Progress: ${task.progressPct}%`}
                </span>
              </div>
              {task.running_progress > 0 && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${task.progressPct}%`,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              )}
            </div>
          )}
          {/* Processing Time Display: Now uses task.processing_time directly */}
          {effectiveStatus === 40 && task.processing_time && (
            <div className="task-processing-time">
              <span className="processing-time-text">{formatProcessingTime(task.processing_time)}</span>
            </div>
          )}
        </div>
        <div className="task-actions">
          {effectiveStatus === 20 && (
            <>
              <button className="btn-cancel" onClick={() => onShowDeleteDialog({ ...task, actionType: 'cancel' })}>Cancel</button>
              <button className="btn-delete" onClick={() => onShowDeleteDialog({ ...task, actionType: 'delete' })}>Delete</button>
            </>
          )}
          {effectiveStatus === 40 && (
            <>
              <Export 
                projectId={task.projectId} 
                taskId={task.id} 
                openExportTaskId={openExportTaskId} 
                setOpenExportTaskId={setOpenExportTaskId}
              />
              <button className="btn-delete" onClick={() => onShowDeleteDialog({ ...task, actionType: 'delete' })}>Delete</button>
            </>
          )}
          {effectiveStatus === 30 && (
            <>
              <button className="btn-restart" onClick={() => handleAction('restart')}>Restart</button>
              <button className="btn-delete" onClick={() => onShowDeleteDialog({ ...task, actionType: 'delete' })}>Delete</button>
            </>
          )}
          {effectiveStatus === 50 && (
            <>
              <button className="btn-restart" onClick={() => handleAction('restart')}>Restart</button>
              <button className="btn-delete" onClick={() => onShowDeleteDialog({ ...task, actionType: 'delete' })}>Delete</button>
            </>
          )}
          {effectiveStatus === 10 && (
            <>
              <button className="btn-cancel" onClick={() => onShowDeleteDialog({ ...task, actionType: 'cancel' })}>Cancel</button>
              <button className="btn-delete" onClick={() => onShowDeleteDialog({ ...task, actionType: 'delete' })}>Delete</button>
            </>
          )}
        </div>
      </div>
      {/* Thumbnail container exactly as in the second code block (no click handler) */}
      {isHovering && effectiveStatus === 40 && thumbnailUrl && (
          <Tooltip title="View"slots={{
            transition: Zoom,
          }}>
        <div className="task-thumbnail-wrapper">
          <img src={thumbnailUrl} alt={`Thumbnail for task ${task.id}`} className="task-thumbnail"  onClick={()=>{handleAction("view")}}/>
      
      </div></Tooltip>
      )}
    </div>
  );
};

// Main Tasks component
const Tasks = ({ runningTasks, loading, onRefresh, onTaskAction ,isViewing,exitView,selectedTask, filterProjectId, setFilterProjectId, projects }) => {
  const [deleteDialogTask, setDeleteDialogTask] = useState(null);
  const [filterProjectName, setFilterProjectName] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [openExportTaskId, setOpenExportTaskId] = useState(null);

  useEffect(() => {
    if (filterProjectId) {
      const project = projects.find(proj => proj.id === filterProjectId);
      setFilterProjectName(project ? project.name : null);
    } else {
      setFilterProjectName(null);
    }
  }, [filterProjectId, projects]);

  const handleDialogAction = (task, actionType) => {
    onTaskAction(task, actionType);
    setDeleteDialogTask(null);
    setIsDeleteDialogOpen(false);
  };

  const showDeleteDialog = (task) => {
    setDeleteDialogTask(task);
    setIsDeleteDialogOpen(true);
  };

  const onClearFilter = () => {
    setFilterProjectId(null);
    setFilterProjectName(null);
    onRefresh(); 
  };

  const categorizeTasks = (tasks) => {
    const categories = {
        running: [],
        completed: [],
        failed: [],
        canceled: [],
        queued: []
    };

    tasks.forEach(task => {
        const effectiveStatus = task.status === null ? 20 : task.status;
        
        switch (effectiveStatus) {
            case 20: categories.running.push({...task, status: effectiveStatus}); break;
            case 40: categories.completed.push({...task, status: effectiveStatus}); break;
            case 30: categories.failed.push({...task, status: effectiveStatus}); break;
            case 50: categories.canceled.push({...task, status: effectiveStatus}); break;
            case 10: categories.queued.push({...task, status: effectiveStatus}); break;
            default: categories.running.push({...task, status: 20}); break;
        }
    });
    return categories;
  };

  const categorizedTasks = categorizeTasks(runningTasks);
  const memoizedAuthorizedFetch = useCallback(authorizedFetch, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.export-container')) {
        setOpenExportTaskId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if(!isViewing) {
    return (
      <div className="tasks-container">
        <div className="view-header">
          <h1>Tasks</h1>

          <IconButton aria-label={"refresh"} onClick={onRefresh}><RefreshRoundedIcon/></IconButton>

        </div>
          {filterProjectName && (
              <Chip
                  label={`${filterProjectName}`}
                  onDelete={onClearFilter}
                  deleteIcon={<CloseIcon />}
                  variant="outlined" // Optional: gives it a clear border
                  color="primary" // Optional: gives it a primary color theme
              />
          )}
        
        {loading ? (<>
         <Skeleton variant={"rounded"}  ><h1>Completed Tasks</h1></Skeleton>
            <Grid container spacing={3}> {/* spacing adds gaps between items */}
                {/* Map over an array to create 9 items */}
                {Array.from({ length: 4 }).map((_, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        {/* md={4} means 4/12 columns = 3 columns on medium screens and up
                  sm={6} means 6/12 columns = 2 columns on small screens
                  xs={12} means 12/12 columns = 1 column on extra-small screens
                */}
                        <Skeleton variant="rounded" width={500} height={250}/>



                    </Grid>
                ))}
            </Grid>
            </>

        ) : runningTasks.length === 0 ? (
          <p className="no-tasks">No tasks found.</p>
        ) : (
          <>
            {categorizedTasks.running.length > 0 && (
              <div className="task-category">
                <h3>Running Tasks ({categorizedTasks.running.length})</h3>
                <div className="tasks-grid">
                  {categorizedTasks.running.map((task) => (
                    <TaskBox 
                      key={task.id} 
                      task={task} 
                      onAction={onTaskAction}
                      onShowDeleteDialog={showDeleteDialog}
                      fetchJSON={memoizedAuthorizedFetch}
                      isDeleteDialogOpen={isDeleteDialogOpen}
                      openExportTaskId={openExportTaskId}
                      setOpenExportTaskId={setOpenExportTaskId}
                    />
                  ))}
                </div>
              </div>
            )}
            {categorizedTasks.completed.length > 0 && (
              <div className="task-category">
                <h3>Completed Tasks ({categorizedTasks.completed.length})</h3>
                <div className="tasks-grid">
                  {categorizedTasks.completed.map((task) => (
                    <TaskBox 
                      key={task.id} 
                      task={task} 
                      onAction={onTaskAction}
                      onShowDeleteDialog={showDeleteDialog}
                      fetchJSON={memoizedAuthorizedFetch}
                      isDeleteDialogOpen={isDeleteDialogOpen}
                      openExportTaskId={openExportTaskId}
                      setOpenExportTaskId={setOpenExportTaskId}
                    />
                  ))}
                </div>
              </div>
            )}
            {categorizedTasks.failed.length > 0 && (
              <div className="task-category">
                <h3>Failed Tasks ({categorizedTasks.failed.length})</h3>
                <div className="tasks-grid">
                  {categorizedTasks.failed.map((task) => (
                    <TaskBox 
                      key={task.id} 
                      task={task} 
                      onAction={onTaskAction}
                      onShowDeleteDialog={showDeleteDialog}
                      fetchJSON={memoizedAuthorizedFetch}
                      isDeleteDialogOpen={isDeleteDialogOpen}
                      openExportTaskId={openExportTaskId}
                      setOpenExportTaskId={setOpenExportTaskId}
                    />
                  ))}
                </div>
              </div>
            )}
            {categorizedTasks.canceled.length > 0 && (
              <div className="task-category">
                <h3>Canceled Tasks ({categorizedTasks.canceled.length})</h3>
                <div className="tasks-grid">
                  {categorizedTasks.canceled.map((task) => (
                    <TaskBox 
                      key={task.id} 
                      task={task} 
                      onAction={onTaskAction}
                      onShowDeleteDialog={showDeleteDialog}
                      fetchJSON={memoizedAuthorizedFetch}
                      isDeleteDialogOpen={isDeleteDialogOpen}
                      openExportTaskId={openExportTaskId}
                      setOpenExportTaskId={setOpenExportTaskId}
                    />
                  ))}
                </div>
              </div>
            )}
            {categorizedTasks.queued.length > 0 && (
              <div className="task-category">
                <h3>Queued Tasks ({categorizedTasks.queued.length})</h3>
                <div className="tasks-grid">
                  {categorizedTasks.queued.map((task) => (
                    <TaskBox 
                      key={task.id} 
                      task={task} 
                      onAction={onTaskAction}
                      onShowDeleteDialog={showDeleteDialog}
                      fetchJSON={memoizedAuthorizedFetch}
                      openExportTaskId={openExportTaskId}
                      setOpenExportTaskId={setOpenExportTaskId}
                    />
                  )) }
                </div>
              </div>
            )}
          </>
        )}
        {deleteDialogTask && (
          <div className="modal-overlay">
            <div className="dialog">
                <div className="delete-container" >
              <p>Are you sure you want to {deleteDialogTask.actionType === 'cancel' ? 'cancel' : 'delete'} this task?</p>
              <div className="delete-dialog-actions">
                <button onClick={() => { handleDialogAction(deleteDialogTask, deleteDialogTask.actionType); }} className="delete-dialog-btn">Yes</button>
                <button onClick={() => {
                  setDeleteDialogTask(null);
                  setIsDeleteDialogOpen(false);
                }} className="delete-dialog-btn no">No</button></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    return (<ProjectViewer project_details={selectedTask} exit={exitView}/>);
  }
};

export default Tasks;