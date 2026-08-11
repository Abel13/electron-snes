# Criando um plugin

Plugins permitem adicionar capacidades sem acoplar o core a uma implementação concreta. Antes de criar código no core, avalie se o comportamento pode ser entregue por um plugin.

## Estrutura mínima

```text
plugins/<categoria>/<plugin-id>/
  manifest.json
  definition.ts
  README.md
  tests/
```

## Manifesto

Todo plugin declara identidade, compatibilidade e acesso solicitado.

```json
{
  "id": "org.example.generic-controller",
  "name": "Generic Controller",
  "version": "1.0.0",
  "apiVersion": 1,
  "type": "controller",
  "capabilities": ["gamepad-mapping"],
  "permissions": []
}
```

Regras:

- `id` deve ser estável e globalmente único.
- `version` identifica a versão do plugin; `apiVersion` identifica uma única revisão
  inteira do contrato suportado.
- O host aceita uma faixa inclusiva de revisões de API. Plugins fora dessa faixa são
  mostrados como inativos para diagnóstico e nunca são executados.
- Mudanças aditivas compatíveis preservam a revisão atual; mudanças quebradas exigem
  uma nova revisão, estratégia de migração e documentação de compatibilidade.
- `type` deve ser um tipo suportado: `console`, `emulator-core`, `controller`, `game-metadata`, `theme` ou `integration`.
- `capabilities` descreve o que o plugin oferece; não use nomes de produto como capacidade.
- `permissions` deve conter somente acessos estritamente necessários. A ausência de permissões é preferível.
- O manifesto é estrito: campos extras são rejeitados. Cada capability é única em
  `kebab-case`, e cada recurso de permissão aparece uma única vez com ações únicas.
- Recursos de permissão usam segmentos minúsculos separados por `:`, como
  `device:metadata`; as ações permitidas são `read`, `write`, `list` e `execute`.
- Uma permissão declarada é apenas uma solicitação. O host usa default deny e só a
  torna disponível quando o recurso é reconhecido e recebe um grant explícito.
- Solicite recursos mediados, como `library:rom-content`, `storage:plugin-data` ou
  `network:outbound`; plugins nunca recebem caminhos, Node.js, Electron ou rede
  irrestrita diretamente.
- O schema valida estrutura e formato; a fronteira de validação também avalia a
  compatibilidade com o host e produz diagnósticos seguros.
- Um manifesto estruturalmente inválido bloqueia a descoberta. Um manifesto válido com
  `apiVersion` incompatível é registrado como inativo para diagnóstico e não pode
  executar código ou receber permissões.

Exemplo de solicitação mínima para leitura de uma ROM selecionada pelo usuário:

```json
{
  "resource": "library:rom-content",
  "actions": ["read"],
  "reason": "Load the selected game into the emulator core."
}
```

## Definição

Use o helper SDK correspondente ao tipo de plugin. A definição deve depender somente do SDK e de contratos públicos.

```ts
import { defineController } from '@platform/controller-sdk';

export default defineController({
  manifest: {
    id: 'org.example.generic-controller',
    name: 'Generic Controller',
    version: '1.0.0',
    apiVersion: 1,
    type: 'controller',
    capabilities: ['gamepad-mapping'],
    permissions: [],
  },
  controller: {
    id: 'org.example.generic-controller',
    match: [{ standardMapping: true }],
    mappings: [
      { input: { kind: 'button', index: 0 }, normalizedAction: 'primary' },
    ],
  },
});
```

Evite acessar Electron, filesystem, IPC interno ou implementações do core diretamente.

## Controllers

Um controller traduz hardware para ações normalizadas. Ele não deve conhecer a disposição de botões de um console ou a API de um emulador.

```text
Hardware -> Adapter do controller -> Ação normalizada -> Mapeamento do console -> Emulador
```

Prefira mapeamentos declarativos e validados. Garanta fallback seguro em desconexão e reconexão de dispositivos.

## Testes e documentação

Todo plugin deve incluir:

- teste de validação do manifesto;
- teste de contrato com o SDK;
- teste da capacidade principal, como mapeamento de input;
- README com propósito, compatibilidade, permissões, instalação e exemplo mínimo.

Use `validatePluginContract` de `@platform/plugin-test` para que validação local,
oficial e de CI compartilhem os mesmos gates. O runner recebe um valor já importado e
nunca carrega ou ativa código em nome do teste.

Ao alterar um contrato público, documente a compatibilidade e inclua um ADR quando a decisão afetar a arquitetura de longo prazo.

Antes de adotar uma API revision nova, siga `api-migration.md`. O guia da revisão deve
mostrar as alterações necessárias, os efeitos em permissões e como validar o plugin com
o runner público. Não dependa de detalhes internos para concluir uma migração.

Consulte `examples.md` para pacotes completos e executáveis que podem servir como ponto
de partida sem introduzir dependências internas.

Para iniciar um pacote novo, use o comando determinístico descrito em
`scaffold-cli.md`. Ele gera somente tipos que já podem passar pelo runner completo e
recusa sobrescrever diretórios existentes.

A referência consolidada de exports, exemplos mínimos, validação e compatibilidade está
em `sdk-reference.md`.
