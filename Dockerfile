FROM ubuntu

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Tokyo

RUN apt update && apt upgrade -y && apt install -y tzdata apache2 vim less 
RUN a2enmod cgi rewrite headers

CMD ["apache2ctl", "-D", "FOREGROUND"]
