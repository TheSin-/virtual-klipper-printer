FROM python:3.10-slim-bullseye AS builder

RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    --no-install-suggests \
    ### non-specific packages
    git \
    swig \
    virtualenv \
    ### klipper
    avr-libc \
    binutils-avr \
    build-essential \
    cmake \
    gcc-avr \
    libcurl4-openssl-dev \
    libssl-dev \
    python3-dev \
    python3-libgpiod \
    ### clean up
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* 

WORKDIR /build

### Prepare our applications
#### Klipper
RUN git clone https://github.com/klipper3d/klipper \
    && virtualenv -p python3 /build/klippy-env \
    && /build/klippy-env/bin/pip install -r /build/klipper/scripts/klippy-requirements.txt

#### Simulavr
COPY config/simulavr.config /usr/src
RUN git clone -b master https://git.savannah.nongnu.org/git/simulavr.git \
    # Build the firmware
    && cd klipper \
    && cp /usr/src/simulavr.config .config \
    && make PYTHON=python3 \
    && cp out/klipper.elf /build/simulavr.elf \
    && rm -f .config \
    && make PYTHON=python3 clean \
    # Build simulavr
    && cd ../simulavr \
    && make python \
    && make build \
    && make clean

#### Moonraker
RUN git clone https://github.com/Arksine/moonraker \
    && virtualenv -p python3 /build/moonraker-env \
    && /build/moonraker-env/bin/pip install -r /build/moonraker/scripts/moonraker-requirements.txt

#### Moonraker Timelapse
RUN git clone https://github.com/mainsail-crew/moonraker-timelapse

#### MJPG-Streamer
RUN git clone --depth 1 https://github.com/jacksonliam/mjpg-streamer \
    && cd mjpg-streamer \
    && cd mjpg-streamer-experimental \
    && mkdir _build \
    && cd _build \
    && cmake -DPLUGIN_INPUT_HTTP=OFF -DPLUGIN_INPUT_UVC=OFF -DPLUGIN_OUTPUT_FILE=OFF -DPLUGIN_OUTPUT_RTSP=OFF -DPLUGIN_OUTPUT_UDP=OFF .. \
    && cd .. \
    && make \
    && rm -rf _build

## --------- This is the runner image

FROM python:3.10-slim-bullseye AS runner
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    --no-install-suggests \
    ### non-specific packages
    git \
    build-essential \
    supervisor \
    sudo \
    ### moonraker
    curl \
    iproute2 \
    libcurl4-openssl-dev \
    liblmdb-dev \
    libopenjp2-7 \
    libsodium-dev \
    libssl-dev \
    ### Octoprint
    python3-dev \
    virtualenv \
    avrdude \
    build-essential \
    cmake \
    curl \
    imagemagick \
    ffmpeg \
    fontconfig \
    g++ \
    git \
    haproxy \
    libffi-dev \
    libjpeg-dev \
    libjpeg62-turbo \
    libprotobuf-dev \
    libudev-dev \
    libusb-1.0-0-dev \
    libv4l-dev \
    openssh-client \
    v4l-utils \
    xz-utils \
    zlib1g-dev \
    x265 \
    ### Mainsail
    git \
    unzip \
    python3-virtualenv \
    python3-dev \
    libffi-dev \
    build-essential \
    libncurses-dev \
    avrdude \
    gcc-avr \
    binutils-avr \
    avr-libc \
    stm32flash \
    dfu-util \
    libnewlib-arm-none-eabi \
    gcc-arm-none-eabi \
    binutils-arm-none-eabi \
    libusb-1.0-0 \
    libusb-1.0-0-dev \
    nginx \
    ### clean up
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* 

RUN groupadd --force -g 1000 printer \
    && useradd -rm -d /home/printer -g 1000 -u 1000 printer \
    && usermod -aG dialout,tty,sudo printer \
    && echo 'printer ALL=(ALL:ALL) NOPASSWD:ALL' >> /etc/sudoers.d/printer

### copy all required files
COPY config/supervisord.conf /etc/supervisor/supervisord.conf
COPY scripts/start.sh /bin/start
COPY scripts/service_control.sh /bin/service_control

### make entrypoint executable
RUN chmod +x /bin/start
RUN chmod +x /bin/service_control

### Mainsail
COPY config/nginx/sites-available/* /etc/nginx/sites-available/
COPY config/nginx/conf.d/* /etc/nginx/conf.d/

RUN rm -rf /etc/nginx/sites-enabled/default \
    && ln -s /etc/nginx/sites-available/mainsail /etc/nginx/sites-enabled/

USER printer
WORKDIR /home/printer

# Copy our prebuilt applications from the builder stage
COPY --from=builder --chown=printer:printer /build/klippy-env ./klippy-env
COPY --from=builder --chown=printer:printer /build/klipper/ ./klipper/
COPY --from=builder --chown=printer:printer /build/moonraker ./moonraker
COPY --from=builder --chown=printer:printer /build/moonraker-env ./moonraker-env
COPY --from=builder --chown=printer:printer /build/moonraker-timelapse ./moonraker-timelapse
COPY --from=builder --chown=printer:printer /build/simulavr ./simulavr
COPY --from=builder --chown=printer:printer /build/simulavr.elf ./simulavr.elf
COPY --from=builder --chown=printer:printer /build/mjpg-streamer/mjpg-streamer-experimental ./mjpg-streamer

# Copy example configs and dummy streamer images
COPY --chown=printer:printer ./example-configs/ ./example-configs/
COPY --chown=printer:printer ./octoprint-defaults/ ./octoprint-defaults/
COPY --chown=printer:printer ./mjpg_streamer_images/ ./mjpg_streamer_images/

### Octoprint
RUN git clone https://github.com/OctoPrint/OctoPrint.git \
    && virtualenv -p python3 /home/printer/oprint
WORKDIR /home/printer/OctoPrint
RUN /home/printer/oprint/bin/pip install .

WORKDIR /home/printer
RUN git clone https://github.com/thelastWallE/OctoprintKlipperPlugin.git
WORKDIR /home/printer/OctoprintKlipperPlugin
RUN /home/printer/oprint/bin/pip install .

WORKDIR /home/printer
RUN rm -rf /home/printer/OctoPrintKlipperPlugin

### Mainsail
RUN mkdir /home/printer/mainsail

WORKDIR /home/printer/mainsail
RUN curl -LJOs https://github.com/mainsail-crew/mainsail/releases/latest/download/mainsail.zip -o mainsail.zip \
    && unzip -q mainsail.zip \
    && rm mainsail.zip

WORKDIR /home/printer

ENTRYPOINT ["/bin/start"]
