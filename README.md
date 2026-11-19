# bairro vivo.

> Seu bairro, mapeado por quem vive nele.

Aplicativo mobile da **FIAP Global Solution 2026/2** (tema **CitizenTech**), disciplina **Mobile Application Development**.

**Vídeo de demonstração:** _[cole aqui o link do vídeo]_
**Repositório:** _[cole aqui o link do repositório]_

---

## 1. O problema e a solução

Buraco na calçada, poste apagado, entulho na esquina, vazamento na rua. Quem mora no bairro vê esses problemas todo dia, mas não sabe a quem recorrer e nunca sabe se alguém já avisou ou se o problema foi resolvido.

O **Bairro Vivo** é um app colaborativo de problemas urbanos:

- Moradores **registram ocorrências** com categoria, descrição, local no mapa e fotos opcionais, inclusive de forma **anônima** para os vizinhos.
- Todos acompanham pela **lista (Explorar)** e pelo **mapa**.
- **A própria comunidade decide quando um problema foi resolvido:** duas confirmações de contas diferentes fecham a ocorrência; duas confirmações de que "ainda continua" reabrem.
- Uma tela **"Como resolver"** orienta o cidadão sobre a quem recorrer, sempre com fonte oficial. Na versão final, essa orientação virá de uma IA no backend Java (Spring AI + RAG); hoje usa uma base local de demonstração.
- O perfil **ADMIN** só consulta relatórios agregados e gerencia categorias. Ele **não** muda status, não vota e não modera relatos.

### Personas

| Persona          | Quem é                   | Como usa                                                                |
| ---------------- | ------------------------ | ----------------------------------------------------------------------- |
| **Lúcia**, 34    | Cadeirante               | Registra o que atrapalha o caminho (calçada quebrada, rampa bloqueada). |
| **Seu José**, 72 | Quer ajudar sem se expor | Publica e comenta em modo anônimo.                                      |
| **Bruno**, 41    | Vizinho engajado         | Acompanha o histórico e confirma quando o problema foi resolvido.       |
| **Carla**        | ADMIN                    | Só consulta relatórios e cuida das categorias.                          |

---

## 2. Como executar

Pré-requisitos: **Node.js 20+** e **npm**.

```bash
npm install
npx expo start
```

Com o servidor aberto, pressione **`w`** para abrir no navegador (Expo Web). Também funciona no Expo Go lendo o QR code, mas o alvo da entrega é o navegador.

O app vem ligado às APIs publicadas: **.NET** (`https://fiap-bairro-vivo-csharp.onrender.com`) e **Java** (`https://fiap-bairro-vivo-java.onrender.com`). No navegador, as chamadas à Java passam por um proxy do próprio `npx expo start` (`metro.config.js`). O servidor gratuito "dorme": a primeira chamada pode levar até 1 minuto (a tela de login avisa).

Para usar **100% offline**, troque em `src/config/env.ts`:

```ts
export const DATA_SOURCE: 'local' | 'api' = 'local';
```

No modo local, a primeira abertura grava os **dados de exemplo** no AsyncStorage (no navegador, fica no `localStorage`) e recarregar a página mantém tudo o que foi criado. No modo API, o AsyncStorage guarda a sessão (JWT), as contas de teste e o registro dos votos feitos neste aparelho.

### Usuários de teste

| Perfil  | Email                  | Senha       |
| ------- | ---------------------- | ----------- |
| CIDADÃO | `maria@bairrovivo.com` | `bairro123` |
| CIDADÃO | `joao@bairrovivo.com`  | `bairro123` |
| ADMIN   | `admin@bairrovivo.com` | `admin123`  |

As contas de teste não existem na API Java; no modo API cada uma recebe um JWT do **gerador de teste** da API .NET, ligado a um usuário do Oracle (ver seções 9 e 10): **Maria → usuário 1 ("Ana Demo")**, **João → usuário 2 ("Bruno Demo")** e **Admin → usuário 5 ("Admin Demo")**. Por isso o autor aparece com o nome do Oracle nas telas.

As senhas ficam guardadas apenas como **hash SHA-256** (`expo-crypto`). Também é possível **explorar o mapa sem entrar** (modo visitante, só leitura). **Criar conta nova** usa a API Java (`POST /api/v1/auth/registrar`) no modo API. Atenção: hoje a API .NET ainda não reconhece usuários criados no Java (erro 6 da seção 10).

### Restaurar os dados de exemplo

