## Start on local
### requirement:
	1) tukubai   => place tukubai on root directory ./tukubai
	2) .htaccess => setup .htaccess your own public_html path on web. (default /home/ubuntu/public_html)
	3) poppler-utils
	4) Docker
### start
```bash
docker compose up -d
docker exec -it <container-name> bash
# install python
# create virtualenv
# install packages: PyPDF2, pillow, reportlab
```
### check http://localhost:9111


## On the server.
### Requirment:
	1) tukubai installed server => place tukubai on /home/TOOL:/home/UTL
	2) clone source code
	3) create public_html's symbolic link on your public directory
	4) create virtualenv with python on the AJAX directory
	5) install packages: PyPDF2, pillow, reportlab
	6) poppler-utils: apt install poppler-utils
