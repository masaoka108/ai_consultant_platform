# OpenAI Realtime API統合 実装プラン

## 概要
既存のConsultantDetailPageをOpenAI Realtime APIによるWebRTC音声対話システムに変換する。段階的実装により、テスト駆動開発を採用し、各段階で動作確認を行いながら進める。

---

## フェーズ1: 基盤構築とToken Service実装

### - [ ] 1.1 環境変数とプロジェクト設定の準備
**目的**: WebRTC統合に必要な基本設定とToken Serviceの準備
**実装内容**:
- `.env`ファイルに`VITE_TOKEN_SERVICE_URL`環境変数を追加
- `vite.config.ts`でプロキシ設定を追加してToken Service(`/session`エンドポイント)との通信を可能にする
- TypeScript設定でWebRTC型定義を追加
- ESLint設定でWebRTC関連のグローバル変数を追加

**作成/変更ファイル**:
- `.env` (新規作成)
- `vite.config.ts` (プロキシ設定追加)
- `tsconfig.json` (WebRTC型定義追加)

**テスト方法**: 環境変数が正しく読み込まれることを確認
_Requirements: REQ-4.1_

### - [ ] 1.2 WebRTC基本型定義の実装
**目的**: WebRTC関連の型安全性を確保する型定義を追加
**実装内容**:
- `src/types/webrtc.ts`を新規作成
- EphemeralToken、WebRTCConfig、RealtimeSession、MediaStreamInfo インターフェースを定義
- 既存の`src/types/index.ts`にWebRTC型をエクスポート追加
- RealtimeMessage型で既存Message型を拡張

**作成/変更ファイル**:
- `src/types/webrtc.ts` (新規作成)
- `src/types/index.ts` (エクスポート追加)

**テスト方法**: TypeScriptコンパイルエラーがないことを確認
_Requirements: REQ-2.1.1, REQ-4.4_

### - [ ] 1.3 EphemeralTokenManagerクラスの実装
**目的**: OpenAI公式仕様に準拠したEphemeral Token管理機能
**実装内容**:
- `src/services/EphemeralTokenManager.ts`を新規作成
- OpenAI公式ドキュメントの`fetch("/session")`パターンに基づく実装
- トークン有効期限管理(1分間)とキャッシュ機能
- 自動更新とエラーハンドリング機能

**作成/変更ファイル**:
- `src/services/EphemeralTokenManager.ts` (新規作成)

**テスト方法**: 
- Token取得とキャッシュ機能をテスト
- 期限切れ検出とrefresh機能をテスト

```typescript
// テスト例
const tokenManager = new EphemeralTokenManager('/session');
const token1 = await tokenManager.getEphemeralToken();
expect(token1).toMatch(/^ephemeral_.+/);
```
_Requirements: REQ-4.1.1, REQ-3.3.1_

### - [ ] 1.4 Token Serviceサーバーサイド実装
**目的**: OpenAI公式Node.js Expressサンプルに基づくToken Service
**実装内容**:
- `server/tokenService.js`を新規作成
- OpenAI公式ドキュメントのExpress実装をそのまま採用
- `/session` GET エンドポイントの実装
- 環境変数`OPENAI_API_KEY`でOpenAI APIとの連携

**作成/変更ファイル**:
- `server/tokenService.js` (新規作成)
- `package.json` (server用スクリプト追加)

**テスト方法**: 
- `/session`エンドポイントが正常にEphemeral Tokenを返すことを確認
- OPENAI_API_KEYが正しく使用されることを確認

_Requirements: REQ-3.3.1, REQ-8.3.1_

---

## フェーズ2: WebRTC接続管理実装

### - [ ] 2.1 WebRTCManagerクラス基盤実装
**目的**: OpenAI公式WebRTC実装パターンに基づくPeerConnection管理
**実装内容**:
- `src/services/WebRTCManager.ts`を新規作成
- OpenAI公式の`init()`関数実装パターンを採用
- RTCPeerConnection、RTCDataChannel、HTML Audio要素の管理
- 接続状態の監視とイベント処理

**作成/変更ファイル**:
- `src/services/WebRTCManager.ts` (新規作成)

**テスト方法**:
- PeerConnectionが正常に作成されることを確認
- DataChannel("oai-events")が作成されることを確認

