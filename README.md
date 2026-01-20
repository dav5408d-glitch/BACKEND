# Documentation du projet

## Table des matières

- [Introduction](#introduction)
- [Technologies utilisées](#technologies-utilisées)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Déploiement](#déploiement)
  - [Déploiement sur Render](#déploiement-sur-render)

## Introduction

Ce document a pour but de fournir une documentation claire et concise sur le projet, afin de faciliter son utilisation et son déploiement.

## Technologies utilisées

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt

## Installation

1. Clone le dépôt Git.
2. Navigue dans le dossier du projet.
3. Exécute `npm install` pour installer les dépendances.

## Utilisation

1. Assure-toi que MongoDB est en cours d'exécution.
2. Exécute `npm run dev` pour démarrer le serveur en mode développement.
3. Accède à l'application sur `http://localhost:3000`.

## Déploiement

### Déploiement sur Render

1. Crée un service web sur Render.
2. Configure les variables d'environnement (API keys, JWT_SECRET, etc.).
3. Commande de démarrage : `npm run start` ou `node dist/server.js`.
4. Render attribuera une URL publique à ton backend.