docker run --rm -v some_volume:/volume -v /tmp:/backup alpine sh -c "rm -rf /volume/* /volume/..?* /volume/.[!.]* ; tar -C /volume/ -xjf /backup/some_archive.tar.bz2"


  pgdata:
  pgconf:
  pglog:
  pgdata2:
  pgconf2:
  pglog2:
  pgadmin-data:
  html:
  dhparam:
  vhost:
  certs:
  id-volume:
  proxy_logs: