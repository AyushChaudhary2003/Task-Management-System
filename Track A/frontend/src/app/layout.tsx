import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Task Management System',
  description: 'Manage your personal tasks efficiently with our modern, simple, and elegant task management application.',
  keywords: 'tasks, management, productivity, todolist, checklist, organize',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
