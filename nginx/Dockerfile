FROM nginx:1.25.3-alpine

RUN apk update && apk add openssl
RUN openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

COPY . /etc/nginx/conf.d/

RUN apk add --no-cache gettext

CMD sh -c "if [ \"$NEXT_PUBLIC_MODE\" = 'local' ]; then cat /etc/nginx/conf.d/local.conf.template > /etc/nginx/conf.d/default.conf.template; fi" &&\
  sh -c "if [ \"$GET_SSL_CERTIFICATE\" = 'true' ]; then cat /etc/nginx/conf.d/get-ssl.conf.template > /etc/nginx/conf.d/default.conf.template; fi" &&\
  envsubst '$SERVER_NAME,$NGINX_APP_HOST' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'