# ADR-0001: Plugin System Contract-First

## Contexto
A plataforma precisa permitir novas capacidades (consoles, emuladores, controllers, temas e integrações) sem alteração do core.

## Decisão
Adotar contratos declarativos (manifest + capabilities + permissões) e contratos SDK com versionamento explícito (`apiVersion`).

## Alternativas consideradas
- Injeção direta por código no core (rejeitada por acoplamento).
- Registro via configuração mínima sem validação (rejeitada por risco de integridade).

## Impacto
Reduz acoplamento e melhora escalabilidade da plataforma, com custo de validação e versionamento de contratos.
