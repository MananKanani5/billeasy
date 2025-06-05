# Book Review API

A RESTful API for a Book Review system built with Node.js, Express, and PostgreSQL. This API allows users to manage books, submit reviews, and search for books.

## Features

- User authentication with JWT
- Book management (CRUD operations)
- Review system with ratings and comments
- Search functionality
- Pagination and filtering
- Role-based access control
- Soft delete functionality

## Tech Stack

- Node.js with Express.js
- PostgreSQL with Prisma ORM
- JWT for authentication
- TypeScript
- Day.js for date handling

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Project Setup

1. Clone the repository:

```bash
git clone <repository-url>
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

## API Documentation

Detailed API documentation is available at: [Postman Documentation](https://documenter.getpostman.com/view/17679201/2sB2x2KZvo)

### Key Endpoints

#### Authentication

```bash
# Register
POST /signup
{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
}

# Login
POST /login
{
    "email": "john@example.com",
    "password": "password123"
}
```

#### Books

```bash
# Get all books (with pagination and filters)
GET /books?page=1&pageSize=10&genre=fiction&author=John

# Get book by ID
GET /books/1

# Create book (authenticated)
POST /books
{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "description": "A story of the fabulously wealthy Jay Gatsby",
    "imageUrl": "https://example.com/image.jpg",
    "genre": "fiction"
}

# Search books
GET /search?query=gatsby
```

#### Reviews

```bash
# Create review (authenticated)
POST /books/1/reviews
{
    "rating": "4.5",
    "comment": "Great book!"
}

# Update review (authenticated)
PUT /reviews/1
{
    "rating": "5",
    "comment": "Updated review"
}

# Delete review (authenticated)
DELETE /reviews/1
```

## Design Decisions & Assumptions

1. **Role-Based System**

   - Implemented role-based access control for future admin panel
   - Reviews require approval (isApproved flag) for potential moderation
   - Different permissions for admin and regular users

2. **Soft Delete**

   - All deletions are soft deletes (isDeleted flag)
   - Maintains data history and allows for data recovery
   - Prevents unique constraint violations with reviews

3. **Review System**

   - One review per user per book
   - Rating scale: 1-5 with decimal support
   - Average rating and total reviews tracked at book level
   - Reviews can be updated or soft-deleted

4. **Pagination & Filtering**

   - Default page size configurable via environment variable
   - Support for filtering by genre, author
   - Sorting options for books and reviews
   - Case-insensitive search

5. **Data Consistency**

   - Transactions for operations affecting multiple tables
   - Proper error handling and validation
   - Consistent response format across all endpoints

6. **Security**
   - JWT-based authentication
   - Password hashing
   - Input validation
   - Rate limiting (to be implemented)

## Environment Variables

| Variable     | Description                  | Default |
| ------------ | ---------------------------- | ------- |
| DATABASE_URL | PostgreSQL connection string | -       |
| PORT         | Server port                  | 3000    |
| JWT_SECRET   | Secret key for JWT           | -       |
| PAGE_SIZE    | Default items per page       | 10      |

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
