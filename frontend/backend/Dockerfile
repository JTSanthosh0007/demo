# Use a Node.js base image
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the backend port
EXPOSE 5000

# Command to run the backend server
CMD ["npm", "start"] # Or "node", "server.js" if preferred 