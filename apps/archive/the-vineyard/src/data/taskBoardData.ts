import { FileCode, FileJson, Folder, FileType, FileImage } from 'lucide-react';

export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  fileType?: 'ts' | 'tsx' | 'css' | 'json' | 'image';
  children?: FileNode[];
  isOpen?: boolean;
}

export const MOCK_FILE_TREE: FileNode[] = [
{
  id: 'src',
  name: 'src',
  type: 'folder',
  isOpen: true,
  children: [
  {
    id: 'components',
    name: 'components',
    type: 'folder',
    isOpen: true,
    children: [
    {
      id: 'Button.tsx',
      name: 'Button.tsx',
      type: 'file',
      fileType: 'tsx'
    },
    { id: 'Card.tsx', name: 'Card.tsx', type: 'file', fileType: 'tsx' },
    { id: 'Input.tsx', name: 'Input.tsx', type: 'file', fileType: 'tsx' }]

  },
  {
    id: 'pages',
    name: 'pages',
    type: 'folder',
    isOpen: false,
    children: [
    { id: 'Home.tsx', name: 'Home.tsx', type: 'file', fileType: 'tsx' },
    {
      id: 'Settings.tsx',
      name: 'Settings.tsx',
      type: 'file',
      fileType: 'tsx'
    }]

  },
  {
    id: 'styles',
    name: 'styles',
    type: 'folder',
    isOpen: false,
    children: [
    {
      id: 'global.css',
      name: 'global.css',
      type: 'file',
      fileType: 'css'
    }]

  },
  { id: 'App.tsx', name: 'App.tsx', type: 'file', fileType: 'tsx' },
  { id: 'main.tsx', name: 'main.tsx', type: 'file', fileType: 'tsx' }]

},
{
  id: 'public',
  name: 'public',
  type: 'folder',
  isOpen: false,
  children: [
  { id: 'logo.svg', name: 'logo.svg', type: 'file', fileType: 'image' },
  {
    id: 'favicon.ico',
    name: 'favicon.ico',
    type: 'file',
    fileType: 'image'
  }]

},
{ id: 'package.json', name: 'package.json', type: 'file', fileType: 'json' },
{
  id: 'tsconfig.json',
  name: 'tsconfig.json',
  type: 'file',
  fileType: 'json'
}];


export const MOCK_TODOS = [
{ id: 't1', text: 'Review component architecture', completed: true },
{ id: 't2', text: 'Implement responsive layout', completed: true },
{ id: 't3', text: 'Add hover states and transitions', completed: false },
{ id: 't4', text: 'Connect to real data API', completed: false },
{ id: 't5', text: 'Write unit tests', completed: false }];


export const MOCK_CLI_HISTORY = [
{ type: 'system', content: 'Agent initialized v2.4.1' },
{ type: 'user', content: 'analyze component structure' },
{ type: 'agent', content: 'Analyzing src/components...' },
{
  type: 'agent',
  content:
  'Found 3 reusable components. Suggesting extraction of "Badge" component.'
},
{ type: 'user', content: 'generate Badge.tsx' },
{ type: 'agent', content: 'Generating component...' },
{ type: 'success', content: '✓ Created src/components/Badge.tsx' }];