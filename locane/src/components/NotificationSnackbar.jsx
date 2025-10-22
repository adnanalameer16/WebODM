import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

function NotificationSnackbar({ 
    error, 
    success, 
    onClose, 
    autoHideDuration = 6000,
    anchorOrigin = { vertical: "bottom", horizontal: "center" }
}) {
    const handleClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        onClose();
    };

    return (
        <>
            <Snackbar
                open={!!error}
                autoHideDuration={autoHideDuration}
                onClose={handleClose}
                anchorOrigin={anchorOrigin}
            >
                <Alert
                    onClose={handleClose}
                    severity="error"
                    variant="filled"
                    sx={{ 
                        width: "100%",
                        "& .MuiAlert-action": {
                            "& .MuiIconButton-root": {
                                color: "white",
                                backgroundColor: "transparent",
                                "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 0.1)"
                                }
                            }
                        }
                    }}
                >
                    {error}
                </Alert>
            </Snackbar>
            <Snackbar
                open={!!success}
                autoHideDuration={autoHideDuration}
                onClose={handleClose}
                anchorOrigin={anchorOrigin}
            >
                <Alert
                    onClose={handleClose}
                    severity="success"
                    variant="filled"
                    sx={{ 
                        width: "100%",
                        "& .MuiAlert-action": {
                            "& .MuiIconButton-root": {
                                color: "white",
                                backgroundColor: "transparent",
                                "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 0.1)"
                                }
                            }
                        }
                    }}
                >
                    {success}
                </Alert>
            </Snackbar>
        </>
    );
}

export default NotificationSnackbar;