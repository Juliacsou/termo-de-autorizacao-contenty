import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const repo = process.env.GITHUB_REPOSITORY?.split('/').pop();
const base = process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS === 'true' && repo ? `/${repo}/` : '/');
export default defineConfig({ plugins: [react()], base });
