# 🌐 Collabirx — AI-Powered Remote Team Workspace

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success" alt="Status">
  <img src="https://img.shields.io/badge/project-Final%20Year%20Project-blue" alt="Project">
  <img src="https://img.shields.io/badge/architecture-scalable-orange" alt="Architecture">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/AI-powered-purple" alt="AI">
</p>

``` Version: 1.0.0 ```

## 🚀 Overview
**Collabirx** is an AI-driven workspace designed to eliminate the friction of remote work. By centralizing communication, project management, and documentation into a single intelligent ecosystem, Collabirx helps teams move faster and stay aligned.

Developed as a **Final Year Project (FYP)**, this platform emphasizes:
* **Scalable System Design:** Built to handle growing team data.
* **Clean Architecture:** Strict separation of concerns for maintainability.
* **Engineering Excellence:** Implementing professional Git workflows and industry-standard CI/CD patterns.

---

## 🧠 AI Capabilities
The integrated AI engine acts as a "Digital Project Manager," providing:
* **Contextual Summarization:** Automatically distill long chat threads or meeting notes into actionable items.
* **Workflow Explanation:** Help new members understand complex project structures and task dependencies.
* **Productivity Analytics:** Identify bottlenecks in the development cycle through intelligent data patterns.
* **Smart Search:** Find documents and tasks using natural language queries.

---

## 🏗 Core Features

### 📁 Project Management
* **Dynamic Kanban Boards:** Interactive drag-and-drop task management.
* **Multi-Project Support:** Manage various workstreams from a single dashboard.
* **Custom Statuses:** Tailor workflows to specific team needs.

### 💬 Team Communication
* **Real-time Chat:** Instant messaging powered by WebSockets.
* **Channel Organization:** Topic-based and project-based conversation threads.

### 📄 Document & File Sharing
* **Centralized Repository:** Secure storage for project-related assets.
* **Contextual Linking:** Attach documents directly to tasks or chat messages.

### ⏱ Time Tracking & Insights
* **Task Timers:** Log hours spent on specific features.
* **Performance Metrics:** Visualized data on team velocity and individual contributions.
## 🌿 Git Branching Strategy

We follow a strict **Feature Branch Workflow** to ensure code quality and maintain a stable production environment.

### Main Branches
* **`main`**: Production-only. This branch is always stable and represents the latest deployed version.
* **`develop`**: Integration branch. All new features are merged here first for testing before moving to production.

### Supporting Branches
* **`feat/feature-name`**: Used for developing specific new features or enhancements.
* **`fix/bug-name`**: Used for addressing and resolving critical bugs.

---

### 📝 Commits
We utilize **Conventional Commits** to maintain a readable and automated project history:

* **Format:** `type(scope): short description`
* **Example (Feature):** `feat(auth): add google login`
* **Example (Fix):** `fix(chat): resolve message lag`

---

## 🚫 Development Rules

* ✅ **Never** commit directly to `main`. All changes must go through a Pull Request.
* ✅ **Always** pull the latest `develop` branch before starting a new feature branch.
* ✅ **Small Commits:** Keep changes atomic, focused, and easy to peer-review.
* ✅ **Clean Code:** Adhere to project ESLint and Prettier configurations to maintain consistency.

---

> **Collabirx** — *Engineering the future of remote work.*
