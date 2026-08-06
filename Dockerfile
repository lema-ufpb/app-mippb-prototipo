FROM python:3.12-slim

WORKDIR /srv

COPY index.html ./
COPY dados ./dados
COPY config ./config
COPY static ./static
COPY iniciar_painel.command ./iniciar_painel.command

EXPOSE 8780

CMD ["sh", "./iniciar_painel.command"]
