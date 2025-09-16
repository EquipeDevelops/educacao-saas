'use client';

import React from 'react';
import '../styles/globals.css';
import { Typography } from '@mui/material';
import { theme } from '../themes/theme';

export default function Home() {
  return (
    <main>
      <Typography
        variant="h1"
        sx={{
          color: theme.palette.success.dark,
          backgroundColor: theme.palette.success.light,
        }}
      >
        Educação SaaS
      </Typography>
    </main>
  );
}
