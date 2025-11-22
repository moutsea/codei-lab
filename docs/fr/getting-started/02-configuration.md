# Configuration

## Configuration universelle (Windows / macOS / Linux)

### 1. Créer le dossier de configuration

Créez un dossier `.codex` dans votre répertoire personnel :

- macOS / Linux : `~/.codex`
- Windows : `C:\\Users\\<VotreNom>\\.codex`

S’il existe déjà, vous pouvez le réutiliser.

### 2. Créer `config.toml`

Dans ce dossier, créez un fichier `config.toml` et collez le contenu suivant :

```toml
model_provider = "codeilab"
model = "gpt-5.1"
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.codeilab]
name = "codeilab"
base_url = "https://www.codeilab.com/api/codex"
wire_api = "responses"
requires_openai_auth = true

[features]
web_search_request = true
```

Vous pourrez modifier le champ `model` si vous changez de modèle par la suite.

### 3. Créer `auth.json`

Toujours dans `.codex`, créez `auth.json` :

```json
{
  "OPENAI_API_KEY": "test"
}
```

Après votre abonnement, remplacez `test` par votre véritable clé.

### 4. Lancer le CLI Codex

Placez-vous dans votre projet et lancez `codex` :

```bash
cd your-project
codex
```

Si tout est correctement configuré, vous verrez une sortie similaire à ceci :

![](/codex_test.png)

Il est possible qu’un message du type suivant apparaisse :

```
unexpected status 403 Forbidden: {"error":{"message":"Hello! How can I help you with your software engineering tasks today?"}}
```

C’est normal et cela confirme simplement que la connexion au serveur fonctionne.

### 5. S’abonner et gérer les API keys

Rendez-vous sur la page [pricing](/#pricing) pour vous abonner. Vous pourrez ensuite créer plusieurs API keys, définir un quota et une date d’expiration pour chacune, ce qui facilite le partage avec votre équipe.

![](/create_api_key.png)

Cliquez sur le bouton de copie :

![](/copy_api_key.png)

Mettez ensuite à jour `auth.json` avec votre clé réelle :

```json
{
  "OPENAI_API_KEY": "sk-proj-xxxxxxx"
}
```

Enregistrez le fichier ; la prochaine exécution de `codex` utilisera automatiquement cette clé.

### 6. Utiliser l’extension VS Code

Installez l’extension Codex officielle depuis la marketplace VS Code (assurez-vous qu’elle porte la mention officielle) :

![](/vscode_codex.png)

L’extension lit automatiquement `config.toml` et `auth.json`, aucune configuration supplémentaire n’est nécessaire. Si VS Code affiche un message d’erreur, revérifiez les étapes ci-dessus.
