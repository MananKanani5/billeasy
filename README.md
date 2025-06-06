# Mini Assignment: Book Review API (Node.js)

## Objective:

Build a RESTful API using Node.js (with Express) for a basic Book Review system. This assignment is designed to assess your understanding of backend fundamentals, authentication, and clean API design.

## Features

- User authentication with JWT
- Book management (CRUD operations)
- Review system with ratings and comments
- Search functionality
- Pagination and filtering
- Soft delete functionality

## Tech Stack

- Node.js with Express.js
- PostgreSQL with Prisma ORM
- JWT for authentication
- TypeScript
- Day.js for date handling
- Joi for input validations

## Database Schema

The database schema is defined in `prisma/schema.prisma` with models for users, books, and reviews. It includes proper relationships, constraints, and soft delete functionality.

## API Documentation

The API is live at: [https://billeasy-0ryn.onrender.com/api](https://billeasy-0ryn.onrender.com/api)

Detailed API documentation with example requests is available at: [Postman Documentation](https://documenter.getpostman.com/view/17679201/2sB2x2KZvo)

## Project Setup

1. Clone the repository:

```bash
git clone https://github.com/MananKanani5/billeasy.git
cd billeasy
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/billeasy"
PORT=3000
JWT_SECRET="your-secret-key"
PAGE_SIZE=10
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

## Design Decisions & Assumptions

1. **Role-Based System & Security**

   - Role-based access control with admin/user roles which helps to add review approval system for moderation
   - password hashing using bcrypt
   - Input validation using Joi

2. **Data Management**

   - Soft delete implementation across all models
   - One review per user per book
   - Rating scale: 1-5 with decimal support

3. **Data Consistency & Error Handling**
   - Transaction support for multi-table operations
   - Consistent response format
   - Proper error handling and validation

## Created by

Manan kanani
[Portfolio](https://portfolio.manankanani.in/)
[github](https://github.com/MananKanani5/)
[LinkedIn](https://www.linkedin.com/in/manan-kanani/)
