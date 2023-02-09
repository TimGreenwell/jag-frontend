#!/bin/bash

VOLUMES="pgdata pgconf pglog pgdata2 pgconf2 pglog2 pgadmin-data html dhparam vhost certs id-volume proxy_logs"

backup=$PWD"/backup/"


if [ $1 ] ; then
  backup=$backup$1
  if [ ! -d $1 ]; then
  	mkdir -p $backup
  fi
fi

echo $backup

for i in $VOLUMES; do
  docker run --rm -v $backup:/backup  -v $i:/data:ro --name volume_backup alpine sh -c "cd /data && /bin/tar -czf /backup/$i.tar.gz ."
  echo "Saved $i to $backup"
done
