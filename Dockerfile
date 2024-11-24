# Use the Nginx image
FROM nginx:alpine

# Copy the public folder contents to the default Nginx html directory
COPY public /usr/share/nginx/html

# Expose port 80 for HTTP traffic
EXPOSE 80