Só no modo local: em **Perfil → Sobre o app**, toque **5 vezes no logo**. Aparece o botão **"Restaurar dados de exemplo"**, que volta às 8 ocorrências iniciais (útil antes de gravar o vídeo).

### Outros comandos

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run test:api
```

```bash
npm run test:java
```

```bash
npm run commit-hash
```

`test:java` roda 20 verificações de contrato contra a API Java (cadastro, login, JWT, perfil, IA, CORS e integração com a .NET). `test:api` roda 68 verificações de contrato contra a API .NET publicada (leitura, escrita, votação, permissões e erros) e exclui o que criou no fim.

`commit-hash` grava o hash do último commit em `app.json > expo.extra.commitHash`, exibido na tela Sobre. Sem rodar o script, aparece o placeholder `PREENCHER_HASH_DO_COMMIT`.

---

## 3. Roteiro de demonstração (vídeo)

1. **Maria** entra (`maria@bairrovivo.com` / `bairro123`).
2. Toca em **Registrar**, escolhe categoria, título, descrição, arrasta o mini mapa (ou "Usar minha localização") e publica.
3. Vê a nova ocorrência no **Explorar** e no **detalhe**.
4. Abre uma ocorrência **ABERTA** (no modo local, **"Três postes apagados na praça"**) e marca **"Foi resolvido"** → fica **1 de 2 confirmações**.
5. Sai da conta (**Perfil → Sair da conta**).
6. **João** entra (`joao@bairrovivo.com` / `bairro123`), abre a mesma ocorrência e confirma **"Foi resolvido"**.
7. A ocorrência vira **RESOLVIDA** e aparece a tela **"Resolvida pela comunidade"**.
8. **Admin** entra (`admin@bairrovivo.com` / `admin123`) e vê os **Relatórios** atualizados.

No modo local, os dados de exemplo também trazem **"Calçada quebrada na Rua Taquari"** já com 1 de 2 confirmações e publicada como anônima pela Maria (aparece em Minhas ocorrências com o selo "Publicada como anônima").

---

## 4. Funcionalidades e telas

| Rota                          | Tela               | O que faz                                                                                                      |
| ----------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `/login`                      | Login              | Email e senha, link para cadastro, "Explorar o mapa sem entrar".                                               |
| `/cadastro`                   | Cadastro           | Nome, email, senha (mín. 8) e confirmação, com erro por campo.                                                 |
| `/`                           | Mapa               | Mapa ilustrado em SVG com pinos pela latitude/longitude, filtros, cartão da ocorrência selecionada, Registrar. |
| `/explorar`                   | Explorar           | Lista paginada (10 por página, "Carregar mais"), filtros de status, categoria, município e ordem.              |
| `/minhas`                     | Minhas ocorrências | Abas Todas/Abertas/Resolvidas com contagem, selo de anônima, Editar e Excluir.                                 |
| `/perfil`                     | Perfil             | Dados, contadores, Sobre o app, Sair.                                                                          |
| `/ocorrencia/nova`            | Registrar          | Categoria, título, descrição, local (mini mapa + GPS), município, endereço, fotos (até 3), anonimato.          |
| `/ocorrencia/[id]`            | Detalhe            | Foto, situação, caixa de votação "1 de 2", cartão "Como resolver", histórico.                                  |
| `/ocorrencia/[id]/editar`     | Editar             | Mesmos campos; o status não é editável; excluir (bottom sheet).                                                |
| `/ocorrencia/[id]/atualizar`  | Atualizar          | Foi resolvido / Ainda continua / Informação adicional, comentário, foto, anonimato.                            |
| `/ocorrencia/[id]/resolvida`  | Comemoração        | Aparece quando o voto da pessoa muda o status.                                                                 |
| `/ocorrencia/[id]/orientacao` | Como resolver      | Base local por categoria (São Paulo), com fontes oficiais. **STANDBY** IA Java.                                |
| `/relatorios`                 | Relatórios (ADMIN) | Totais, barras por categoria, tabela por município, filtros, exportar CSV.                                     |
| `/categorias`                 | Categorias (ADMIN) | Listar, criar, editar, ativar e desativar.                                                                     |
| `/conta`                      | Perfil (ADMIN)     | Mesmo perfil, sem contadores de cidadão.                                                                       |
| `/sobre`                      | Sobre o app        | Versão, projeto, hash do commit e botão escondido de restaurar dados.                                          |

Estados tratados em todas as telas: **carregando** (esqueleto), **lista vazia**, **400 por campo**, **401** (sessão expirada, com rascunho guardado), **403**, **404** ("Registro indisponível"), **409** (voto repetido), **429** (muitas ações seguidas), **erro inesperado** e **aviso de sucesso**.

---

## 5. Regras de votação

- Toda ocorrência nasce **ABERTA**, no **ciclo 1**.
- **"Foi resolvido"** conta como voto só quando a ocorrência está **ABERTA**. **"Ainda continua"** conta como voto só quando está **RESOLVIDA**. Nos outros casos, vira apenas evidência.
- **Informação adicional** nunca conta como voto e precisa de texto ou foto.
- **2 votos de contas diferentes no mesmo ciclo** mudam o status (ABERTA ↔ RESOLVIDA), incrementam o ciclo, zeram a contagem e gravam um registro de histórico — tudo numa única escrita.
- Cada conta vota **uma vez por ciclo**. Repetir retorna erro **409**: "Você já confirmou neste ciclo. Agora falta outro vizinho." O autor pode votar, mas nunca completa as duas confirmações sozinho.
- Publicação anônima mostra **"Cidadão anônimo"** para os vizinhos, mas a ocorrência continua em Minhas ocorrências do autor.
- Só o autor edita ou exclui. Editar não muda status, ciclo nem autor. Excluir é **lógico** (`excluida = true`): some das listas e do mapa, o histórico fica.
- ADMIN não cria ocorrência, não vota e não muda status.

As regras ficam em `src/domain/` (funções puras). A conversão dos dados das APIs é coberta por **19 testes unitários** (`npm test`).

---

## 6. Stack

- **Expo SDK 58** + **React Native 0.88** + **TypeScript**
- **Expo Router** (rotas por arquivo, grupos de abas para cidadão e admin)
- **@react-native-async-storage/async-storage** (persistência local)
- **react-native-svg** (logo, ícones de categoria, mapa ilustrado e mini mapa)
- **expo-linear-gradient** (degradês da marca)
- **@expo-google-fonts/bricolage-grotesque** e **@expo-google-fonts/inter** com **expo-font**
- **lucide-react-native** (ícones de traço)
- **expo-image-picker** (fotos), **expo-location** ("Usar minha localização"), **expo-crypto** (SHA-256 das senhas)
- **ESLint** (eslint-config-expo) + **Prettier**; **Jest** (jest-expo) para as regras de domínio

> Não usamos `react-native-maps` nem MapLibre porque não rodam no navegador. O mapa é ilustrado em SVG, com os pinos posicionados pela latitude/longitude normalizada dentro da área dos dados de exemplo.

---

## 7. Estrutura de pastas

```
app/                         Expo Router (cada arquivo é uma tela)
  _layout.tsx                fontes, sessão, seed inicial, ErrorBoundary
  (auth)/login.tsx, cadastro.tsx
  (tabs)/                    abas do CIDADÃO: Mapa, Explorar, Minhas, Perfil
  (admin)/                   abas do ADMIN: Relatórios, Categorias, Perfil (conta)
  ocorrencia/nova.tsx
  ocorrencia/[id]/           detalhe, editar, atualizar, orientacao, resolvida
  sobre.tsx, +not-found.tsx
