// app/pages/project/[slug]/page.jsx
'use client';

import React from 'react';
import styles from './page.module.pcss';
import { notFound } from 'next/navigation';

export default function ProjectPage({ params }) {
  const { slug } = params;
  // If no slug data is available, return 404
  if (!slug) return notFound();

  return (
    <div className={styles.project_page}>
      <section className={styles.project_detail}>
        <h1>{slug.replace(/-/g, ' ').toUpperCase()}</h1>
        <p>Project case study content coming soon.</p>
        <p>This is a placeholder for project &quot;{slug}&quot;.</p>
      </section>
    </div>
  );
}