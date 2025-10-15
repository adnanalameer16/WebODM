import React, { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import "./ImageViewer.css";

// ====================================================================
// START: ACTUAL MUI ICON IMPORTS (Required for a real MUI setup)
// ====================================================================
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestoreIcon from '@mui/icons-material/Restore';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching'; // Used for the target/select icon
import NearMeDisabledIcon from '@mui/icons-material/NearMeDisabled'; // Used for cancelling selection
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Used when point is set
// ====================================================================
// END: ACTUAL MUI ICON IMPORTS
// ====================================================================


function ImageViewer({ image, index, onClose, onPointSelect, onPointDelete, hasPendingPoint }) {
  const [imagePoint, setImagePoint] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const imageRef = useRef(null);

  const handleSelectClick = () => {
    if (!imagePoint && !hasPendingPoint) {
      setIsSelecting(prev => !prev); 
    } else if (isSelecting) {
      setIsSelecting(false);
    }
  };

  const handleImageClick = (e) => {
    if (!isSelecting || !imageRef.current) return;
    const imageElement = imageRef.current;
    const rect = imageElement.getBoundingClientRect();
    const xOnImageElement = e.clientX - rect.left;
    const yOnImageElement = e.clientY - rect.top;

    if (
      xOnImageElement < 0 || xOnImageElement > rect.width ||
      yOnImageElement < 0 || yOnImageElement > rect.height
    ) {
      setIsSelecting(false);
      return;
    }

    const xRatio = xOnImageElement / rect.width;
    const yRatio = yOnImageElement / rect.height;
    const finalX = xRatio * imageElement.naturalWidth;
    const finalY = yRatio * imageElement.naturalHeight;
    const point = { x: finalX, y: finalY };

    setImagePoint(point);
    setIsSelecting(false);
    onPointSelect(point);
  };
  
  const handleDeletePoint = (e) => {
    e.stopPropagation();
    setImagePoint(null);
    setIsSelecting(false);
    onPointDelete();
  };

  return (
    <div className="image-viewer professional-viewer themed-viewer">
      <TransformWrapper
        minScale={1}
        maxScale={50}
        centerOnInit
        wheel={{ step: 0.75 }}
        doubleClick={{ disabled: true }}
        pinch={{ step: 5 }}
      >
        {({ zoomIn, zoomOut, resetTransform, state }) => {
          const currentScale = state?.scale || 1;
          const markerStyle = imagePoint && imageRef.current?.naturalWidth
            ? {
                left: `${(imagePoint.x / imageRef.current.naturalWidth) * 100}%`,
                top: `${(imagePoint.y / imageRef.current.naturalHeight) * 100}%`,
                transform: `translate(-50%, -50%) scale(${1 / currentScale})`, 
              }
            : {};
            
          // Marker class is now simplified, always applying 'image-marker' style when a point exists
          const markerClass = imagePoint ? 'image-marker' : '';
            
          const SelectIconComponent = isSelecting 
            ? NearMeDisabledIcon
            : (imagePoint 
                ? CheckCircleIcon
                : LocationSearchingIcon
              );
          
          const isSelectDisabled = !!imagePoint || hasPendingPoint;
          
          return (
            <div className="viewer-content-container">
              
              {/* === 1. Title and Close Button Bar === */}
              <div className="viewer-top-title-bar">
                <div className="viewer-title">
                  {image.name} (#{index})
                </div>
                {/* Close Button on the far right, matching the square style */}
                <button className="close-btn-header" onClick={onClose} title="Close Viewer">
                  <CloseIcon sx={{ fontSize: 28 }} />
                </button>
              </div>

              {/* === 2. Control Buttons Bar === */}
              <div className="viewer-controls-row">
                    
                {/* Select Point Button (Target Icon) */}
                <button 
                  className={`icon-button primary-icon ${isSelecting ? 'active' : ''}`} 
                  onClick={handleSelectClick} 
                  disabled={isSelectDisabled && !isSelecting}
                  title={isSelecting ? "Cancel Selection" : (imagePoint ? "Point Set" : "Select Point")}
                >
                  <SelectIconComponent sx={{ fontSize: 30 }} />
                </button>
                
                {/* Zoom In Button */}
                <button className="icon-button" onClick={() => zoomIn()} title="Zoom In">
                  <ZoomInIcon sx={{ fontSize: 30 }} />
                </button>
                
                {/* Zoom Out Button */}
                <button className="icon-button" onClick={() => zoomOut()} title="Zoom Out">
                  <ZoomOutIcon sx={{ fontSize: 30 }} />
                </button>
                
                {/* Reset Button */}
                <button className="icon-button" onClick={() => resetTransform()} title="Reset Zoom/Pan">
                  <RestoreIcon sx={{ fontSize: 30 }} />
                </button>

                {/* Delete Point Button */}
                <button 
                  className="icon-button delete-icon" 
                  onClick={handleDeletePoint} 
                  disabled={!imagePoint}
                  title="Delete Current Point"
                >
                  <DeleteIcon sx={{ fontSize: 30 }} />
                </button>
              </div>

              {/* === 3. Image Body === */}
              <div 
                className="viewer-body" 
                onClick={handleImageClick} 
                style={{ cursor: isSelecting ? 'crosshair' : (currentScale > 1 ? 'grab' : 'default') }}
              >
                <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: "100%", height: "100%" }}
                >
                  <div className="image-container-for-marker">
                      <div className="image-wrapper-for-marker">
                          <img
                            ref={imageRef}
                            src={image.url}
                            alt={image.name}
                            className="zoom-image"
                            style={{ cursor: isSelecting ? 'crosshair' : (currentScale > 1 ? 'grab' : 'default') }}
                          />
                          {/* SIMPLIFIED MARKER: Only the main marker div exists */}
                          {imagePoint && (
                              <div 
                                className={markerClass} 
                                style={markerStyle} 
                                title="Selected Point"
                              >
                              </div>
                          )}
                      </div>
                  </div>
                </TransformComponent>
              </div>
              
              {/* Footer Notices */}
              {(hasPendingPoint || imagePoint) && (
                  <div className="viewer-footer">
                      {hasPendingPoint && !imagePoint && (
                          <div className="viewer-footer-notice warning-notice">
                              A ground control point is pending selection on the map.
                          </div>
                      )}
                      {imagePoint && hasPendingPoint && (
                          <div className="viewer-footer-notice success-notice">
                              Point selected. **Select the corresponding GCP on the map** to link them.
                          </div>
                      )}
                  </div>
              )}
            </div>
          );
        }}
      </TransformWrapper>
    </div>
  );
}

export default ImageViewer;