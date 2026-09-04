# 🕷️ MIRANHA BOT — Reconstrução completa

Projeto reconstruído a partir das cópias antigas recuperadas e do catálogo de comandos.

## O que foi mantido

- Conexão Baileys com QR Code e reconexão
- Console antigo: `🕷️ MIRANHA BOT ONLINE`
- Cache de metadados de grupo por 5 minutos para reduzir erro 429
- Administração: ban, promover, rebaixar, mute, advertências, atividade e foto de perfil
- Metas diária e semanal
- Bloqueios por usuário/comando no grupo e global
- Moderadores do bot com permissão por comando
- Whitelist
- Parcerias
- Anti-link, anti-convite, anti-flood e anti-palavra
- Boas-vindas e saída
- Auto-respostas
- Social recreativo
- Arena / quiz
- Economia separada por grupo
- Loja com 70 itens
- Sticker e conversão para imagem

## Removido por redundância / pouca utilidade

- `status` (já existe `statusbot`)
- `teste` (já existe `ping`)
- `resetrank` (já existe `limparrank`)
- `opengp` / `closegp` (use `grupo on/off`)
- `blockmenugp` e variantes (use `blockcmdgp menu`)
- aliases extras de sticker; permanecem `sticker`, `s`, `fig`
- aba `play`
- comandos de moderação excessivamente específicos/duplicados


## Migração rápida do bot antigo

Se você extraiu `MIRANHA_BOT_COMPLETO` dentro de `~/bot-whatsapp`, rode:

```bash
cd ~/bot-whatsapp/MIRANHA_BOT_COMPLETO
bash migrar_antigo.sh ~/bot-whatsapp
```

Ele copia a sessão `auth_info_baileys` e a configuração antiga. O banco antigo fica preservado em `database_antigo/` para evitar misturar formatos antigos com os novos; o prefixo é migrado automaticamente.


## Instalação no Termux

```bash
cd ~/bot-whatsapp
unzip MIRANHA_BOT_COMPLETO.zip
cd MIRANHA_BOT_COMPLETO
bash install.sh
```

Edite:

```bash
nano config/config.js
```

Troque:

```js
dono: process.env.BOT_DONO || "SEU_NUMERO_COM_DDI"
```

por exemplo:

```js
dono: "5511999999999"
```

Depois:

```bash
npm run check
npm start
```

## Sessão antiga

A pasta `auth_info_baileys` **não está incluída** no ZIP por segurança.
Se você já possui essa pasta do bot antigo, copie-a para a raiz deste projeto.
Se não possui, ao iniciar aparecerá um novo QR Code.

## Backup

```bash
termux-setup-storage
bash backup.sh
```

O arquivo será salvo em `/sdcard/Download/`.

## Comandos de dono ocultos

Estes funcionam, mas não aparecem no menu público:

- `!addsaldo @pessoa 500`
- `!setsaldo @pessoa 1000000`
- `!limparrankdinheiro`


## Atualização: AutoMsg, mídia, roles e proteções

Incluídos nesta versão:
- `automsg` com on/off, add, list e del por ID (intervalo mínimo de 5 min);
- boas-vindas com foto ou banner, legenda de entrada e saída e modo de legenda simples;
- cargos/roles com criar, alterar, excluir, listar, dar e remover;
- proteções `anticlique`, `antiaudio`, `antifig`, `antiloc` e `antitoxic`;
- integração das mídias nos eventos de entrada/saída;
- catálogo sem comandos duplicados.
