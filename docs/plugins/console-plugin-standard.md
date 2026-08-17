# Console plugin standard

Um plugin de console possui duas partes:

- `manifest.json`: identidade, versão da API, tipo, capabilities e permissões.
- `src/index.ts`: definição declarativa das regras do console.

O host não deve conhecer IDs de consoles. Toda diferença de ROM, input, vídeo e apresentação deve
ser declarada na definição validada pelo `console-sdk`.

## Manifest

O manifesto deve conter somente identidade e capacidades públicas:

```json
{
  "apiVersion": 1,
  "capabilities": ["cartridge-playback"],
  "id": "org.example.my-console",
  "name": "My Console",
  "permissions": [],
  "type": "console",
  "version": "1.0.0"
}
```

Não coloque caminhos de assets, extensões ou regras de input no manifesto. Esses dados pertencem à
`ConsoleDefinition`, onde são validados junto ao contrato do console.

## Definição obrigatória

Declare sempre:

- `id`, igual ao manifesto;
- `capabilities` reais;
- `supportedRomExtensions` e `maxRomBytes`;
- `inputActions`, `playerPorts` e `inputMapping` com ações normalizadas;
- `videoPresentation` com resolução, escala, filtro, crop e cena;
- `assets.consoleHero` e, quando houver composição de cartucho, `assets.cartridge`;
- `assets.cartridgeLabelLayout`: `standard` ou `wide`;
- `identifyRom` quando houver cabeçalho seguro para identificação.

`standard` é usado para cartuchos verticais. `wide` é usado para cartuchos horizontais ou com área
de etiqueta que exige composição própria. A UI aplica a variante declarada; o renderer não deve
testar o ID do console.

```ts
assets: {
  cartridge: 'assets/cartridges/my-console-cartridge.webp',
  cartridgeLabelLayout: 'wide',
  consoleHero: 'assets/consoles/my-console-console-hero.png',
},
```

O validator rejeita manifesto incompatível, paths externos, assets inseguros, extensões inválidas
e definições incompletas antes do registro oficial. O scaffold do `plugin-cli` já inclui a estrutura
inicial para um novo console.