```typescript
// テスト例
const webrtcManager = new WebRTCManager();
await webrtcManager.init('ephemeral_key');
expect(webrtcManager.getConnectionState()).toBe('connected');
```
_Requirements: REQ-2.2.1, REQ-2.1.1_

### - [ ] 2.2 SDP Offer/Answer処理実装
**目的**: OpenAI Realtime APIとのWebRTC接続確立
**実装内容**:
- WebRTCManagerに SDP処理メソッドを追加
- `createOffer()` → `setLocalDescription()` → API送信 → `setRemoteDescription()`の流れ
- OpenAI公式エンドポイント `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03` との通信
- Content-Type: application/sdp での送信

**変更ファイル**:
- `src/services/WebRTCManager.ts` (SDP処理追加)

**テスト方法**:
- SDPオファーが正常に生成されることを確認
- OpenAI APIからのSDPアンサーが正常に処理されることを確認

_Requirements: REQ-2.2.1, REQ-3.1.1_

### - [ ] 2.3 ICE接続とDataChannel設定
**目的**: 安定したWebRTC通信の確立
**実装内容**:
- ICE接続状態の監視とイベントハンドリング
- DataChannel("oai-events")でのRealtimeイベント送受信機能
- 接続エラー時の適切なエラーハンドリング
- 接続状態変化の監視とコールバック

**変更ファイル**:
- `src/services/WebRTCManager.ts` (ICE/DataChannel処理追加)

**テスト方法**:
- ICE接続が正常に確立されることを確認
- DataChannelでメッセージ送受信ができることを確認

_Requirements: REQ-2.2.2, REQ-2.5.1_

---

## フェーズ3: 音声処理統合

### - [ ] 3.1 マイク音声取得と権限処理
**目的**: ユーザー音声の安全で確実な取得
**実装内容**:
- `navigator.mediaDevices.getUserMedia()`でマイク取得
- ユーザー権限要求とエラーハンドリング
- MediaStreamTrackの管理とリソース解放
- 音声品質設定とデバイス選択

**変更ファイル**:
- `src/services/WebRTCManager.ts` (音声取得機能追加)

**テスト方法**:
- マイク権限が正常に取得されることを確認
- MediaStreamが正しく生成されることを確認
- 権限拒否時のエラーハンドリングを確認

_Requirements: REQ-2.1.1, REQ-2.5.2_

### - [ ] 3.2 音声トラック管理とリモート音声受信
**目的**: WebRTCによる双方向音声通信の実現
**実装内容**:
- `addTrack()`でローカル音声をPeerConnectionに追加
- `ontrack`イベントでリモート音声ストリームを受信
- HTML Audio要素での自動音声再生設定
- 音声レベル監視とVAD状態管理

**変更ファイル**:
- `src/services/WebRTCManager.ts` (音声トラック管理追加)

**テスト方法**:
- ローカル音声トラックが正常に送信されることを確認
- リモート音声が自動再生されることを確認
- 音声レベルが正しく取得されることを確認

_Requirements: REQ-2.1.2, REQ-3.1.2_

### - [ ] 3.3 AudioStreamProcessorクラス実装
**目的**: 音声データの詳細制御と可視化
**実装内容**:
- `src/services/AudioStreamProcessor.ts`を新規作成
- Web Audio APIを使用した音声レベル分析
- 音声の可視化用データ生成
- 音量制御とミュート機能
- 音声品質監視機能

**作成ファイル**:
- `src/services/AudioStreamProcessor.ts` (新規作成)

**テスト方法**:
- 音声レベル分析が正常に動作することを確認
- 音量制御とミュート機能をテスト

_Requirements: REQ-2.1.1, REQ-3.1.2_

---

## フェーズ4: RealtimeAPIClient統合

### - [ ] 4.1 RealtimeAPIClientクラス基盤実装
**目的**: WebRTC通信とOpenAI Realtime APIイベントの統合管理
**実装内容**:
- `src/services/RealtimeAPIClient.ts`を新規作成
- EphemeralTokenManagerとWebRTCManagerを統合
- セッション生成、開始、終了のライフサイクル管理
- イベントエミッター機能で状態変化を通知

**作成ファイル**:
- `src/services/RealtimeAPIClient.ts` (新規作成)

**テスト方法**:
- セッション初期化が正常に動作することを確認
- WebRTC接続との統合をテスト

