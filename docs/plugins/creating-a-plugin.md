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
- `version` identifica a versão do plugin; `apiVersion` identifica o contrato suportado.
- `type` deve ser um tipo suportado: `console`, `emulator-core`, `controller`, `game-metadata`, `theme` ou `integration`.
- `capabilities` descreve o que o plugin oferece; não use nomes de produto como capacidade.
- `permissions` deve conter somente acessos estritamente necessários. A ausência de permissões é preferível.

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
