/**
 * Fonte de dados do app.
 *  - 'api':   API .NET publicada (ocorrências, votos, categorias, municípios, relatórios).
 *             Login e orientação continuam em STANDBY até a API Java (ver README).
 *  - 'local': 100% offline, com AsyncStorage e dados de exemplo.
 */
export const DATA_SOURCE: 'local' | 'api' = 'api';

/** API Java (Spring Boot): cadastro, login (JWT oficial), perfil e IA de orientação. */
export const API_JAVA_URL = 'https://fiap-bairro-vivo-java.onrender.com';

/**
 * No navegador, a API Java recusa CORS; o app chama este caminho no próprio servidor
 * do Expo (proxy em metro.config.js), que repassa para API_JAVA_URL.
 */
export const API_JAVA_PROXY_WEB = '/api-java';

/** API .NET 8 (Render). O primeiro acesso pode levar ~50 s enquanto o servidor acorda. */
export const API_DOTNET_URL = 'https://fiap-bairro-vivo-csharp.onrender.com';

/** Tempo máximo de uma chamada HTTP (cobre o "acordar" do servidor gratuito). */
export const API_TIMEOUT_MS = 70_000;

/** Atraso simulado das chamadas locais, para os estados de carregamento aparecerem. */
export const LATENCIA_LOCAL_MS = 250;