```typescript
// テスト例
const client = new RealtimeAPIClient();
const session = await client.initializeSession('consultant-1');
expect(session.status).toBe('connected');
```
_Requirements: REQ-2.3.1, REQ-2.4.1_

### - [ ] 4.2 Realtime APIイベント処理実装
**目的**: DataChannelでのOpenAI Realtime APIイベント送受信
**実装内容**:
- `session.update`イベントでコンサルタントペルソナ設定
- `response.create`イベントでAI応答生成要求
- `response.audio.delta`、`response.text.delta`イベント受信処理
- `error`イベントのエラーハンドリング

**変更ファイル**:
- `src/services/RealtimeAPIClient.ts` (イベント処理追加)

**テスト方法**:
- 各Realtimeイベントの送受信をテスト
- エラーイベントの適切な処理を確認

_Requirements: REQ-2.3.2, REQ-2.4.2_

### - [ ] 4.3 コンサルタントペルソナ設定実装
**目的**: 既存のコンサルタント情報をOpenAI Realtime APIに反映
**実装内容**:
- `src/data/consultants.ts`の情報をsession.updateのinstructionsに変換
- コンサルタントの専門知識、話し方、業界理解をプロンプト化
- 会話フェーズ(questions, hot-reading, cold-reading等)の管理
- 動的なペルソナ更新機能

**変更ファイル**:
- `src/services/RealtimeAPIClient.ts` (ペルソナ設定追加)
- `src/data/consultants.ts` (必要に応じて拡張)

**テスト方法**:
- コンサルタント情報が正しくAPIに送信されることを確認
- 会話フェーズの切り替えが正常に動作することを確認

_Requirements: REQ-2.4.1, REQ-2.3.2_

---

## フェーズ5: UI統合とConsultantDetailPage改修

### - [ ] 5.1 RealtimeVoiceControlsコンポーネント実装
**目的**: WebRTC音声対話用のUIコンポーネント
**実装内容**:
- `src/components/RealtimeVoiceControls.tsx`を新規作成
- 通話開始/終了、ミュート、音量調整ボタン
- 接続状態表示とエラー通知
- 音声レベルビジュアライザー
- フォールバックモード表示

**作成ファイル**:
- `src/components/RealtimeVoiceControls.tsx` (新規作成)

**テスト方法**:
- 各ボタンの動作をユニットテスト
- 状態表示が正しく更新されることを確認

```typescript
// テスト例
render(<RealtimeVoiceControls onStartCall={mockStart} />);
fireEvent.click(screen.getByText('通話開始'));
expect(mockStart).toHaveBeenCalled();
```
_Requirements: REQ-5.1.1, REQ-5.2.1_

### - [ ] 5.2 WebRTC状態管理Hook実装
**目的**: WebRTC関連状態のReact Hook化
**実装内容**:
- `src/hooks/useRealtimeConnection.ts`を新規作成
- RealtimeAPIClientとの連携Hook
- 接続状態、音声状態、エラー状態の管理
- useEffect でのリソース管理とクリーンアップ

**作成ファイル**:
- `src/hooks/useRealtimeConnection.ts` (新規作成)

**テスト方法**:
- Hook の状態変化をReact Testing Libraryでテスト
- リソースのクリーンアップが正常に動作することを確認

_Requirements: REQ-4.4.1, REQ-2.3.1_

### - [ ] 5.3 ConsultantDetailPage WebRTC統合
**目的**: 既存のConsultantDetailPageをWebRTC対応に改修
**実装内容**:
- 既存の音声ファイル再生機能を段階的にWebRTC機能に置き換え
- `useRealtimeConnection` Hook の統合
- 既存のUIレイアウトを維持しつつWebRTCコンポーネントを追加
- フォールバック機能でモック音声との切り替えを実装

**変更ファイル**:
- `src/pages/ConsultantDetailPage.tsx` (WebRTC統合)

**テスト方法**:
- 既存機能が破綻しないことを確認
- WebRTC機能が正常に動作することを確認
- フォールバック機能をテスト

_Requirements: REQ-5.4.1, REQ-2.5.1_

