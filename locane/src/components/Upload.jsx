import "./NewProject.css";
import "./upload.css";
import uploadIcon from "../assets/upload_icon.png";
import Badge from "@mui/material/Badge"
import Button from "@mui/material/Button";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SettingsIcon from '@mui/icons-material/Settings';
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
                    <Button
                        variant="contained"          /* Primary, solid color button */
                        color="secondary"

                        /* Uses the theme's primary color */
                        startIcon={<CloudUploadIcon />} /* Visually indicates a file upload */
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Keep your file input logic here
                            document.getElementById("gcp-file-input").click();
                        }}
                        sx={{
                            marginRight: 2, /* Add spacing between the two buttons */
                            textTransform: 'none',
                            background: "#0d6efd !important" /* Keep text standard for better readability */
                        }}
                    >
                        {gcpFile ? "Change GCP File" : "Upload GCP File(Optional)"}
                    </Button>

                    {/* 2. Create GCP Button (Secondary Action) */}
                    <Button
                        variant="outlined"           /* Secondary, less emphasis */
                        color="secondary"            /* Uses the secondary color or primary if preferred */
                        startIcon={<SettingsIcon />}
                        onClick={() => {
                            changeView('gcp');
                            // Assuming 'exit' is a function that performs necessary navigation/cleanup
                            if (typeof exit === 'function') {
                                exit();
                            }
                        }}

                        sx={{
                            textTransform: 'none'
                        }}
                    >
                        Create GCP
                    </Button>
                </div>
            </div>
        </>
    );
}

export default Upload;