src/
  components/                Button, Card, StickerShadow, TitleHighlight, StatusChip, Logo,
                             CategoryIcon, FormField, Select, BottomSheet, Toast, MiniMapa...
  features/                  telas compartilhadas (formulário de ocorrência, perfil)
  theme/                     colors, gradients, typography, spacing
  models/                    tipos e enums (espelham o contrato da API .NET)
  domain/                    regras puras + testes (__tests__)
  services/                  interfaces, implementação local e stubs remotos (STANDBY)
  storage/                   wrapper do AsyncStorage, sessão, seed, orientacoes.json
  hooks/                     useSession, useCarregar, useCatalogo, useLocation...
  config/env.ts              DATA_SOURCE e URLs das APIs
  utils/                     formatação e preparo de fotos
assets/                      ícone, splash e favicon da marca
scripts/                     atualizar-commit-hash.js
```

**Camada de serviços:** as telas só importam `src/services/index.ts`, que exporta a implementação certa conforme `DATA_SOURCE` em `src/config/env.ts`. Nenhuma tela importa o AsyncStorage ou uma implementação diretamente. Trocar `DATA_SOURCE` para `'api'` compila normalmente (os stubs respondem com erro STANDBY).

---

## 8. Identidade visual

Conceito **"asfalto e broto"**: o cinza quente da rua com o verde de quem cuida dela; o laranja da sinalização de obra marca o que pede ação. As telas seguem os mockups de design do projeto:

- Paleta em `src/theme/colors.ts` (verde `#1F7A4D`, sinal `#C2410C`, asfalto `#1C2321`, calçada `#F6F4EE`...).
- Degradês só nos lugares previstos (`src/theme/gradients.ts`).
- **Sombra chapada de adesivo** (`StickerShadow`): uma View escura deslocada atrás do conteúdo, igual no web e no nativo.
- **Marca-texto** nos títulos (`TitleHighlight`) e **ponto final laranja** em "bairro vivo.".
- Acessibilidade: contraste AA, alvos de 44 px, `accessibilityLabel` em botões só com ícone, status sempre com texto + ícone, rótulos visíveis nos campos.

