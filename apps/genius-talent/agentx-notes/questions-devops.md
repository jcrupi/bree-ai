# DevOps & Infrastructure Interview Questions - Genius Talent

## Technical Interview Questions (Medium to Senior Level)

### 1. Multi-Region Deployment Strategy
**Q:** Design a multi-region deployment strategy for a web application on Fly.io and AWS. How would you handle database replication, CDN configuration, and failover? Discuss latency and consistency trade-offs.

### 2. Docker Image Optimization
**Q:** Your Docker image is 2GB. Walk through your optimization process to reduce it to under 200MB. Discuss multi-stage builds, layer caching, and security scanning. Show a before/after Dockerfile.

### 3. Kubernetes Networking
**Q:** Explain how pod-to-pod communication works in Kubernetes. How do Services, Ingress, and Network Policies interact? Design a secure network architecture for a microservices application.

### 4. Terraform State Management
**Q:** Your team needs to manage Terraform state for multiple environments. How would you structure state files, implement locking, and handle sensitive data? Compare remote backends (S3, Terraform Cloud).

### 5. CI/CD Pipeline Design
**Q:** Design a complete CI/CD pipeline for a monorepo with multiple services. How would you handle parallel builds, selective deployments, secret management, and rollback capabilities?

### 6. Incident Response
**Q:** At 2 AM, you receive alerts that the API is returning 500 errors. Walk through your incident response process from detection to resolution. What tools would you use? How would you prevent recurrence?

### 7. Kubernetes Resource Management
**Q:** Explain resource requests vs. limits in Kubernetes. How would you right-size resources for an application? What happens during OOMKilled scenarios? Discuss Horizontal Pod Autoscaler configuration.

### 8. Monitoring & Alerting Strategy
**Q:** Design a comprehensive monitoring strategy using Prometheus and Grafana. What RED (Rate, Errors, Duration) and USE (Utilization, Saturation, Errors) metrics would you track? How would you implement effective alerting without alert fatigue?

### 9. Blue-Green vs. Canary Deployment
**Q:** Compare blue-green and canary deployment strategies. Implement a canary deployment in Kubernetes that gradually shifts traffic while monitoring error rates. What's your rollback strategy?

### 10. Database Backup & Recovery
**Q:** Design a disaster recovery plan for a PostgreSQL database on AWS RDS. How would you implement automated backups, point-in-time recovery, and test restoration procedures? What's your RTO and RPO?

### 11. Infrastructure Security
**Q:** How would you implement security best practices for Kubernetes? Discuss pod security standards, network policies, secrets management, and RBAC. What security scanning tools would you use?

### 12. GitOps Implementation
**Q:** Implement a GitOps workflow using ArgoCD or Flux. How does the deployment process work? How would you handle environment-specific configurations and secrets? Discuss drift detection and reconciliation.

### 13. Log Aggregation at Scale
**Q:** Design a centralized logging solution for 50+ microservices. Compare ELK Stack vs. Loki vs. managed solutions. How would you handle log volume, retention policies, and query performance?

### 14. Cost Optimization
**Q:** Your AWS bill has increased 300%. How would you identify cost drivers, implement tagging strategies, and optimize resource usage? Discuss spot instances, reserved capacity, and rightsizing.

### 15. Service Mesh Architecture
**Q:** When would you implement a service mesh like Istio or Linkerd? What problems does it solve? Discuss traffic management, observability, and security features. What's the operational overhead?

### 16. Zero-Downtime Migrations
**Q:** You need to migrate a production database from PostgreSQL 12 to 15 with zero downtime. Walk through your migration strategy including testing, rollback plans, and data validation.

### 17. Certificate Management
**Q:** Design an automated SSL/TLS certificate management system using Let's Encrypt, cert-manager, or AWS Certificate Manager. How would you handle certificate rotation and monitoring expiration?

### 18. Disaster Recovery Testing
**Q:** How would you design and execute disaster recovery drills? What scenarios would you test? How do you ensure backups are actually restorable? Discuss chaos engineering practices.

### 19. Multi-Tenancy Architecture
**Q:** Design a multi-tenant infrastructure on AWS or Kubernetes. How would you ensure tenant isolation, resource quotas, and cost allocation? Compare shared cluster vs. dedicated cluster approaches.

### 20. Observability vs. Monitoring
**Q:** Explain the difference between monitoring and observability. Design an observability strategy that implements the three pillars: metrics, logs, and traces. How would you correlate data across these dimensions?

## Tags

#interview #questions #devops #infrastructure #kubernetes #cloud #assessment
