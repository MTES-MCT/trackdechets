
FROM golang

RUN mkdir -p /cachet-monitor/
RUN cd /cachet-monitor && wget https://github.com/CastawayLabs/cachet-monitor/releases/download/v3.0/cachet_monitor_linux_amd64
RUN cd /cachet-monitor && chmod +x ./cachet_monitor_linux_amd64 && mv cachet_monitor_linux_amd64 /bin/cachet-monitor

ENTRYPOINT cachet-monitor -c /etc/cachet-monitor.config.json
