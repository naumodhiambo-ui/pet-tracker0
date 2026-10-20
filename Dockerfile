FROM nginx:alpine

# Remove default config and static files
RUN rm -rf /usr/share/nginx/html/* && rm /etc/nginx/conf.d/default.conf

# Copy your website files
COPY . /usr/share/nginx/html/

# Copy your custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html/

EXPOSE 80


