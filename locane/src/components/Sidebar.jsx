import React, { useEffect, useState } from 'react';
import './sidebar.css'
import ProfileInfo from './ProfileInfo.jsx'
import { useNavigate } from 'react-router-dom';
import { getCookie } from "../utils/cookieUtils";
import { authorizedFetch } from '../utils/api';

// Import icons
import dashboardSelected from '../assets/dashboard_sidebar_selected.png';
import dashboardUnselected from '../assets/dashboard_sidebar_unselected.png';
import projectsSelected from '../assets/projects_sidebar_selected.png';
import projectsUnselected from '../assets/projects_sidebar_unselected.png';
import tasksSelected from '../assets/tasks_sidebar_selected.png';
import tasksUnselected from '../assets/tasks_sidebar_unselected.png';
import gcpSelected from '../assets/GCP_sidebar_selected.png';
import gcpUnselected from '../assets/GCP_sidebar_unselected.png';
import adminSelected from '../assets/admin_sidebar_selected.png';
import adminUnselected from '../assets/admin_sidebar_unselected.png';
import logoutIcon from '../assets/logout_sidebar.png';

import { Turn as Hamburger } from 'hamburger-react';
function Sidebar({ changeView, activeView, setShowLogoutDialog,isSuperuser }) {
      const [isCollapsed, setIsCollapsed] = useState(false);

    const doDashboard = () => changeView("dash");
    const doProjects = () => changeView("proj");
    const doTasks = () => changeView("tasks");
    const doGcp = () => changeView("gcp");
    const doAdmin = () => changeView("admin");

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <Hamburger toggled={isCollapsed} toggle={toggleSidebar} size={20} color="white" />
                    <span></span>
                    <span></span>
                    <span></span>

            </div>
            <div className='profile'>
                <ProfileInfo isCollapsed={isCollapsed}/>
            </div>
            <div className="sidebar-content" >
                <button className={activeView === "dash" ? "isfocused" : "notfocused"} onClick={doDashboard}>
                    <img src={activeView === "dash" ? dashboardSelected : dashboardUnselected} alt="Dashboard" />
                    {!isCollapsed && <span>Dashboard</span>}
                </button>
                <button className={activeView === "proj" ? "isfocused" : "notfocused"} onClick={doProjects}>
                    <img src={activeView === "proj" ? projectsSelected : projectsUnselected} alt="Projects" />
                    {!isCollapsed && <span>Projects</span>}
                </button>
                <button className={activeView === "tasks" ? "isfocused" : "notfocused"} onClick={doTasks}>
                    <img src={activeView === "tasks" ? tasksSelected : tasksUnselected} alt="Tasks" />
                    {!isCollapsed && <span>Tasks</span>}
                </button>
                <button className={activeView === "gcp" ? "isfocused" : "notfocused"} onClick={doGcp}>
                    <img src={activeView === "gcp" ? gcpSelected : gcpUnselected} alt="GCP" />
                    {!isCollapsed && <span>GCP</span>}
                </button>
                {isSuperuser && (
                    <button className={activeView === "admin" ? "isfocused" : "notfocused"} onClick={doAdmin}>
                        <img src={activeView === "admin" ? adminSelected : adminUnselected} alt="Administration" />
                        {!isCollapsed && <span>Administration</span>}
                    </button>
                )}
                <button onClick={() => setShowLogoutDialog(true)} className="sidebar-logout">
                    <img src={logoutIcon} alt="Logout" />
                </button>
            </div>

            <div className="sidebar-empty-space"></div>
        </div>
    );
}

export default Sidebar;