---

## 9. Integração com a API .NET

URL: **https://fiap-bairro-vivo-csharp.onrender.com** (Swagger em `/swagger`). O cliente HTTP fica em `src/services/api/http.ts` e as conversões de DTO em `src/services/api/mapeadores.ts` (com testes). As telas continuam importando só `src/services/index.ts`.

> **Importante — como funciona o login do Bairro Vivo:** o método de login oficial é o **JWT emitido pela API Java** (Auth Service, Spring Boot). A API .NET **não faz login**: ela só **valida** o JWT que o Java emite.
>
> O endpoint `POST /api/auth/token` da API .NET é um **gerador de JWT apenas para testes**. O app só o usa para as **contas de teste** (maria, joao, admin), que não existem na API Java, e quando a API Java não autentica. Ver seção 10.

O token vai em `Authorization: Bearer` em todas as chamadas; um 401 encerra a sessão e leva ao login. Escritas usam `Idempotency-Key` para não duplicar em reenvio.

### Endpoints usados pelas telas

| Tela                                   | Endpoint                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Login (somente testes)                 | `POST /api/auth/token` — gerador de JWT de teste da .NET; o login oficial é o JWT da API Java                 |
| Mapa, Explorar                         | `GET /api/ocorrencias` (pagina, tamanho, status, categoriaId, municipioId, ordem)                             |
| Detalhe                                | `GET /api/ocorrencias/{id}`, `GET /api/ocorrencias/{id}/atualizacoes`, `GET /api/ocorrencias/{id}/historico`  |
| Registrar                              | `POST /api/ocorrencias` (+ `POST /api/ocorrencias/{id}/midias` só para fotos já hospedadas em URL)            |
| Editar / Excluir                       | `PUT /api/ocorrencias/{id}`, `DELETE /api/ocorrencias/{id}`                                                   |
| Atualizar / votar                      | `POST /api/ocorrencias/{id}/atualizacoes`                                                                     |
| Minhas ocorrências, autoria no Detalhe | `GET /api/ocorrencias/minhas`                                                                                 |
| Formulários e filtros                  | `GET /api/categorias`, `GET /api/municipios`                                                                  |
| Relatórios (ADMIN)                     | `GET /api/admin/relatorios/ocorrencias` (idMunicipio, idCategoria, status)                                    |
| Categorias (ADMIN)                     | `GET /api/categorias/{id}`, `POST /api/categorias`, `PUT /api/categorias/{id}`, `DELETE /api/categorias/{id}` |

### Endpoints da API que nenhuma tela usa

