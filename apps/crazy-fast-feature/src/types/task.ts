export type TaskStatus = 'pending' | 'investigating' | 'active' | 'complete';

export type ProductName = 'Wound AI' | 'Performance AI' | 'Extraction AI';

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Task {
  id: string;
  taskId: string;
  productName: ProductName;
  description: string;
  link: string;
  createdDate: string;
  status: TaskStatus;
  comments: Comment[];
}

export interface TaskFilters {
  productName: ProductName | 'all';
  status: TaskStatus | 'all';
  search: string;
}
