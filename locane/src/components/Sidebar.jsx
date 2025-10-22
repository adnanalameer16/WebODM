import React, { useEffect, useState } from 'react';
import './sidebar.css'
import ProfileInfo from './ProfileInfo.jsx'
import { useNavigate } from 'react-router-dom';
import { getCookie } from "../utils/cookieUtils";
import { authorizedFetch } from '../utils/api';
import HomeRounded from '@mui/icons-material/HomeRounded';

import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import GpsNotFixedRoundedIcon from '@mui/icons-material/GpsNotFixedRounded';
// Import icons

import logoutIcon from '../assets/logout_sidebar.png';
import dpIcon from '../assets/dp.jpg';

import { Turn as Hamburger } from 'hamburger-react';
import {AdminPanelSettingsRounded, FolderRounded, GpsNotFixedRounded} from "@mui/icons-material";
import {Divider} from "@mui/material";
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
function Sidebar({ changeView, activeView, setShowLogoutDialog,isSuperuser, onProfileClick }) {
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
                {!isCollapsed && (
                    <button className="dp-icon-btn" onClick={onProfileClick}>
                        <AccountCircleRoundedIcon sx={{color:"white",scale:1.5}} />

                    </button>
                )}
            </div>
            <div className='profile'>
                <ProfileInfo isCollapsed={isCollapsed}/>
            </div>
            <Divider />
            <div className="sidebar-content" >
                <button className={activeView === "dash" ? "isfocused" : "notfocused"} onClick={doDashboard}>
                    <HomeRounded />
                    {!isCollapsed && <span>Dashboard</span>}
                </button>
                <button className={activeView === "proj" ? "isfocused" : "notfocused"} onClick={doProjects}>
                    <FolderRounded/>
                    {!isCollapsed && <span>Projects</span>}
                </button>
                <button className={activeView === "tasks" ? "isfocused" : "notfocused"} onClick={doTasks}>
                    <FormatListBulletedRoundedIcon />
                    {!isCollapsed && <span>Tasks</span>}
                </button>
                <button className={activeView === "gcp" ? "isfocused" : "notfocused"} onClick={doGcp}>
                    <GpsNotFixedRoundedIcon />
                    {!isCollapsed && <span>GCP</span>}
                </button>
                {isSuperuser && (
                    <button className={activeView === "admin" ? "isfocused" : "notfocused"} onClick={doAdmin}>
                        <AdminPanelSettingsRounded/>
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