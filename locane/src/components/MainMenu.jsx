import Sidebar from './Sidebar.jsx';
import "./mainmenu.css"
import CreateNewTask from "./CreateTask.jsx";
import React, {useCallback, useEffect, useState} from "react";
import Projects from "./Projects";
import Tasks from "./Tasks";
import GcpInterface from './GcpInterface.jsx';
import NewProject from './NewProject.jsx';
import Export from './Export.jsx'
import { authorizedFetch } from '../utils/api.js';
import Admin from './Admin.jsx';
import CloseButton from 'react-bootstrap/CloseButton';
import { getCookie } from '../utils/cookieUtils';

// Import reusable notification components
import NotificationSnackbar from "./NotificationSnackbar";
import { useNotification } from "../hooks/useNotification";
// logoutSession removed; using authorizedFetch directly

export default function MainMenu({ setIsLogged, username, isSuperuser, setIsSuperuser }) {
    const [activeView, setActiveView] = useState("proj");
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [runningTasks, setRunningTasks] = useState([]);
    const [exportTask, setExportTask] = useState(null);
    const [activeDialog, setActiveDialog] = useState("none");
    const [isViewing, setViewing] = useState(false);

    const [userInfo, setUserInfo] = useState(null);

    const [selectedTask, setSelectedTask] = useState(null);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [filterProjectId, setFilterProjectId] = useState(null);
    const [deleteProject, setDeleteProject] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { error, success, showError, clearNotifications } = useNotification();

    const API_BASE = "/api";
    const API_PROJECTS = `${API_BASE}/projects`;

    const fetchJSON = useCallback(async (url, opts = {}) => {
        const res = await authorizedFetch(url, { ...opts });
        return res.json();
    }, []);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchJSON(`${API_PROJECTS}/`);
            const list = Array.isArray(data?.results) ? data.results : data;
            setProjects(list || []);
        } catch (err) {
            console.error("Fetch projects failed:", err);
        } finally {
            setLoading(false);
        }
    }, [fetchJSON]);

    const loadRunningTasksStructure = useCallback(async () => {
        setLoading(true);
        try {
            const projResp = await fetchJSON(`${API_PROJECTS}/`);
            const projList = Array.isArray(projResp?.results) ? projResp.results : projResp;
            const projMap = new Map((projList || []).map((p) => [p.id, p.name]));

            const perProjectTaskRefs = await Promise.all(
                (projList || []).map(async (p) => {
                    try {
                        const list = await fetchJSON(`${API_PROJECTS}/${p.id}/tasks/`);
                        const tasksArr = Array.isArray(list?.results) ? list.results : list;

                        // Fetch the full detail for each task instantly
                        const detailedTasksPromises = (tasksArr || []).map(async (t) => {
                            try {
                                const taskDetail = await fetchJSON(`${API_PROJECTS}/${p.id}/tasks/${t.id}/`);
                                return {
                                    projectId: p.id,
                                    taskId: t.id,
                                    projectName: projMap.get(p.id) || `Project ${p.id}`,
                                    taskName: t.name,
                                    status: taskDetail.status,
                                    running_progress: taskDetail.running_progress || 0,
                                    processing_time: taskDetail.processing_time || null, // CONSOLIDATED: Fetch processing_time here
                                };
                            } catch (e) {
                                // Handles errors for individual task detail fetch
                                console.warn("Fetch detailed task failed for task", t.id, e);
                                return null;
                            }
                        });

                        // Filter out failed detailed fetches
                        return (await Promise.all(detailedTasksPromises)).filter(t => t !== null);

                    } catch (e) {
                        // Handles errors for listing tasks in a project
                        console.warn("List tasks failed for project", p.id, e);
                        return [];
                    }
                })
            );

            const flatRefs = perProjectTaskRefs.flat();

            const shaped = flatRefs.map((task) => ({
                id: task.taskId,
                projectId: task.projectId,
                projectName: task.projectName,
                taskName: task.taskName,
                // Calculate progress and include all detail fields
                progressPct: Math.round((task.running_progress || 0) * 100),
                status: task.status,
                running_progress: task.running_progress || 0,
                processing_time: task.processing_time, // CONSOLIDATED: Include processing_time
            }));

            setRunningTasks(shaped);
            return shaped;
        } catch (e) {
            console.error("loadRunningTasksStructure failed:", e);
            setRunningTasks([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, [fetchJSON]);

    const updateRunningTasksProgress = useCallback(async () => {
        try {
            // Create an array to hold the results of all fetch promises
            const fetchPromises = runningTasks.map(async (task) => {
                try {
                    // Use authorizedFetch to get the raw response
                    const res = await authorizedFetch(`${API_PROJECTS}/${task.projectId}/tasks/${task.id}/`);
    
                    // Check for a 404 status code directly
                    if (res.status === 404) {
                        console.warn(`Task ${task.id} not found (404), removing from list.`);
                        return null;
                    }
    
                    // If the status is not 404, parse the JSON
                    const taskDetail = await res.json();
                    
                    const taskStatus = taskDetail.status === null ? 20 : taskDetail.status;
                    const progressPct = Math.round((taskDetail.running_progress || 0) * 100);
    
                    // Return the updated task object
                    return {
                        ...task,
                        progressPct,
                        status: taskStatus,
                        running_progress: taskDetail.running_progress || 0,
                        processing_time: taskDetail.processing_time || null // IMPORTANT: Ensure processing_time is updated here too
                    };
                } catch (e) {
                    console.warn(`Progress update failed for task ${task.id}:`, e);
                    return {
                        ...task,
                        progressPct: 100,
                        status: 30
                    };
                }
            });
    
            const results = await Promise.all(fetchPromises);
            
            // Filter out any tasks that returned null (i.e., those that were deleted)
            const updatedTasks = results.filter(task => task !== null);
            
            // Compare the new list to the old list to avoid unnecessary re-renders
            if (JSON.stringify(updatedTasks) !== JSON.stringify(runningTasks)) {
                setRunningTasks(updatedTasks);
            }
        } catch (e) {
            console.error("updateRunningTasksProgress failed:", e);
        }
    }, [runningTasks, fetchJSON]);

    const handleTaskAction = useCallback(async (task, actionType) => {
        try {
            switch (actionType) {
                case 'cancel':
                    await fetchJSON(`${API_PROJECTS}/${task.projectId}/tasks/${task.id}/cancel/`, {
                        method: 'POST'
                    });
                    break;
                case 'delete':
                    await fetchJSON(`${API_PROJECTS}/${task.projectId}/tasks/${task.id}/remove/`, {
                        method: 'POST'
                    });
                    break;
                case 'view':

                    setSelectedTask(task);

                    setViewing(true);



                    break;
                case 'export':
                    console.log('Export task:', task);
                    setExportTask({ projectId: task.projectId, taskId: task.id });
                    setActiveDialog('export');
                    break;
                case 'restart':
                    await fetchJSON(`${API_PROJECTS}/${task.projectId}/tasks/${task.id}/restart/`, {
                        method: 'POST'
                    });
                    break;
                default:
                    console.warn('Unknown action type:', actionType);
            }
            // Refresh tasks after action
            loadRunningTasksStructure();
        } catch (error) {
            console.error('Task action failed:', error);
        }
    }, [fetchJSON, loadRunningTasksStructure]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects, activeView]);

    useEffect(() => {
        if (activeView === "tasks") {
            loadRunningTasksStructure();
        }
    }, [activeView, loadRunningTasksStructure]);

    useEffect(() => {
        let interval;
        if (activeView === "tasks" && runningTasks.length > 0) {
            interval = setInterval(updateRunningTasksProgress, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeView, runningTasks, updateRunningTasksProgress]);

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

    const onAddProject = async () => {
        const isCurrentlySubscribed = await checkSubscriptionStatus();
        if (!isCurrentlySubscribed) {
            showError('Subscription required');
            return;
        }
        setActiveDialog("create-project");
    };
    const onAddTask = async (projectId) => {
        const isCurrentlySubscribed = await checkSubscriptionStatus();
        if (!isCurrentlySubscribed) {
            showError('Subscription required');
            return;
        }
        setActiveProjectId(projectId);
        setActiveDialog("edit-task");
    };
    const DialogueManager = () => {
        useEffect(() => {
            const addCloseButtons = () => {
                const dialogues = document.querySelectorAll('.dialog');

                dialogues.forEach(dialogue => {
                    // Check if close button already exists
                    if (!dialogue.classList.contains('no-close')) {
                        const closeButton = document.createElement('button');
                        closeButton.className = 'dialog-close';

                        closeButton.innerHTML =   '<svg width="20" height="20" viewBox="0 0 24 24" ><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>'


                        closeButton.addEventListener('click', () => {
                           setActiveDialog("none")
                        });

                        // Make dialogue position relative

                        dialogue.appendChild(closeButton);
                    }
                });
            };

            addCloseButtons();
        }, []);

        return null; // This component doesn't render anything
    };

    const handleViewChange = (view, projectId = null) => {
        setActiveView(view);
        setFilterProjectId(projectId);
    };

    const refreshTasks = async () => {
        await loadRunningTasksStructure();
        await fetchProjects();
    };

    const handleProfileClick = async () => {
        try {
            const username = sessionStorage.getItem("username");
            
            const subscriptionResponse = await authorizedFetch('/api/users/subscription-status');
            const subscriptionData = await subscriptionResponse.json();
            
            setUserInfo({
                name: username || 'User',
                subscriptionStatus: subscriptionData.is_subscribed ? 'Active' : 'Inactive',
                subscriptionStartDate: subscriptionData.subscription_start_date,
                subscriptionEndDate: subscriptionData.subscription_end_date
            });
            setActiveDialog('user');
        } catch (error) {
            console.error('Error fetching subscription status:', error);
            const username = sessionStorage.getItem("username");
            setUserInfo({
                name: username || 'User',
                subscriptionStatus: 'Unknown',
                subscriptionStartDate: null,
                subscriptionEndDate: null
            });
            setActiveDialog('user');
        }
    };

    const handleDeleteProject = async (project) => {
        setIsDeleting(true);
        try {
            await fetchJSON(`/api/projects/${project.id}/`, {
                method: "DELETE",
            });
            setDeleteProject(null);
            setActiveDialog("none");
            await fetchProjects();
        } catch (err) {
            showError("Failed to delete project: " + err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const onShowDeleteDialog = (project) => {
        setDeleteProject(project);
        setActiveDialog("delete-project");
    };



    return (
        <div className="main-menu">
            <DialogueManager />
            <div className="sidebar-menu">
                <Sidebar
                    changeView={handleViewChange}
                    setIsLogged={setIsLogged}
                    activeView={activeView}
                    setActiveDialog={setActiveDialog}
                    isSuperuser={isSuperuser} // Use prop passed from App.jsx
                    onProfileClick={handleProfileClick}
                />
            </div>
            <div className="main-view">
                {activeView === "gcp" && <GcpInterface />}
                {activeView === "proj" && (
                    <Projects
                        projects={projects}
                        loading={loading}
                        onAddProject={onAddProject}
                        onAddTask={onAddTask}
                        onEditProject={(id, updatedProject) => {
                            setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updatedProject } : p));
                        }}
                        fetchProjects={fetchProjects}
                        changeView={handleViewChange}
                        refreshTasks={refreshTasks} // Pass refreshTasks to Projects
                        onShowDeleteDialog={onShowDeleteDialog}
                    />
                )}
                {activeView === "tasks" && (
                    <Tasks
                        runningTasks={filterProjectId ? runningTasks.filter(task => task.projectId === filterProjectId) : runningTasks}
                        loading={loading}
                        onRefresh={loadRunningTasksStructure}
                        onTaskAction={handleTaskAction}
                        isViewing={isViewing}
                        exitView={() => { setViewing(false); }}
                        selectedTask={selectedTask}
                        filterProjectId={filterProjectId}
                        setFilterProjectId={setFilterProjectId}
                        projects={projects}
                    />
                )}
                {activeView === "admin" && (
                    <Admin
                        changeView={handleViewChange}
                        isSuperuser={isSuperuser} // Use prop passed from App.jsx
                    />
                )}
            </div>
            {
                activeDialog === "edit-task" && (
                    <div className="modal-overlay">
                        <div className="dialog">
                            <CreateNewTask
                                exit={() => { setActiveDialog("none"); setActiveProjectId(null); }}
                                redirect={setActiveView}
                                projectId={activeProjectId}
                                onTaskCreated={refreshTasks} // Pass refreshTasks to CreateNewTask
                            />
                        </div>
                    </div>
                )
            }
            {
                activeDialog === "create-project" && (
                    <div className="modal-overlay"  >
                            <div className="dialog no-close">
                            <NewProject
                                onAddProject={async () => {
                                    await fetchProjects();
                                }}
                                exit={() => { setActiveDialog("none") }}
                            />
                        </div>
                    </div>
                )
            }
            {activeDialog === "export" && (
                <div className="modal-overlay">
                    <div className="dialog">
                        <Export
                            projectId={exportTask?.projectId}
                            taskId={exportTask?.taskId}
                            onClose={() => setActiveDialog("none")} // Pass onClose prop
                        />
                    </div>
                </div>
            )}
            {activeDialog === "logout" && (
                <div className="modal-overlay">
                    <div className="dialog no-close">
                        <p>Are you sure you want to logout?</p>
                        <div className="logout-dialog-actions">
                            <button onClick={async () => {
                                try {
                                    const res = await authorizedFetch('/logout/', {
                                        method: 'POST',
                                        headers: { 'Accept': 'application/json' },
                                    });
                                    let data = null;
                                    try { data = await res.json(); } catch (_) {}
                                    if (!data?.ok) {
                                        console.error('Logout response invalid', data);
                                    }
                                } catch (error) {
                                    console.error('Logout failed', error);
                                } finally {
                                    sessionStorage.removeItem('username');
                                    setIsLogged(false);
                                }
                            }} className="logout-dialog-btn">Yes</button>
                            <button onClick={() => setActiveDialog("none")} className="logout-dialog-btn no">No</button>
                        </div>
                    </div>
                </div>
            )}
            {activeDialog === "delete-project" && deleteProject && (
                <div className="modal-overlay">
                    <div className="dialog no-close">
                        <p>Are you sure you want to delete this project?</p>
                        <div className="delete-dialog-actions">
                            <button onClick={() => handleDeleteProject(deleteProject)} className="delete-dialog-btn" disabled={isDeleting}>Yes</button>
                            <button onClick={() => setActiveDialog("none")} className="delete-dialog-btn no" disabled={isDeleting}>No</button>
                        </div>
                    </div>
                </div>
            )}
            {activeDialog==='user' && userInfo && (
                <div className="modal-overlay">
                    <div className="dialog">
                        <div className="user-info">
                        <h2>User Information</h2>
                        <p><strong>Name:</strong> {userInfo.name}</p>
                        <p><strong>Subscription Status:</strong> {userInfo.subscriptionStatus}</p>
                        {userInfo.subscriptionStatus === 'Active' && (
                            <>
                                <p><strong>Subscription Start:</strong> {
                                    userInfo.subscriptionStartDate
                                        ? new Date(userInfo.subscriptionStartDate).toLocaleString()
                                        : 'Unlimited (Admin)'
                                }</p>
                                <p><strong>Subscription End:</strong> {
                                    userInfo.subscriptionEndDate
                                        ? new Date(userInfo.subscriptionEndDate).toLocaleString()
                                        : 'Unlimited (Admin)'
                                }</p>
                            </>
                        )}
                        </div>
                    </div>
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
}