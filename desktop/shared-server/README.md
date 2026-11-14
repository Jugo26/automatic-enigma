# Central Compartilhada — Bot Grepolis

MVP executável com **Node.js 20+**, sem dependências NPM. Inclui painel web em português, registro dos usuários do bot, estado online, tabela de ataques/apoios/comércio, filtros, atualização em tempo real via SSE, dados separados por mundo e compartilhamento individual opt-in.

## 1. Iniciar o servidor

```bash
# Linux/macOS — execute dentro da pasta grepolis-shared
export ADMIN_KEY="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")"
export HOST=127.0.0.1
export PORT=8787
npm start
```

No PowerShell:

```powershell
$env:ADMIN_KEY = node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
$env:HOST = '127.0.0.1'
$env:PORT = '8787'
npm start
```

Abra `http://127.0.0.1:8787`. Sem autenticação de usuário, a tela mostra apenas o login. O servidor usa armazenamento persistente em `data/state.json` (arquivo criado automaticamente).

Para acesso de outros dispositivos, publique por **HTTPS** em um servidor sob seu controle, usando um proxy reverso TLS e configure `CORS_ORIGINS` com a(s) origem(ns) exata(s) do jogo em que o conector rodará. Não exponha `ADMIN_KEY` no código do navegador nem no bot.

## 2. Cadastrar usuários do bot

Cada jogador recebe um token próprio. O administrador executa:

```bash
curl -X POST http://127.0.0.1:8787/admin/users \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"world":"br10","playerId":"12345","name":"Leonidas","alliance":"Sparta"}'
```

A resposta contém `token` (exibido **uma única vez**), `id`, `world` e `name`. Passe apenas o token ao jogador. Um token válido pode acessar dados do **mesmo mundo**, nunca dos demais. Os nomes de mundo acima são exemplos; use o identificador real retornado pelo jogo. O servidor recusa cadastro repetido de um mesmo `playerId` no mesmo mundo.

## 3. Conectar a coleta

No GrepoPilot Desktop, abra **Central compartilhada**, informe a URL e o token do jogador e clique em **Conectar**. Com o mundo aberto, a coleta usa as movimentações disponíveis nos modelos do jogo. O servidor aceita a lista apenas para a conta e o mundo do token.

### Conector para outros clientes

Importe `client/shared-bridge.js` na origem onde roda o bot e inicie a sincronização:

```js
import { startSharedBridge, mountSharedTab } from './client/shared-bridge.js';

// FILL: na camada de estado atual do bot, identifique a coleção de todas
// as cidades e os comandos ativos de cada cidade; normalize cada comando
// para o modelo abaixo e exponha um coletor collectAllBotMovements().
// Não use apenas os movimentos da cidade selecionada na interface.
const bridge = startSharedBridge({
  serverUrl: 'https://seu-servidor.example',
  token: myPrivateBotToken,
  collectMovements: collectAllBotMovements,
  getAlliance: () => currentPlayerAlliance
});

// No módulo de abas existente do bot, dê um contêiner a esta função.
mountSharedTab(containerDaAbaCompartilhada, 'https://seu-servidor.example');

// Em logout/troca de conta: bridge.stop().
```

Para conectar outro bot, mapeie os modelos dele para o formato abaixo e passe a função de coleta ao conector.

Formato de cada item enviado por `collectMovements()`:

```json
{
  "id": "movimento_1001",
  "type": "attack",
  "direction": "outgoing",
  "status": "traveling",
  "origin": { "id": "111", "name": "Atenas" },
  "destination": { "id": "222", "name": "Esparta" },
  "departAt": "2026-11-14T10:00:00-03:00",
  "arriveAt": "2026-11-14T11:40:00-03:00",
  "units": { "sword": 100, "light_ship": 10 },
  "resources": {},
  "note": ""
}
```

Campos de enumeração:
- `type`: `attack`, `support`, `trade`, `return`, `colonization`, `spy`, `other`.
- `direction`: `incoming`, `outgoing`, `internal` (sempre relativo à conta que envia o snapshot).
- `status`: `traveling`, `arrived`, `returning`, `canceled`, `unknown`.
- `units`: somente quantidades realmente conhecidas; no ataque recebido, envie `{}` se a composição não for revelada.
- `resources`: por exemplo `{ "wood": 500, "stone": 200, "iron": 100 }` para comércio. Não invente valores ausentes.
- `id`: estável, único entre os movimentos do mesmo jogador. Se o jogo não expõe ID de comando, derive um identificador determinístico usando ID da cidade de origem, destino, tipo e horário inicial; evite colisões entre remessas simultâneas.

O coletor deve devolver o **snapshot inteiro** de todas as cidades a cada 15 segundos; se um comando sumir do snapshot, a lista ativa o remove sem adivinhar se foi concluído, desviado ou cancelado. A API aceita até 400 movimentos por sincronização. A sincronização contínua mantém o indicador de presença online (45 segundos de tolerância).

## 4. Controlar o que é compartilhado

Na aba **Compartilhamento**, cada usuário ativa ou desativa a divulgação de seus movimentos. O valor inicial é desligado. A lista de jogadores existe no mundo mesmo quando não compartilham movimentos. Todo usuário autenticado daquele mundo pode ver os movimentos dos demais que optaram por compartilhá-los.

## 5. Endpoints

| Endpoint | Método | Função |
| --- | --- | --- |
| `/admin/users` | POST | Cadastrar conta; exige `X-Admin-Key` |
| `/api/state` | GET | Jogadores e movimentos visíveis no mundo do token |
| `/api/sync` | POST | Snapshot atualizado do próprio jogador. O Desktop envia `world` e `playerId` para conferência com o token. |
| `/api/profile` | POST | Alterar `sharing` (booleano) |
| `/api/stream` | GET | SSE para notificação imediata da atualização |
| `/health` | GET | Saúde do serviço |

Todos os `/api/*` exigem `Authorization: Bearer <token>`.

## 6. Testar

```bash
npm test
```

Os testes cobrem cadastro, autenticação, restrição por mundo, opt-in de compartilhamento, presença e remoção de comandos antigos.

### Escopo do MVP

Persistência em JSON e transmissão SSE de invalidação são adequadas para grupos pequenos. Para muitos mundos/jogadores, substitua o armazenamento por PostgreSQL e o fan-out por Redis. O MVP não inventa acesso à sessão do jogo, comandos recebidos ou movimentações de outros jogadores: cada instalação conectada só pode publicar o que seu próprio bot já conhece.

## 7. Aba flutuante independente (opcional)

Para testar a aba antes de alterar o código-fonte do seu bot, instale `client/grepolis-tab.user.js` em um gerenciador de userscripts. O script adiciona o botão **♜ Compartilhado** no canto inferior direito da tela do jogo e exibe o painel em um iframe. No primeiro clique, informe a URL HTTPS da central. O login do painel pede o token individual. A aba funciona com os dados recebidos do servidor, mas **a coleta das movimentações continua dependendo do conector do bot** descrito na seção 3.
