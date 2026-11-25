# bairro vivo.

> Seu bairro, mapeado por quem vive nele.

Aplicativo mobile da **FIAP Global Solution 2026/2 — CitizenTech**, disciplina **Mobile Application Development**.

**Vídeo de demonstração:** https://youtu.be/lmjSAfi-Nhw  
**Versão Web (GitHub Pages):** https://fiap-bairro-vivo.github.io/fiap-bairro-vivo-mobile/

## Solução

O **Bairro Vivo** é um app colaborativo de problemas urbanos (buraco, poste apagado, lixo, vazamento, calçada quebrada, árvore). O morador:

- **registra** a ocorrência com categoria, descrição e local no mapa, podendo publicar como anônimo;
- **acompanha** as ocorrências na lista e no mapa;
- **confirma** quando o problema foi resolvido: duas confirmações de contas diferentes fecham a ocorrência, e duas de que "ainda continua" reabrem;
- vê **como resolver**: a quem recorrer, com canais e fontes oficiais.

O perfil **ADMIN** consulta relatórios e gerencia categorias.

## Funcionalidades

| Tela | O que faz |
| --- | --- |
| Login e Cadastro | Entrar com email e senha, criar conta ou explorar sem entrar |
| Mapa | Ocorrências no mapa, filtros e botão Registrar |
| Explorar | Lista paginada com filtros de situação, categoria, município e ordem |
| Registrar / Editar | Formulário com validação, mini mapa e localização |
| Detalhe | Dados da ocorrência, votação ("1 de 2 confirmações") e histórico |
| Atualizar | "Foi resolvido", "Ainda continua" ou informação adicional |
| Como resolver | Órgão responsável, canais, passo a passo e fontes |
| Minhas ocorrências | Ocorrências do usuário, com editar e excluir |
| Perfil e Sobre | Dados da conta, versão e hash do commit |
| Relatórios e Categorias (ADMIN) | Totais por categoria e município; criar, editar e desativar categorias |

## Stack

- **React Native** com **Expo (SDK 58)**, **TypeScript** e **Expo Router**
- **AsyncStorage** para persistência local (sessão e dados do aparelho)
- **react-native-svg**, **expo-linear-gradient**, **lucide-react-native** e fontes Bricolage Grotesque e Inter
- **expo-location**, **expo-image-picker** e **expo-crypto**
- Integração com as APIs do projeto: **Java (Spring Boot)** para login e **.NET 8** para ocorrências, votos e relatórios
- **ESLint**, **Prettier** e **Jest**

## Como executar

Pré-requisito: **Node.js 20+**.

```bash
npm install
```

```bash
npx expo start
```

Com o servidor aberto, pressione **`w`** para abrir no navegador.

> As APIs ficam em um servidor gratuito: o primeiro acesso pode levar até 1 minuto.

## Usuários de teste

| Perfil | Email | Senha |
| --- | --- | --- |
| Cidadão | `maria@bairrovivo.com` | `bairro123` |
| Cidadão | `joao@bairrovivo.com` | `bairro123` |
| Admin | `admin@bairrovivo.com` | `admin123` |

Para ver a votação completa: entre como **Maria**, abra uma ocorrência e toque em **"Foi resolvido"** (fica 1 de 2); depois entre como **João** e confirme — a ocorrência vira **RESOLVIDA**. Com o **admin**, veja os **Relatórios**.

## Estrutura

```
app/          telas (Expo Router)
src/
  components/ componentes visuais
  services/   acesso às APIs e ao armazenamento local
  domain/     regras de negócio (validação e votação)
  hooks/      sessão e carregamento de dados
  theme/      cores, fontes e espaçamentos
assets/       ícone e splash
```

## Integrantes

| Nome completo | RM |
| --- | --- |
| Grazielle Alencar | RM561529 |
| Rafael Kubagawa | RM565572 |
| Diego Andrade | RM566385 |
| Vinicius Soteras | RM566230 |
| Julia De Altino | RM564870 |
