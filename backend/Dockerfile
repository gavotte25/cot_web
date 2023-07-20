FROM ubuntu

RUN apt update
RUN apt install python3-pip -y
WORKDIR /usr/src/app
COPY . .
RUN pip3 install -r requirements.txt
EXPOSE 5000
CMD python3 app.py