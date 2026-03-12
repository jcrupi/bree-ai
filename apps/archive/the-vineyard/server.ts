#!/usr/bin/env bun
/**
 * Production Server for The Vineyard
 * 
 * Serves built Vite app + Simple JSON API for persistence
 */

import { serve } from 'bun';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';

const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST_DIR = join(import.meta.dir, 'dist');
const DATA_DIR = '/app/data'; // Fly.io persistent volume mount point

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create DATA_DIR, falling back to local data folder');
  }
}

const PROJECTS_FILE = join(DATA_DIR, 'projects.json');
const TASKS_FILE = join(DATA_DIR, 'tasks.json');
const AGENTS_FILE = join(DATA_DIR, 'agents.json');
const AREAS_FILE = join(DATA_DIR, 'areas.json');

// Initialize files if they don't exist or are empty
const seedData = () => {
  if (!existsSync(PROJECTS_FILE) || readFileSync(PROJECTS_FILE, 'utf-8') === '[]') {
    const defaultProjects = [
      { id: 'proj-1', name: 'Website Redesign', description: 'Overhaul company website', color: '#3B82F6', icon: '🌐', createdAt: '2024-01-01' },
      { id: 'proj-2', name: 'API Platform', description: 'Backend services', color: '#10B981', icon: '⚡', createdAt: '2024-01-10' }
    ];
    writeFileSync(PROJECTS_FILE, JSON.stringify(defaultProjects, null, 2), 'utf-8');
  }
  if (!existsSync(TASKS_FILE) || readFileSync(TASKS_FILE, 'utf-8') === '[]') {
    const defaultTasks = [
      { id: 'task-1', title: 'Implement auth API', status: 'done', priority: 'high', projectId: 'proj-1', areaId: 'backend', assigneeId: 'ha3', createdAt: '2024-01-15' },
      { id: 'task-2', title: 'DB Migrations', status: 'in-progress', priority: 'high', projectId: 'proj-1', areaId: 'backend', assigneeId: 'ai2', createdAt: '2024-01-16' },
      { id: 'task-3', title: 'REST Endpoints', status: 'todo', priority: 'medium', projectId: 'proj-1', areaId: 'backend', assigneeId: 'ha3', createdAt: '2024-01-17' },
      { id: 'task-4', title: 'Rate Limiting', status: 'todo', priority: 'high', projectId: 'proj-2', areaId: 'backend', assigneeId: 'ai3', createdAt: '2024-01-20' }
    ];
    writeFileSync(TASKS_FILE, JSON.stringify(defaultTasks, null, 2), 'utf-8');
  }
  if (!existsSync(AGENTS_FILE)) {
    const defaultAgents = [
      { id: 'ha3', name: 'Alex', type: 'human', color: '#3B82F6', category: 'human-ai' },
      { id: 'ai2', name: 'NEXUS', type: 'ai', avatar: '⚡', color: '#6366F1', category: 'ai-special' },
      { id: 'ai3', name: 'SENTINEL', type: 'ai', avatar: '🛡️', color: '#EF4444', category: 'ai-special' }
    ];
    writeFileSync(AGENTS_FILE, JSON.stringify(defaultAgents, null, 2), 'utf-8');
  }
  if (!existsSync(AREAS_FILE)) {
    const defaultAreas = [
      { id: 'backend', name: 'Backend', color: '#10B981' },
      { id: 'frontend', name: 'Frontend', color: '#3B82F6' },
      { id: 'devops', name: 'DevOps', color: '#EF4444' }
    ];
    writeFileSync(AREAS_FILE, JSON.stringify(defaultAreas, null, 2), 'utf-8');
  }
};

seedData();

// Serve static files
async function serveStaticFile(pathname: string): Promise<Response | null> {
  if (pathname === '/' || (!pathname.includes('.') && !pathname.startsWith('/api'))) {
    pathname = '/index.html';
  }

  const filePath = join(DIST_DIR, pathname);
  
  try {
    const file = Bun.file(filePath);
    if (await file.exists()) {
      const ext = pathname.split('.').pop()?.toLowerCase();
      const contentType = {
        'html': 'text/html',
        'js': 'application/javascript',
        'css': 'text/css',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
      }[ext || ''] || 'application/octet-stream';

      return new Response(file, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': ext === 'html' ? 'no-cache' : 'public, max-age=31536000',
        },
      });
    }
  } catch (error) {}
  return null;
}

const server = serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // API: Get Projects
    if (pathname === '/api/projects' && req.method === 'GET') {
      const data = readFileSync(PROJECTS_FILE, 'utf-8');
      return new Response(data, { headers: { 'Content-Type': 'application/json' } });
    }

    // API: Get Tasks
    if (pathname === '/api/tasks' && req.method === 'GET') {
      const data = readFileSync(TASKS_FILE, 'utf-8');
      return new Response(data, { headers: { 'Content-Type': 'application/json' } });
    }

    // API: Get Agents
    if (pathname === '/api/agents' && req.method === 'GET') {
      const data = readFileSync(AGENTS_FILE, 'utf-8');
      return new Response(data, { headers: { 'Content-Type': 'application/json' } });
    }

    // API: Get Areas
    if (pathname === '/api/areas' && req.method === 'GET') {
      const data = readFileSync(AREAS_FILE, 'utf-8');
      return new Response(data, { headers: { 'Content-Type': 'application/json' } });
    }

    // API: Save Project
    if (pathname === '/api/projects' && req.method === 'POST') {
      const newProject = await req.json();
      const projects = JSON.parse(readFileSync(PROJECTS_FILE, 'utf-8'));
      newProject.id = newProject.id || `proj-${Date.now()}`;
      newProject.createdAt = new Date().toISOString().split('T')[0];
      projects.push(newProject);
      writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
      return Response.json(newProject);
    }

    // API: Save Task
    if (pathname === '/api/tasks' && req.method === 'POST') {
      const newTask = await req.json();
      const tasks = JSON.parse(readFileSync(TASKS_FILE, 'utf-8'));
      newTask.id = newTask.id || `task-${Date.now()}`;
      newTask.createdAt = new Date().toISOString().split('T')[0];
      tasks.push(newTask);
      writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
      return Response.json(newTask);
    }

    // Serve Static Files
    const fileResponse = await serveStaticFile(pathname);
    if (fileResponse) return fileResponse;

    return new Response('Not Found', { status: 404 });
  }
});

console.log(`🍷 Vineyard server running at http://${server.hostname}:${server.port}`);
