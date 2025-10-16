import "./NewProject.css"

import { useState} from "react";
import "./Projects.css"
import "./NewProject.css";
import { authorizedFetch } from "../utils/api.js";
import {getFormattedDate} from "../utils/date.js";

function CreateNewProject(props) {

    return (<div className={"project-container"}>
        <h1 className={"title"}>Create New Project</h1>
        <div className="card-header">
            <label htmlFor={"title"}>Name</label>
            <input type="text" name="name" className="projectName" placeholder={props.name } onChange={props.onChange2}/>
        </div>
        <div className="description">
            <label>Description</label>
            <textarea rows={5} cols={20} name="description" placeholder={props.desc} onChange={props.onChange1}></textarea>

        </div>
        <div>


        <button className="cancel-button" onClick={props.close}>Cancel</button><input className="submit-button"   type="submit" value="Save" onClick={props.onClick}/></div>

    </div>);
}

function NewProject({onAddProject,exit})
{


    const [project, setProject] = useState("New Project_"+Math.trunc(Math.random()*1000));
    //const [tags, setTags] = useState(null);
    const [description, setDescription] = useState(getFormattedDate());

    const createProject= ()=>{
        const newProject=
            {
            name:project,
            description:description,

            }

        console.log(JSON.stringify(newProject));
        const requestOptions=
            {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body:JSON.stringify(newProject)
        }
        console.log(JSON.stringify(newProject));

        authorizedFetch("/api/projects/", requestOptions)
            .then(res=>res.json())
            .then(res=>console.log(res))


        console.log(JSON.stringify(newProject));


        setTimeout(onAddProject, 100);
        exit();




    }







    return(


            <CreateNewProject onChange2={(e) => setProject(e.target.value)}
                                              onChange1={(e) => setDescription(e.target.value)} onClick={createProject} close={exit} name={project} desc={description}/>






    );


}
export default NewProject