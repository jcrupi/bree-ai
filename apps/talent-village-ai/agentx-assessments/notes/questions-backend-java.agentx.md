# Backend Java Interview Questions - TalentVillage.ai

## Technical Interview Questions (Medium to Senior Level)

### 1. Spring Boot & Core Concepts
**Q:** Explain the difference between `@Component`, `@Service`, `@Repository`, and `@Controller` annotations. Are they functionally different, or just semantic?

### 2. JVM Memory & Performance
**Q:** Describe the different memory areas in the JVM (Heap, Stack, Metaspace, etc.). How would you diagnose and resolve a memory leak in a production Spring Boot application?

### 3. Concurrency & Threading
**Q:** What are Virtual Threads (Project Loom) in Java 21, and how do they differ from platform threads? When would you use them, and what are their limitations?

### 4. Spring Data & JPA
**Q:** Explain the N+1 query problem in JPA/Hibernate. How would you detect it, and what strategies would you use to solve it? Provide code examples.

### 5. Transaction Management
**Q:** What's the difference between `@Transactional(propagation = Propagation.REQUIRED)` and `Propagation.REQUIRES_NEW`? Give a real-world scenario where each would be appropriate.

### 6. API Design & Versioning
**Q:** How would you implement API versioning in a Spring Boot REST API? Compare URL versioning, header versioning, and content negotiation. Which approach would you choose and why?

### 7. Spring Security & JWT
**Q:** Implement a JWT-based authentication system in Spring Boot. How would you handle token refresh, revocation, and secure storage? What security concerns should you address?

### 8. Microservices Communication
**Q:** Compare synchronous (REST/gRPC) vs. asynchronous (message queues) communication in microservices. When would you choose Kafka over RabbitMQ? Discuss idempotency and retries.

### 9. Database Optimization
**Q:** You have a slow-running query in PostgreSQL. Walk through your optimization process: from identifying the issue to implementing and validating the solution.

### 10. Reactive Programming
**Q:** Explain the difference between imperative and reactive programming in Spring. When would you use Spring WebFlux over Spring MVC? What are the trade-offs?

### 11. Design Patterns
**Q:** Implement the Strategy pattern to handle multiple payment processors (Stripe, PayPal, Square) in a Spring Boot application. How would you make it extensible and testable?

### 12. Exception Handling
**Q:** Design a comprehensive exception handling strategy for a Spring Boot API. How would you handle validation errors, business logic errors, and unexpected exceptions? Show code examples.

### 13. Gradle & Build Optimization
**Q:** Your Spring Boot application's build time has increased significantly. What strategies would you use to optimize Gradle build performance? How would you implement incremental builds and caching?

### 14. Testing Strategies
**Q:** Write integration tests for a REST controller that interacts with a database and an external API. How would you handle the external dependencies? Discuss TestContainers and mocking strategies.

### 15. Records & Immutability
**Q:** Java Records are immutable by design. How would you implement validation in a Record used as a DTO? How does this interact with Spring Boot's validation framework?

### 16. Garbage Collection Tuning
**Q:** Your application experiences GC pauses causing latency spikes. How would you analyze GC logs, choose the right GC algorithm (G1GC vs ZGC), and tune JVM parameters?

### 17. Distributed Transactions
**Q:** Explain the Saga pattern for managing distributed transactions in microservices. How would you implement choreography vs. orchestration? What happens when a step fails?

### 18. Caching Strategies
**Q:** Design a multi-level caching strategy using Spring Cache, Redis, and database caching. How would you handle cache invalidation? Discuss cache-aside vs. write-through patterns.

### 19. Monitoring & Observability
**Q:** Implement comprehensive observability for a Spring Boot microservice using Micrometer, Prometheus, and distributed tracing. What metrics are most important, and how would you set up alerting?

### 20. CQRS & Event Sourcing
**Q:** Explain Command Query Responsibility Segregation (CQRS) and Event Sourcing. When would you use these patterns? Implement a simple example using Spring Boot and discuss the trade-offs.

## Tags

#interview #questions #java #spring #backend #assessment
