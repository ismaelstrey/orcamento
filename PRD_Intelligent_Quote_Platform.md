# Intelligent Quote Platform (IQP)

## Product Requirements Document (PRD)

**Autor:** Ismael Strey Pereira\
**Versão:** 1.0

------------------------------------------------------------------------

# Visão

Criar uma plataforma SaaS inteligente para geração de orçamentos
utilizando IA, comparação automática de preços, monitoramento de
promoções e compartilhamento profissional de propostas comerciais.

O objetivo é permitir que técnicos, empresas e consumidores gerem
orçamentos completos em segundos utilizando linguagem natural,
importação de JSON ou integração com modelos de IA.

------------------------------------------------------------------------

# Objetivos

-   Automatizar montagem de orçamentos.
-   Comparar preços entre múltiplas lojas.
-   Monitorar promoções.
-   Compartilhar propostas por link.
-   Gerar PDFs profissionais.
-   Criar um assistente inteligente de compras.

------------------------------------------------------------------------

# Público-alvo

-   Técnicos de informática
-   Integradores
-   MSPs
-   Empresas
-   Lojas de TI
-   Gamers
-   Desenvolvedores
-   Provedores de Internet
-   Consumidores finais

------------------------------------------------------------------------

# Problema

Hoje um orçamento exige:

1.  Pesquisar produtos.
2.  Comparar lojas.
3.  Conferir compatibilidade.
4.  Montar proposta.
5.  Atualizar quando preços mudam.

Tudo manual.

------------------------------------------------------------------------

# Solução

Uma IA realiza todo esse processo automaticamente.

Fluxo:

Usuário → IA → Busca produtos → Compara preços → Sugere alternativas →
Gera orçamento → PDF → Link compartilhável → Monitoramento.

------------------------------------------------------------------------

# MVP

## Funcionalidades

-   Login
-   Multiempresa
-   Dashboard
-   Clientes
-   Produtos
-   Categorias
-   Orçamentos
-   Compartilhamento
-   PDF
-   Importação JSON
-   Exportação JSON

------------------------------------------------------------------------

# IA

Exemplo:

> Quero um computador para programação até R\$ 5.000.

A IA gera:

-   CPU
-   Placa-mãe
-   Memória
-   SSD
-   Fonte
-   Gabinete
-   Monitor
-   Alternativas

------------------------------------------------------------------------

# Importação JSON

``` json
{
  "categoria":"Computador",
  "orcamento_maximo":5000,
  "itens":[
    {
      "tipo":"cpu",
      "modelo":"Ryzen 7600"
    }
  ]
}
```

------------------------------------------------------------------------

# Compartilhamento

Links públicos:

https://app.exemplo.com/q/ABCD1234

------------------------------------------------------------------------

# Módulos

## Usuários

-   Administrador
-   Empresa
-   Vendedor
-   Cliente
-   Convidado

## Produtos

-   Nome
-   Marca
-   Categoria
-   Modelo
-   SKU
-   GTIN
-   Imagens
-   Especificações

## Categorias

-   Computadores
-   Notebooks
-   Servidores
-   Redes
-   Monitores
-   Energia
-   Ferramentas

## Lojas

-   KaBuM
-   Pichau
-   Terabyte
-   Mercado Livre
-   Amazon
-   AliExpress
-   Microless

## Histórico de preços

-   Preço
-   Data
-   Loja
-   Frete
-   Disponibilidade

## Monitoramento

Usuário marca produtos de interesse e recebe alertas quando o preço
cair.

Notificações:

-   WhatsApp
-   Telegram
-   E-mail
-   Push

------------------------------------------------------------------------

# IA Especializada

Agentes:

-   Hardware
-   Notebook
-   Rede
-   Servidor
-   Comparador
-   PDF
-   SEO

------------------------------------------------------------------------

# Compatibilidade automática

Validação entre:

-   CPU
-   Socket
-   Placa-mãe
-   RAM
-   Fonte
-   Gabinete
-   Cooler

------------------------------------------------------------------------

# Stack Tecnológica

## Frontend

-   Next.js 16
-   React
-   TypeScript
-   Tailwind CSS v4
-   shadcn/ui
-   Motion
-   React Hook Form
-   Zod

## Backend

-   Next.js
-   Prisma
-   PostgreSQL
-   Redis
-   Workers

## Integrações

-   OpenAI
-   Gemini
-   Claude
-   OpenRouter
-   Mercado Pago
-   Stripe
-   n8n

------------------------------------------------------------------------

# Arquitetura

apps/ - web

packages/ - ui - ai - pricing - scraper - auth - pdf - shared

workers/ - price-monitor - notifications

------------------------------------------------------------------------

# Roadmap

## V1

-   CRUD
-   Compartilhamento
-   PDF
-   JSON

## V2

-   IA
-   Comparador
-   Alternativas

## V3

-   Histórico de preços
-   Dashboard

## V4

-   Monitoramento
-   Alertas

## V5

-   Mobile

## V6

-   Marketplace

------------------------------------------------------------------------

# Monetização

## Free

-   10 orçamentos/mês
-   IA limitada
-   3 monitoramentos

## Pro

-   Orçamentos ilimitados
-   IA completa
-   Comparação
-   Histórico
-   API

## Business

-   Multiempresa
-   White-label
-   Equipes
-   Webhooks

------------------------------------------------------------------------

# Diferenciais

-   IA conversacional
-   Compatibilidade automática
-   Comparador de lojas
-   Histórico de preços
-   Monitoramento de promoções
-   Compartilhamento profissional
-   Arquitetura escalável

------------------------------------------------------------------------

# Próximos documentos

1.  Arquitetura Técnica (TAD)
2.  Modelagem Prisma
3.  Fluxos UX
4.  Prompts dos Agentes
5.  APIs
6.  Banco de Dados
7.  Roadmap Técnico
8.  Plano Comercial
9.  Estratégia de SEO
10. Plano de Lançamento