| Endpoint                                                             | Observação                                                                                                                     |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/atualizacoes/{id}`                                         | Detalhe de uma atualização isolada; o app lista pela ocorrência.                                                               |
| `POST /api/ocorrencias/{id}/atualizacoes/{idAtualizacao}/midias`     | Foto de evidência depois de enviar a atualização; depende de upload (STANDBY). O app manda `urlFotoEvidencia` no próprio POST. |
| `POST /api/ocorrencias/{id}/integracao-oracle/registrar-atualizacao` | Integração direta com procedure Oracle; duplica o POST de atualizações.                                                        |
| `GET /api/ocorrencias/{id}/integracao-oracle/total-votos-ativos`     | Total de votos via função Oracle; o app usa `totalVotosCiclo`.                                                                 |
| `GET /api/municipios/{id}`                                           | O app já recebe o município dentro da ocorrência.                                                                              |
| `GET /api/health/live`, `/db`, `/ready`                              | Monitoramento do servidor.                                                                                                     |
| `GET /api/ocorrencias` com `minLat/maxLat/minLon/maxLon`             | Busca por área visível; o mapa ilustrado mostra todas as ocorrências.                                                          |
| `GET /api/municipios?nome=&uf=`                                      | Busca de município por nome/UF; a lista é curta e vem inteira.                                                                 |

### Divergências encontradas na API (contornadas no app)

| Problema                                                                                                                     | Como o app lida                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Voto repetido no mesmo ciclo devolve **500** em vez de **409**.                                                              | O app lembra os votos da conta neste aparelho e desativa o botão; se o 500 vier mesmo assim, mostra a regra "falta outro vizinho". |
| `COMENTARIO` sem texto e sem foto é aceito (**201**).                                                                        | O app valida antes de enviar (erro no campo).                                                                                      |
| `dtCriacao` da ocorrência é gravada em **UTC** e as demais datas em **horário de Brasília**, todas **sem fuso**.             | `normalizarData` trata como Brasília e corrige quando a data cairia no futuro.                                                     |
| As respostas não trazem `idAutor` nem se a conta já votou no ciclo.                                                          | Autoria via `/minhas`; voto pelo registro local.                                                                                   |
| `ordem` só aceita `recentes`, `antigas` e `titulo` (não há "mais confirmações").                                             | O app busca a lista e ordena por votos no aparelho.                                                                                |
| `DELETE /categorias/{id}` só desativa, `GET /categorias` não lista inativas e o `PUT` não tem `ativa`: não dá para reativar. | O app lembra as que desativou e mostra o interruptor bloqueado.                                                                    |
| Violação de UNIQUE (chave de mídia ou nome de categoria repetidos) volta **500** em vez de **409**.                          | Mensagem amigável de erro.                                                                                                         |
| `URL_EXIBICAO` tem 1000 caracteres e não há upload de arquivo.                                                               | Envio de fotos desligado no modo API (STANDBY do serviço de imagens).                                                              |

## 10. Integração com a API Java

URL: **https://fiap-bairro-vivo-java.onrender.com** (prefixo `/api/v1`). Cliente em `src/services/api/httpJava.ts`, conversões em `src/services/api/mapeadoresJava.ts` (com testes) e serviços em `ApiJavaAuthService.ts` e `ApiJavaOrientacaoService.ts`.

**Proxy no navegador:** a API Java não responde ao CORS (o preflight devolve 403 para qualquer origem), então o navegador bloqueia as chamadas do Expo Web. O `metro.config.js` adiciona um proxy ao servidor do `npx expo start`: o app chama `/api-java/api/v1/...` na mesma origem e o Metro repassa para a API Java (só caminhos `/api/v1/**`). No celular o app chama a API Java direto, pois CORS é regra só do navegador.

**Como o login decide o emissor do JWT:**

1. O app sempre tenta primeiro o **login oficial** na API Java (`POST /api/v1/auth/login`).
2. Se a conta é uma das **contas de teste** (maria, joao, admin `@bairrovivo.com`), que não existem no Java, e a API Java responde 401 ou 500, o app usa o **gerador de JWT de teste da API .NET** (somente testes).
3. Contas novas são criadas na API Java (`POST /api/v1/auth/registrar`), que já devolve o JWT oficial.

A tela **Sobre o app** mostra quem emitiu o token da sessão ("API Java (oficial)" ou "Gerador de teste da API .NET (só testes)").

### Endpoints Java usados pelo app

| Tela          | Endpoint                                         | Situação hoje                                                                         |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Cadastro      | `POST /api/v1/auth/registrar`                    | ✅ 201 com JWT RS256; 409 para email repetido; 400 por campo                          |
| Login         | `POST /api/v1/auth/login`                        | ⚠️ 401 para email inexistente, mas **500** para qualquer email cadastrado (ver erros) |
| Perfil        | `GET /api/v1/usuarios/me`                        | ⚠️ 401 mesmo com o token emitido pela própria API; o app usa os dados do login        |
| Como resolver | `GET /api/v1/ia/orientacoes/ocorrencias/{id}`    | ✅ 200 (público), hoje sem orientações publicadas                                     |
| Como resolver | `POST /api/v1/ia/orientacoes` `{ ocorrenciaId }` | ⚠️ 401 mesmo com token válido; o app usa a base local                                 |

### Endpoints do contrato Java que nenhuma tela usa

| Endpoint                                                                                   | Motivo                                                                          |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `POST /api/v1/auth/logout`                                                                 | O contrato prevê logout só no app (sem revogação do JWT).                       |
| `PATCH /api/v1/usuarios/me`, `PUT /api/v1/usuarios/me/senha`, `DELETE /api/v1/usuarios/me` | Telas "Meus dados" e "Alterar senha" ainda em STANDBY (e a API recusa o token). |
| `GET/PUT/DELETE /api/v1/usuarios/me/preferencias`                                          | Não há tela de preferências no design.                                          |
| `/api/v1/usuarios/me/locais-favoritos` (CRUD)                                              | "Locais favoritos" está em STANDBY no Perfil.                                   |
| `GET /api/v1/ia/orientacoes/{id}`, `GET /api/v1/ia/orientacoes/minhas`                     | O app consulta pela ocorrência.                                                 |
| `POST /api/v1/auth/recuperar-senha`, `/redefinir-senha`                                    | Sem tela (o contrato marca como P1).                                            |

### Erros encontrados na API Java (`npm run test:java`)

| #   | Problema                                                                                                                                            | Impacto                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `POST /auth/login` responde **500** para qualquer email cadastrado (senha certa ou errada); só email inexistente dá 401.                            | Ninguém consegue entrar pelo Java; só o cadastro entrega token.                                                                        |
| 2   | Rotas autenticadas (`/usuarios/me`, `/ia/orientacoes`) respondem **401** com o token emitido pela própria API (a API .NET aceita esse mesmo token). | Perfil e IA indisponíveis; provável erro na configuração do resource server (chave/issuer).                                            |
| 3   | **CORS** não configurado: preflight 403 para qualquer origem.                                                                                       | O navegador não chama a API; contornado com o proxy do Metro.                                                                          |
| 4   | `GET /v3/api-docs` responde **500**; o Swagger UI não carrega o contrato.                                                                           | Sem documentação OpenAPI navegável.                                                                                                    |
| 5   | Rota inexistente em `/api/v1/auth/*` responde **500** em vez de 404.                                                                                | Erro genérico difícil de diagnosticar.                                                                                                 |
| 6   | Usuários criados no Java (ids 6 em diante) **não existem para a API .NET**: ela responde 403 "Usuário inativo ou inexistente".                      | Conta criada no app não consegue registrar/votar; Java e .NET parecem usar schemas Oracle diferentes ou `FL_ATIVO` diferente de `'S'`. |
| 7   | Mensagens de validação em inglês (`must not be blank`).                                                                                             | O app traduz para português.                                                                                                           |
| 8   | Resposta usa `usuario.papel` (texto) em vez de `papeis` (lista) do contrato.                                                                        | O app aceita os dois formatos.                                                                                                         |

Nos testes, a API Java emitiu um JWT **RS256** com `kid` `bairro-vivo-rsa-1`, `iss` `bairro-vivo-java`, `aud` `bairro-vivo-apis`, `sub` numérico e `roles`, conforme o contrato, e a API .NET valida a assinatura desse token.

## 11. Integrações pendentes (STANDBY)

| Onde                          | O que falta                                                                     | Hoje                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| API Java — login              | Corrigir o 500 do `POST /auth/login` e o 401 das rotas autenticadas (seção 10). | Contas de teste usam o gerador de JWT de teste da .NET; contas novas são criadas no Java.                  |
| `src/storage/sessionStore.ts` | Guardar o JWT no **Expo SecureStore** no celular.                               | AsyncStorage.                                                                                              |
| API Java — IA                 | `POST /ia/orientacoes` aceitar o JWT e publicar orientações.                    | `ApiJavaOrientacaoService` consulta a IA e, sem resposta, usa a base local `src/storage/orientacoes.json`. |
| Fotos                         | Upload de imagem (ex.: Cloudinary) antes de `POST /midias`.                     | Desligado no modo API; funciona no modo local.                                                             |
| Perfil                        | "Alterar senha", "Locais favoritos" e edição de dados.                          | Aviso de STANDBY.                                                                                          |
| Contadores do Perfil          | Endpoint com as atualizações e resolvidas da conta.                             | Contados a partir do que a conta fez neste aparelho.                                                       |

## 12. Integrantes

| Nome completo | RM     |
| ------------- | ------ |
| _[nome]_      | _[RM]_ |
| _[nome]_      | _[RM]_ |
| _[nome]_      | _[RM]_ |
