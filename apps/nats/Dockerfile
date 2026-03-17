FROM nats:2.12-alpine

COPY apps/nats/nats.conf /etc/nats/nats.conf

EXPOSE 4222 8222

# Use the config file
CMD ["-c", "/etc/nats/nats.conf"]
