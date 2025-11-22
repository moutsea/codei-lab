# 設定

## 共通手順 (Windows / macOS / Linux)

### 1. 設定ディレクトリの作成

ホームディレクトリに `.codex` フォルダを作成します。

- macOS / Linux: `~/.codex`
- Windows: `C:\\Users\\<ユーザー名>\\.codex`

### 2. `config.toml` を作成

`.codex` 内に `config.toml` を作成し、以下を貼り付けます。

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

必要に応じて `model` の値を変更できます。

### 3. `auth.json` を作成

同じフォルダに `auth.json` を作成します。

```json
{
  "OPENAI_API_KEY": "test"
}
```

購読後に本物のキーへ置き換えてください。

### 4. Codex CLI を起動

プロジェクトディレクトリに移動し、`codex` を実行します。

```bash
cd your-project
codex
```

正しく設定されていれば、以下のような出力が表示され、サーバーと通信できていることがわかります。

![](/codex_test.png)

初回接続時に次のようなメッセージが表示されることがありますが、正常な動作です。

```
unexpected status 403 Forbidden: {"error":{"message":"Hello! How can I help you with your software engineering tasks today?"}}
```

### 5. サブスクリプションと API キー

[pricing](/#pricing) ページでサブスクリプションを購入してください。購入後はダッシュボードで複数の API キーを作成し、各キーに個別のクォータや有効期限を設定してチームと共有できます。

![](/create_api_key.png)

コピーアイコンをクリックするとキーがクリップボードに保存されます。

![](/copy_api_key.png)

`auth.json` を実際のキーで更新します。

```json
{
  "OPENAI_API_KEY": "sk-proj-xxxxxxx"
}
```

### 6. VS Code で利用する

VS Code マーケットプレイスで Codex 公式拡張機能をインストールしてください（公式バッジを確認）。

![](/vscode_codex.png)

拡張機能は `config.toml` と `auth.json` を自動的に読み込むため、追加の設定は不要です。もし設定エラーが出た場合は上記手順を再確認してください。