### - [ ] 5.4 メッセージ履歴WebRTC対応
**目的**: WebRTC音声対話の履歴をテキスト化して表示
**実装内容**:
- `response.text.delta`イベントからのテキスト蓄積
- 既存のMessage型との互換性維持
- RealtimeMessage型での音声メタデータ保存
- 履歴画面でのWebRTC対話データ表示

**変更ファイル**:
- `src/pages/ConsultantDetailPage.tsx` (メッセージ履歴更新)
- `src/pages/HistoryPage.tsx` (WebRTC履歴対応)

**テスト方法**:
- 音声対話がテキスト履歴に正しく記録されることを確認
- 履歴画面での表示をテスト

_Requirements: REQ-5.4.2, REQ-3.4.1_

---

## フェーズ6: エラーハンドリングとフォールバック実装

### - [ ] 6.1 FallbackHandlerクラス実装
**目的**: WebRTC接続エラー時の自動フォールバック機能
**実装内容**:
- `src/services/FallbackHandler.ts`を新規作成
- WebRTC接続エラーの検出とトリガー条件設定
- 自動再接続機能(最大3回)
- モック音声ファイルへのシームレス切り替え
- フォールバックモードでの制限機能説明

**作成ファイル**:
- `src/services/FallbackHandler.ts` (新規作成)

**テスト方法**:
- 接続エラー時のフォールバック動作をテスト
- 再接続試行回数の制限をテスト
- モック音声への切り替えを確認

_Requirements: REQ-2.5.1, REQ-2.5.2_

### - [ ] 6.2 包括的エラーハンドリング実装
**目的**: あらゆるエラーシナリオに対する適切な処理
**実装内容**:
- Token期限切れエラーの自動更新
- ネットワークエラーの段階的リトライ
- マイク権限エラーの代替手段提案
- APIレート制限エラーの待機処理
- ユーザーフレンドリーなエラーメッセージ表示

**変更ファイル**:
- 全てのサービスクラス(エラーハンドリング強化)
- `src/components/ErrorBoundary.tsx` (新規作成)

**テスト方法**:
- 各エラーシナリオでの適切な処理を確認
- エラーメッセージの表示をテスト

_Requirements: REQ-2.5.1, REQ-3.2.2_

### - [ ] 6.3 統合テストとE2Eテスト実装
**目的**: 完全なWebRTC音声対話フローの自動テスト
**実装内容**:
- `tests/integration/webrtc-integration.test.ts`を新規作成
- Token取得からWebRTC接続までの完全フロー
- 音声対話シミュレーションとレスポンス検証
- エラー発生時のフォールバック動作確認
- パフォーマンステスト(レスポンス時間、メモリ使用量)

**作成ファイル**:
- `tests/integration/webrtc-integration.test.ts` (新規作成)
- `tests/e2e/consultant-webrtc.spec.ts` (新規作成)

**テスト方法**:
- 完全な音声コンサルテーションフローを自動テスト
- エラーケースとフォールバック動作をテスト

_Requirements: REQ-6.1.1, REQ-6.2.1_

---

## 完了条件と検証項目

### 機能的検証
- [ ] Ephemeral Token が正常に取得され、1分間の有効期限が管理される
- [ ] WebRTC接続がOpenAI Realtime APIと正常に確立される
- [ ] マイク音声が正常に送信され、AI音声が自動再生される
- [ ] DataChannelでRealtimeイベントが正常に送受信される
- [ ] コンサルタントペルソナが正しくAIに反映される
- [ ] 接続エラー時に自動的にモック音声にフォールバックする
- [ ] 音声対話内容がテキスト履歴に正しく記録される

### 技術的検証
- [ ] TypeScript エラーが存在しない
- [ ] ESLint チェックが通る
- [ ] 全単体テストが通る
- [ ] 統合テストが通る
- [ ] E2Eテストが通る
- [ ] メモリリークが発生しない
- [ ] パフォーマンスが要件(音声遅延<800ms)を満たす

### セキュリティ検証
- [ ] 標準APIキーがクライアントに露出しない
- [ ] Ephemeral Tokenが適切に管理される
- [ ] HTTPS通信が強制される
- [ ] 音声データが適切に保護される

---

**作成日**: 2025年8月11日  
**言語**: 日本語  
**総タスク数**: 23タスク  
**推定実装期間**: 6週間 (フェーズ別実装)

**次のステップ**: 各フェーズを順次実装し、各段階で動作確認とテストを実行してください。