# ts-server-boilerplate

Server boilerplate typescript, typeorm, type-graphql and apollo-server with basic user authentication and authorization functionalities.

## Get started

Clone the repository

```
git clone https://github.com/M0kY/ts-server-boilerplate.git
```

Run with `docker-compose`

```
docker-compose up
```

## Architecture

1. Node.js application running inside a Docker container
2. PostgreSQL database for storing data
3. Redis for user session handling

## Features

1. Registration/Login
2. Account activation through e-mail
3. Password reset
4. User profile update
5. 2FA activation/deactivation
6. Account recovery (password change) through e-mail
7. Roles
8. Logging
