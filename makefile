enter:
	docker exec --detach-keys='ctrl-e,e' -it pdf-demo-container-1 bash -c 'su - ubuntu'
enter-root:
	docker exec --detach-keys='ctrl-e,e' -it pdf-demo-container-1 bash
list:
	docker ps
