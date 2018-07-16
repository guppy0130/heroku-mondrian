FROM heroku/heroku:16

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN apt-get update \
    && apt-get install -y curl graphicsmagick \
    && apt-get -y autoclean
    
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 10.1.0

RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash

RUN source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN node -v
RUN npm i -g npm@6.2.0
RUN npm -v

RUN useradd -m heroku
USER heroku
ADD ./ /home/heroku
WORKDIR /home/heroku

RUN ls -a
# RUN npm i
CMD npm start