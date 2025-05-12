// app/pages/projects/page.jsx
'use client';

import React from 'react';
import styles from './page.module.pcss';

export default function ProjectsPage() {
  // In a full implementation, this would list all projects with thumbnails and links.
  // Here we provide a simple placeholder.
  return (
    <div className={styles.projects_page}>
      <section className={styles.projects_listing}>
        <h1>All Projects</h1>
        <p>The full list of projects will be displayed here.</p>
        <p>Please check the featured projects on the home page for now.</p>
      </section>
    </div>
  );
}