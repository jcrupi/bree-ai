export interface Question {
  id: string;
  category: string;
  text: string;
}

export interface Speciality {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

export const agentXSpecialities: Speciality[] = [
  {
    id: 'backend-java',
    name: 'Java Backend',
    description: 'Spring Boot, JVM, Concurrency, and Microservices',
    questions: [
      {
        id: 'java-1',
        category: 'Spring Boot',
        text: "Explain the difference between `@Component`, `@Service`, `@Repository`, and `@Controller` annotations. Are they functionally different, or just semantic?"
      },
      {
        id: 'java-2',
        category: 'JVM Memory',
        text: "Describe the different memory areas in the JVM (Heap, Stack, Metaspace, etc.). How would you diagnose and resolve a memory leak in a production Spring Boot application?"
      },
      {
        id: 'java-3',
        category: 'Concurrency',
        text: "What are Virtual Threads (Project Loom) in Java 21, and how do they differ from platform threads? When would you use them, and what are their limitations?"
      },
      {
        id: 'java-4',
        category: 'JPA',
        text: "Explain the N+1 query problem in JPA/Hibernate. How would you detect it, and what strategies would you use to solve it? Provide code examples."
      },
      {
        id: 'java-5',
        category: 'Microservices',
        text: "Compare synchronous (REST/gRPC) vs. asynchronous (message queues) communication in microservices. When would you choose Kafka over RabbitMQ?"
      }
    ]
  },
  {
    id: 'backend-typescript',
    name: 'Typescript Backend',
    description: 'Node.js, Bun, ElysiaJS, Type Safety',
    questions: [
      {
        id: 'ts-1',
        category: 'Advanced Types',
        text: "Explain mapped types, conditional types, and template literal types in TypeScript. Create a utility type that extracts all string properties from an interface and makes them optional."
      },
      {
        id: 'ts-2',
        category: 'Bun vs Node',
        text: "Compare Bun with Node.js. What specific advantages does Bun provide for backend development? When would you still choose Node.js over Bun?"
      },
      {
        id: 'ts-3',
        category: 'ElysiaJS',
        text: "How does ElysiaJS achieve end-to-end type safety with the Eden client? Implement a type-safe API endpoint with validation and show how the client consumes it."
      },
      {
        id: 'ts-4',
        category: 'Async',
        text: "Compare callbacks, Promises, and async/await. How would you handle errors in an async function that calls multiple external APIs?"
      },
      {
        id: 'ts-5',
        category: 'Zod',
        text: "Design a complex Zod schema for a user registration endpoint with nested objects, array validation, custom error messages, and schema transformations."
      }
    ]
  },
  {
    id: 'devops',
    name: 'Devops',
    description: 'Docker, Kubernetes, AWS, CI/CD',
    questions: [
      {
        id: 'devops-1',
        category: 'Deployment',
        text: "Design a multi-region deployment strategy for a web application on Fly.io and AWS. How would you handle database replication, CDN configuration, and failover?"
      },
      {
        id: 'devops-2',
        category: 'Docker',
        text: "Your Docker image is 2GB. Walk through your optimization process to reduce it to under 200MB. Discuss multi-stage builds, layer caching, and security scanning."
      },
      {
        id: 'devops-3',
        category: 'Kubernetes',
        text: "Explain how pod-to-pod communication works in Kubernetes. How do Services, Ingress, and Network Policies interact?"
      },
      {
        id: 'devops-4',
        category: 'Terraform',
        text: "Your team needs to manage Terraform state for multiple environments. How would you structure state files, implement locking, and handle sensitive data?"
      },
      {
        id: 'devops-5',
        category: 'CI/CD',
        text: "Design a complete CI/CD pipeline for a monorepo with multiple services. How would you handle parallel builds, selective deployments, secret management, and rollback capabilities?"
      }
    ]
  },
  {
    id: 'react-ui',
    name: 'React Frontend',
    description: 'React, Hooks, State Management, Performance',
    questions: [
      {
        id: 'react-1',
        category: 'Reconciliation',
        text: "Explain how React's reconciliation algorithm works. What is the significance of keys in lists? How does React decide which DOM nodes to update?"
      },
      {
        id: 'react-2',
        category: 'Custom Hooks',
        text: "Create a custom `useDebounce` hook and a `useAsync` hook for handling API calls. How would you handle cleanup, error states, and loading states?"
      },
      {
        id: 'react-3',
        category: 'State Management',
        text: "Compare React Context, Zustand, and TanStack Query for state management. Design a state architecture for a complex app with auth, user preferences, and server data."
      },
      {
        id: 'react-4',
        category: 'Performance',
        text: "Your React app is experiencing slow renders and janky scrolling. Walk through your debugging process using React DevTools Profiler. Implement solutions using memoization and virtualization."
      },
      {
        id: 'react-5',
        category: 'Accessibility',
        text: "Make a custom dropdown menu fully accessible according to WCAG 2.1 AA standards. Implement keyboard navigation, ARIA attributes, focus management, and screen reader support."
      }
    ]
  }
];
