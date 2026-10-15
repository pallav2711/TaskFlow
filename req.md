Project: Task Management System with Authentication & Kanban Board
Technology Stack: React, Node.js, Express.js, MongoDB
Problem Statement
Develop a full-stack task management application where users can securely log in, manage projects and tasks, assign tasks to team members, and track progress through an interactive Kanban board.
1. Authentication & Authorization
Implement user registration and login.
Store passwords securely using bcrypt or an equivalent password-hashing algorithm.
Implement JWT-based authentication.
Create protected frontend routes and backend APIs.
Implement logout functionality.
Ensure users can access only the projects and tasks they are authorized to access.
Validate user input and handle invalid credentials appropriately.
2. Dashboard
Display total tasks, pending tasks, in-progress tasks, and completed tasks.
Display task counts by priority.
Show project progress and recently updated tasks.
Fetch dashboard statistics dynamically from the backend.
3. Project Management
Create, view, update, and delete projects.
Display project details and associated tasks.
Assign team members to projects.
Restrict project operations based on user permissions.
4. Task Management
Each task should include:
Title
Description
Priority: Low, Medium, High, Urgent
Status: To Do, In Progress, In Review, Done
Assignee
Due date
Project reference
Implement the following functionality:
Create, view, edit, and delete tasks.
Search tasks by title.
Filter tasks by status, priority, project, and assignee.
Sort tasks by creation date or due date.
Display overdue tasks clearly.
5. Kanban Board
Implement four columns: To Do, In Progress, In Review, and Done.
Display task cards under the appropriate status column.
Implement drag-and-drop functionality to move tasks between columns.
Update the task status in the backend and persist it in MongoDB.
Ensure the updated status remains correct after refreshing the page.
Display task priority, assignee, and due date on each card.
Show the number of tasks in each column.
Handle API failures without leaving the UI in an incorrect state.
6. Backend & REST APIs
Build REST APIs using Node.js and Express.js.
Implement APIs for authentication, projects, tasks, team members, and dashboard statistics.
Use Mongoose to define database schemas and relationships.
Implement request validation and centralized error handling.
Use appropriate HTTP status codes.
Protect APIs with authentication and resource-level authorization.
7. Frontend & UI
Build a responsive interface using React.
Use reusable components and a clean folder structure.
Implement protected routes and authentication state management.
Provide loading indicators, empty states, validation messages, and error handling.
Create a clean dashboard, project view, task forms, and Kanban board.
8. Technical Requirements
Use environment variables for secrets and database configuration.
Provide an .env.example file without real credentials.
Follow a consistent code structure an	d naming convention.
Prevent unauthorized users from modifying other users' resources.
Ensure frontend validation is backed by server-side validation.
Submission Requirements
Source code in a Git repository.
README with installation and execution instructions.
.env.example file.
API documentation or a Postman collection.
Working application demonstration.

Evaluation Criteria: Authentication and security, React implementation, backend API design, database modelling, Kanban functionality, validation, error handling, code quality, and problem-solving ability.

