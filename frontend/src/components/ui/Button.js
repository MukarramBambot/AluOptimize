import React from 'react';
import MuiButton from '@mui/material/Button';

export default function Button({ children, ...props }) {
  return (
    <MuiButton variant="contained" color="primary" {...props}>
      {children}
    </MuiButton>
  );
}
