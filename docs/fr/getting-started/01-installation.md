# Guide d'installation

### Étape 1 : Installer Node.js

Node.js est un environnement d'exécution JavaScript basé sur le moteur V8 de Chrome qui permet l'exécution de scripts côté serveur et la création d'applications réseau évolutives.

Pour installer Node.js, téléchargez l'installateur depuis le site officiel (https://nodejs.org), exécutez le fichier d'installation et suivez les invites d'installation.

Alternativement, vous pouvez utiliser un gestionnaire de paquets comme `brew` sur macOS ou `apt` sur Linux.

#### Utiliser Brew sur macOS

```bash
# Si vous avez déjà installé brew
brew install node
```

#### Utiliser Apt sur Linux

```bash
# Sur Linux, utilisez apt pour installer Node.js
sudo apt install nodejs
sudo apt install npm
```

#### Télécharger et installer directement sous Windows

Visitez le site officiel de Node.js : [nodejs.org](https://nodejs.org/en)

**Sélectionnez une version à télécharger** :

- Version LTS (Long Term Support) : Convient à la plupart des utilisateurs, plus stable

- Version Current : Inclut les dernières fonctionnalités

**Étapes d'installation** :

- Double-cliquez sur le fichier d'installation .msi téléchargé

- Suivez l'assistant d'installation, cliquez généralement sur "Suivant"

- Le programme d'installation configurera automatiquement les variables d'environnement

- npm (Node Package Manager) sera installé par défaut

Après l'installation, vérifiez la version dans votre terminal :

```bash
node -v
# Vous devriez voir quelque chose comme : v23.11.0

npm -v
# Vous devriez voir quelque chose comme : 10.9.2
```

Si vous voyez les numéros de version, cela signifie que Node.js a été installé avec succès.

### Étape 2 : Installer OpenAI Codex CLI

openai-codex est un paquet Node.js utilisé pour interagir avec le modèle Codex d'OpenAI. Il fournit une interface simple permettant aux développeurs de communiquer facilement avec le modèle Codex et d'intégrer ses fonctionnalités dans leurs applications.

Installez openai-codex en utilisant npm (que vous avez installé plus tôt) :

```bash
npm install -g @openai/codex
```

Une fois l'installation terminée, vérifiez la version pour confirmer l'installation :

```bash
codex --version
# Vous devriez voir le numéro de version installé
```