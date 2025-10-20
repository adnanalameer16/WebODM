import "./NewProject.css";
import "./upload.css";
import uploadIcon from "../assets/upload_icon.png";
import Badge from "@mui/material/Badge"

function Upload({ imageFiles, setImageFiles, onDelete, changeView, exit, gcpFile, setGcpFile }) {

    const handleFileSelect = (e) => {
        const chosenFiles = Array.from(e.target.files);
        const newImageItems = chosenFiles.map(file => ({
            file: file,
            preview: URL.createObjectURL(file)
        }));
        setImageFiles(currentFiles => [...currentFiles, ...newImageItems]);
    };

    const handleGcpFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "text/plain") {
            setGcpFile(file);
        } else {
            alert("Please select a valid .txt file");
        }
    };

    return (
        <>
            <div className="upload-card">
                <div className="upload" onClick={() => document.getElementById("file-input").click()}>

                    <div className="cloud">
                        <img src={uploadIcon} alt={"upload image"} />

                    </div>
                    <div className={"Upload-text"}>
                    <h2>Drag and Drop Files to Upload</h2>
                    </div>
                    <input
                        id="file-input"
                        className="upload-btn"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: "none" }}
                    />
                </div>
                {imageFiles.length > 0 && (
                    <div className="images">
                        {imageFiles.map((item, i) => (

                            <div className="thumbnail" > <Badge badgeContent={"X"} color="error" key={i} onClick={()=>{onDelete(i)}}>
                                <img
                                    className="preview-image"
                                    src={item.preview} 
                                    loading="lazy"
                                    alt={item.file.name} 
                                /></Badge>

                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* GCP file input placed outside upload-card to avoid click conflicts */}
            <input
                id="gcp-file-input"
                type="file"
                accept=".txt,text/plain"
                onChange={handleGcpFileSelect}
                style={{ display: "none" }}
            />
            <div className="file-info-bar">
                <div className="file-count">
                    Files: {imageFiles.length}
                    {gcpFile && <span className="gcp-file-indicator"> | GCP: {gcpFile.name}</span>}
                </div>
                <div className="gcp-buttons">
                    <button className="gcp-btn add-gcp-btn" onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        document.getElementById("gcp-file-input").click(); 
                    }}>
                        {gcpFile ? "Change GCP" : "Add GCP"}
                    </button>
                    <button className="gcp-btn create-gcp-btn" onClick={() => { changeView('gcp'); exit(); }}>Create GCP</button>
                </div>
            </div>
        </>
    );
}

export default Upload;