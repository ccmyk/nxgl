// src/app/layout.tsx
import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout(props: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body>
        <AppProviders>{props.children}</AppProviders>
        </body>
        </html>
    );
}