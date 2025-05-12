// app/pages/error/page.jsx
'use client';

import React from 'react';
import Link from 'next/link';
import styles from './page.module.pcss';

export default function ErrorPage() {
  return (
    <div className={styles.error_page}>
      <h1>404 – Page Not Found</h1>
      <p>Oops! The page you are looking for does not exist.</p>
      <Link href="/">Return to Home</Link>
    </div>
  );
}