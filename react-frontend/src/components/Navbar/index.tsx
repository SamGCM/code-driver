import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import { FunctionComponent } from "react";
import DriveEtaIcon from '@mui/icons-material/DriveEta';

export const Navbar: FunctionComponent = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu">
          <DriveEtaIcon />
        </IconButton>
        <Typography variant="h6">Code Delivery</Typography>
      </Toolbar>
    </AppBar>
  );
};
