# DevOps & Infrastructure Standards - Genius Talent

## Cloud Platform

- **Primary Provider**: Fly.io (for edge-compute and ease of deployment)
- **Secondary Provider**: AWS (for long-term storage and specific services)

## Containerization

- All applications must have a `Dockerfile`.
- Use multi-stage builds to keep production images minimal.
- Standardize on Alpine or Debian Slim base images.

## Required Skills

### Cloud Platforms
- **Fly.io**: App deployment, Fly Machines, regional deployment, and edge computing
- **AWS**: EC2, ECS/EKS, Lambda, S3, RDS, CloudFront, Route53, and IAM management
- **Multi-Cloud**: Understanding trade-offs between providers and hybrid cloud strategies
- **Cloud Architecture**: VPCs, subnets, security groups, load balancers, and auto-scaling
- **Cost Optimization**: Resource tagging, reserved instances, and cost monitoring

### Container Technologies
- **Docker**: Dockerfile optimization, layer caching, image security scanning
- **Docker Compose**: Multi-container applications, networking, and volume management
- **Container Registries**: Docker Hub, ECR, GitHub Container Registry
- **Image Optimization**: Multi-stage builds, minimal base images, and layer reduction
- **Security**: Vulnerability scanning, non-root users, and secret management

### Orchestration
- **Kubernetes**: Pods, deployments, services, ingress, config maps, and secrets
- **Helm**: Chart creation, templating, and package management
- **Service Mesh**: Istio or Linkerd for advanced traffic management (optional)
- **Scaling**: Horizontal Pod Autoscaler, Cluster Autoscaler, and resource management

### Infrastructure as Code
- **Terraform**: Resource provisioning, state management, modules, and workspaces
- **Pulumi**: Alternative IaC with familiar programming languages
- **CloudFormation**: AWS-native infrastructure templates
- **Configuration Management**: Ansible, Chef, or Puppet for server configuration

### CI/CD Pipelines
- **GitHub Actions**: Workflow automation, matrix builds, and secrets management
- **GitLab CI**: Pipeline configuration, runners, and deployment strategies
- **Jenkins**: Pipeline as code, distributed builds, and plugin ecosystem
- **Deployment Strategies**: Blue-green, canary, rolling updates, and rollback procedures
- **Artifact Management**: Docker registries, npm registries, and binary storage

### Monitoring & Observability
- **Metrics**: Prometheus, Grafana dashboards, PromQL queries, and alerting rules
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana) or Loki for log aggregation
- **Tracing**: Jaeger, Zipkin for distributed tracing in microservices
- **APM**: New Relic, DataDog, or Dynatrace for application performance monitoring
- **Uptime Monitoring**: Pingdom, UptimeRobot, or custom health check systems

### Networking & Security
- **DNS**: Route53, Cloudflare, DNS configuration, and SSL/TLS certificate management
- **Load Balancing**: ALB, NLB, NGINX, HAProxy configuration and health checks
- **CDN**: CloudFront, Cloudflare for content delivery and DDoS protection
- **VPN**: Site-to-site VPN, bastion hosts, and secure access patterns
- **Security Groups**: Firewall rules, principle of least privilege, and network segmentation

### Database Operations
- **Database Administration**: PostgreSQL, MySQL administration, backup, and recovery
- **Database Migration**: Zero-downtime migrations, rollback strategies
- **Replication**: Master-slave, master-master replication setup
- **Backup Strategies**: Automated backups, point-in-time recovery, disaster recovery plans
- **Performance Tuning**: Query optimization, index management, and connection pooling

### Scripting & Automation
- **Bash**: Shell scripting for automation, system administration tasks
- **Python**: Automation scripts, AWS SDK (boto3), infrastructure tools
- **Go**: Writing performant CLI tools and operators
- **YAML/JSON**: Configuration file management and templating

### Version Control & Collaboration
- **Git Workflows**: Gitflow, trunk-based development, and release management
- **Branch Protection**: Code review enforcement, CI checks, and merge policies
- **GitOps**: ArgoCD, Flux for declarative infrastructure and deployment
- **Documentation**: Runbooks, disaster recovery procedures, and architecture diagrams

### Security & Compliance
- **Secrets Management**: Vault, AWS Secrets Manager, encrypted environment variables
- **Security Scanning**: Trivy, Snyk for vulnerability detection
- **Compliance**: SOC2, HIPAA, GDPR requirements and audit trails
- **Access Control**: RBAC, IAM policies, principle of least privilege
- **Network Security**: WAF, DDoS protection, intrusion detection systems

### Performance & Reliability
- **SLIs/SLOs**: Defining and measuring service level objectives
- **Incident Response**: On-call procedures, incident management, and post-mortems
- **Chaos Engineering**: Fault injection, resilience testing
- **Capacity Planning**: Resource forecasting, load testing, and scaling strategies
- **High Availability**: Multi-AZ deployment, failover mechanisms, and redundancy

### Soft Skills
- **Problem Solving**: Troubleshooting production issues, root cause analysis
- **Communication**: Writing clear documentation, incident reports, and status updates
- **Collaboration**: Working with development teams, understanding application needs
- **Automation Mindset**: Identifying repetitive tasks and creating automated solutions
- **Continuous Learning**: Staying current with DevOps tools and cloud platform updates

## Tags

#devops #cloud #docker #flyio #deployment
