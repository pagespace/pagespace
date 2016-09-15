# docker run -it --rm -p 9999:9999 pagespace/demo
FROM ubuntu:14.04
MAINTAINER Phil Mander (philip.mander@gmail.com)

RUN \
    #mongo prep
    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927 && \
    echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list && \
    mkdir -p /data/db && \

    apt-get update && \

    #install curl and python (node-gyp requires python, Sharp requires node-gyp)
    apt-get install -y curl \
                       python && \

    #install node and mongo
    curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
    apt-get install -y nodejs \
                       build-essential \
                       mongodb-org=3.2.9 \
                       mongodb-org-server=3.2.9 \
                       mongodb-org-shell=3.2.9 \
                       mongodb-org-mongos=3.2.9 \
                       mongodb-org-tools=3.2.9 && \

    #clean up
    rm -rf /var/lib/apt/lists/*

#Pagespace
WORKDIR /usr/src/pagespace
COPY . .
RUN npm install
EXPOSE 9999

#start mongo, prepare db and start pagespace
CMD mongod --fork --logpath /var/log/mongod.log && ./clean.sh && npm start