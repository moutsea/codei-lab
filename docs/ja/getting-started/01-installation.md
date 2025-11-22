# インストールガイド

### ステップ1: Node.js をインストール

Node.js は Chrome の V8 エンジン上に構築された JavaScript ランタイムで、サーバーサイドスクリプトやスケーラブルなネットワークアプリを構築できます。

公式サイト (https://nodejs.org) からインストーラーをダウンロードし、セットアップウィザードに従ってインストールしてください。

macOS では Homebrew、Linux では apt などのパッケージマネージャーを利用することもできます。

#### macOS (Homebrew) の場合

```bash
brew install node
```

#### Linux (apt) の場合

```bash
sudo apt install nodejs
sudo apt install npm
```

#### Windows の場合

1. [nodejs.org](https://nodejs.org/en) にアクセスします。
2. LTS (安定版) もしくは Current (最新機能) を選択します。
3. ダウンロードした .msi ファイルを実行し、ウィザードに従います。
4. 環境変数は自動で設定され、npm も同時にインストールされます。

インストール後、ターミナルでバージョンを確認してください。

```bash
node -v
npm -v
```

### ステップ2: OpenAI Codex CLI をインストール

`openai-codex` は OpenAI Codex モデルとやり取りするための Node.js パッケージです。次のコマンドでインストールします。

```bash
npm install -g @openai/codex
```

最後にバージョンを確認してインストールを検証します。

```bash
codex --version
```
