# QuickNotes System Architecture & Scaling Specification

An architectural plan designing the QuickNotes platform for 1 million registered users.

---

## 1. System Requirements

### Functional Requirements
* Users can authenticate, create, read, update, and delete categorized notes.
* Notes support full-text searching by keyword.
* System automatically dispatches asynchronous audit events and email notifications upon critical note modifications.

### Non-Functional Requirements
* **High Availability**: 99.9% uptime with zero single points of failure.
* **Low Latency**: P95 read response times under 50 ms; P95 write response times under 150 ms.
* **Data Durability**: Zero data loss (RPO = 0) with automatic read-replica failovers.

---

## 2. Capacity Estimations (1 Million Users)

* **Registered Users:** 1,000,000
* **Daily Active Ratio:** 15% ($150,000\text{ DAU}$)
* **Daily Usage per Active User:**
  * Note views / searches: 40 reads/day
  * Notes created or edited: 4 writes/day
* **Time Conversion:** 1 day $\approx 100,000\text{ seconds}$

### A. Throughput Calculations
* **Read Throughput:**
  $$\text{Daily Reads} = 150,000 \times 40 = 6,000,000 \text{ reads/day}$$
  $$\text{Average Reads/sec} = \frac{6,000,000}{100,000} = 60 \text{ reads/sec}$$
  $$\text{Peak Reads/sec } (5\times) = 300 \text{ reads/sec}$$
* **Write Throughput:**
  $$\text{Daily Writes} = 150,000 \times 4 = 600,000 \text{ writes/day}$$
  $$\text{Average Writes/sec} = \frac{600,000}{100,000} = 6 \text{ writes/sec}$$
  $$\text{Peak Writes/sec } (5\times) = 30 \text{ writes/sec}$$

### B. Storage Footprint per Year
* Average note size: $1\text{ KB}$ (metadata + text body)
* Daily storage growth: $600,000 \text{ writes} \times 1\text{ KB} = 600,000\text{ KB} \approx 600\text{ MB/day}$
* Annual storage growth: $600\text{ MB/day} \times 365\text{ days} \approx 219\text{ GB/year}$ (readily manageable on managed PostgreSQL clusters).

---

## 3. Architecture Diagram

```text
                           +----------------------+
                           |   Client Browsers    |
                           +----------------------+
                                      |
                                      v
                           +----------------------+
                           |     Route 53 DNS     |
                           +----------------------+
                                   /      \
               Static Assets (HTML/CSS/JS)   API Traffic
                                 /          \
                                v            v
                   +-------------------+   +--------------------+
                   | CloudFront CDN    |   | Load Balancer(ALB) |
                   +-------------------+   +--------------------+
                                                     |
                                         +-----------+-----------+
                                         |                       |
                                         v                       v
                              +--------------------+   +--------------------+
                              |    App Server 1    |   |    App Server 2    |
                              |  (Node.js Cluster) |   |  (Node.js Cluster) |
                              +--------------------+   +--------------------+
                                         |         \   /         |
                                         |      +----+----+      |
                                         |      |  Redis  |      |
                                         |      |  Cache  |      |
                                         |      +---------+      |
                                         |                       |
                     +-------------------+                       +-------------------+
                     | (Writes)                                  | (Job Dispatch)
                     v                                           v
          +----------------------+                    +----------------------+
          | Primary DB (Writer)  |                    |    Message Queue     |
          |  (PostgreSQL ACID)   |                    |      (RabbitMQ)      |
          +----------------------+                    +----------------------+
                     |                                           |
             (Replication)                                       v
                     v                                +----------------------+
          +----------------------+                    |    Worker Server     |
          | Read Replica DB      |                    |  (Async Tasks/Audit) |
          | (Read Queries)       |                    +----------------------+
          +----------------------+