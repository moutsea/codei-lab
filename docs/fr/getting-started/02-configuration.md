#  Configuration

## Définir les paramètres d’environnement

#### Si vous utilisez MacOS ou Linux

Ajoutez le code suivant à votre fichier ~/.zshrc ou ~/.bashrc :

```bash
export ANTHROPIC_BASE_URL="https://www.claudeide.net/api/anthropic"
export ANTHROPIC_AUTH_TOKEN="test"  # remplacez-le par votre vraie clé API après abonnement
export API_TIMEOUT_MS=600000
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

Ensuite, exécutez: `source ~/.zshrc`

Ou bien, exécutez les lignes une par une :

```bash
# si vous utilisez bash, remplacez ~/.zshrc par ~/.bashrc
echo 'export ANTHROPIC_BASE_URL="https://www.claudeide.net/api/anthropic"' >> ~/.zshrc
echo 'export ANTHROPIC_AUTH_TOKEN="test"' >> ~/.zshrc
echo 'export API_TIMEOUT_MS=600000' >> ~/.zshrc
echo 'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1' >> ~/.zshrc

source ~/.zshrc 
```

#### Si vous utilisez Windows

Consultez cette page pour savoir comment définir des variables d’environnement: [set (environment variable)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/set_1)

```bash
set ANTHROPIC_BASE_URL=https://www.claudeide.net/api/anthropic
set ANTHROPIC_AUTH_TOKEN=test
set API_TIMEOUT_MS=600000
set CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

## Lancer le code Claude

Accédez à votre répertoire de projet et lancez `claude-ide`

```bash
cd your-project
claude
```

Vous obtiendrez :

![](/claude_test.png)

Vous pouvez également utiliser le plugin claude dans votre VSCode ou un autre IDE. Si vous êtes invité à configurer quelque chose comme ceci :

![](/claude_code_error.png)

Cela signifie que votre configuration n'est pas correctement définie, veuillez vérifier à nouveau.

## Abonnement

Après vous être abonné ici: [pricing](/#pricing)

Vous pouvez créer votre vraie clé API et définir des quotas ou une date d’expiration pour la partager avec vos coéquipiers.

![](/create_api_key.png)

Cliquez sur le bouton Copier :

![](/copy_api_key.png)

Remplacez la valeur de `ANTHROPIC_AUTH_TOKEN` par la clé réelle :

```bash
export ANTHROPIC_AUTH_TOKEN="sk-proj-xxxx"

# ou

echo 'export ANTHROPIC_AUTH_TOKEN="sk-proj-xxxx"' >> ~/.zshrc
source ~/.zshrc
```