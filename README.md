
# Backend Project

## Overview
This backend project is a robust and scalable server-side application utilizing Node.js, Express, MongoDB, and Firebase. It is designed to handle various backend functionalities including user account management, image processing, and integration with OpenAI's GPT-4 API for text generation. Scheduled tasks for database updates are also implemented.

## Features
- **User Account Management**: CRUD operations for user accounts.
- **Image Processing**: Download and process images using Axios.
- **OpenAI GPT-4 Integration**: Generate text using OpenAI's GPT-4 model.
- **Scheduled Database Updates**: Regular updates to MongoDB collections.
- **Firebase Functions**: Utilize Firebase for cloud functions and deployment.

## Prerequisites
- Node.js (v18)
- MongoDB
- Firebase CLI
- TypeScript

## Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Firebase project and configure the Firebase CLI.
4. Configure your `.env` file with necessary environment variables (e.g., `OPENAI_API_KEY`).

## Running the Project
- **Development Mode**: 
  ```bash
  npm run serve:dev
  ```
- **Production Mode**: 
  ```bash
  npm run start
  ```

## API Endpoints
- **User Accounts**:
  - GET `/accounts/:uid`: Fetch a user account by UID.
  - POST `/accounts`: Create a new user account.
  - DELETE `/accounts/:id`: Delete a user account by ID.
  - PUT `/accounts/:id`: Update a user account by ID.
  - PATCH `/accounts/:id/toggle-article`: Toggle a space article in a user's list.
  - PATCH `/accounts/:id/toggle-image`: Toggle a NASA image in a user's list.
- **Image Processing**:
  - GET `/downloadImage?url=<image_url>`: Download an image.
- **OpenAI Integration**:
  - POST `/chatGPT/generate-text`: Generate text using OpenAI API.
- **Space Devs Info**:
  - GET `/space-events`: Fetch all space events.
  - GET `/astronauts`: Fetch all astronauts.
  - GET `/spacecrafts`: Fetch all spacecrafts.

## Scheduled Functions
The project includes scheduled functions to update the database with the latest space events, astronaut details, and spacecraft information.

## Deployment
Deploy the functions to Firebase using:
```bash
npm run deploy
```

## Contributing
Contributions to improve the project are welcome.
