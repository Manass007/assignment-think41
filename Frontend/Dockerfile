FROM node:20-alpine

# Set work directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN rm -rf node_modules package-lock.json
RUN npm install

# Copy all project files
COPY . .

# Expose port 5173 (Vite default dev port)
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]