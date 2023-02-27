FROM dpage/pgadmin4
USER pgadmin
RUN mkdir -p  /var/lib/pgadmin/storage/admin_ihmc.moc
COPY docker/pgadmin/config.json /var/lib/pgadmin/storage/admin_ihmc.moc/config.json
#COPY docker/pgadmin/pgpass /var/lib/pgadmin/storage/admin_ihmc.moc/pgpass
#USER root
#RUN chown pgadmin:root /var/lib/pgadmin/storage/admin_ihmc.moc/pgpass
#RUN chmod 0600 /var/lib/pgadmin/storage/admin_ihmc.moc/pgpass
#USER pgadmin
ENTRYPOINT ["/entrypoint.sh"]


