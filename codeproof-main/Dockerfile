# Use the official Node.js 20 image as the base
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies first
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port the server listens to (defined as 3000 in api/server.ts)
EXPOSE 3000

# Run the app in development mode
CMD ["npm", "run", "dev"]
