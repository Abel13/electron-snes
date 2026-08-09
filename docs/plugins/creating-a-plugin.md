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
- O schema valida estrutura e formato. A validação de arquivo, compatibilidade com o
  host e diagnósticos de descoberta pertencem à próxima fronteira de validação.
- Um manifesto estruturalmente inválido bloqueia a descoberta. Um manifesto válido com
  `apiVersion` incompatível fica inativo para diagnóstico e não pode executar código
  ou receber permissões.

## Definição

Use o helper SDK correspondente ao tipo de plugin. A definição deve depender somente do SDK e de contratos públicos.

```ts
import { defineController } from '@platform/controller-sdk';

export default defineController({
  id: 'org.example.generic-controller',
  actions: ['PRIMARY', 'SECONDARY', 'START', 'SELECT'],
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

Ao alterar um contrato público, documente a compatibilidade e inclua um ADR quando a decisão afetar a arquitetura de longo prazo.
