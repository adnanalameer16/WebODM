import "./NewProject.css";
import uploadIcon from "../assets/upload_icon.png";
import Badge from "@mui/material/Badge"

function Upload({ imageFiles, setImageFiles, onDelete }) {

    const handleFileSelect = (e) => {
        const chosenFiles = Array.from(e.target.files);
        const newImageItems = chosenFiles.map(file => ({
            file: file,
            preview: URL.createObjectURL(file)
        }));
        setImageFiles(currentFiles => [...currentFiles, ...newImageItems]);
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
            <div className="file-count">Files: {imageFiles.length}</div>
        </>
    );
}

export default Upload;