import { EphemeralToken } from '../types/webrtc';

/**
 * OpenAI公式仕様に準拠したEphemeralToken管理クラス
 * 1分間の有効期限を持つトークンの取得、キャッシュ、自動更新を管理
 */
export class EphemeralTokenManager {
  private tokenCache: EphemeralToken | null = null;
  private tokenServiceUrl: string;
  private refreshPromise: Promise<EphemeralToken> | null = null;

  constructor(tokenServiceUrl: string = '/session') {
    this.tokenServiceUrl = tokenServiceUrl;
  }

  /**
   * Ephemeral Tokenを取得 (キャッシュされた有効なトークンがあれば返却)
   */
  async getEphemeralToken(): Promise<string> {
    // キャッシュされたトークンが有効かチェック
    if (this.tokenCache && this.isTokenValid(this.tokenCache)) {
      return this.tokenCache.token;
    }

    // 既に更新処理が実行中の場合は待機
    if (this.refreshPromise) {
      const token = await this.refreshPromise;
      return token.token;
    }

    // 新しいトークンを取得
    this.refreshPromise = this.fetchNewToken();
    
    try {
      const token = await this.refreshPromise;
      this.tokenCache = token;
      return token.token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * トークンの有効性をチェック
   * 期限の30秒前に無効とみなして自動更新をトリガー
   */
  private isTokenValid(token: EphemeralToken): boolean {
    const expiryTime = new Date(token.expires_at).getTime();
    const currentTime = Date.now();
    const bufferTime = 30 * 1000; // 30秒のバッファ

    return currentTime < (expiryTime - bufferTime);
  }

  /**
   * OpenAI公式のfetch("/session")パターンに基づく新しいトークン取得
   */
  private async fetchNewToken(): Promise<EphemeralToken> {
    try {
      const response = await fetch(this.tokenServiceUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // セキュリティ確保
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Token service error (${response.status}): ${errorText}`
        );
      }

      const tokenData = await response.json();

      // トークン取得成功ログ（本番環境用）
      console.log('✅ Ephemeral token acquired successfully:', {
        tokenPrefix: tokenData.token?.substring(0, 10) + '...',
        expiresAt: new Date(tokenData.expires_at * 1000).toISOString()
      });

      // レスポンス形式の検証
      if (!tokenData.token || !tokenData.expires_at) {
        throw new Error(
          'Invalid token response format: missing token or expires_at'
        );
      }

      // トークン形式の検証（OpenAI実際のフォーマットに基づく）
      if (tokenData.token && typeof tokenData.token !== 'string') {
        throw new Error(
          'Invalid token format: token must be a string'
        );
      }

      // OpenAI Realtime APIの実際のトークン形式は 'ek_' で始まる
      if (!tokenData.token.startsWith('ek_')) {
        throw new Error(
          `Invalid token format: expected to start with "ek_", got "${tokenData.token.substring(0, 10)}..."`
        );
      }

      return {
        token: tokenData.token,
        expires_at: tokenData.expires_at,
        created_at: tokenData.created_at || new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch ephemeral token: ${error.message}`);
      }
      throw new Error('Unknown error occurred while fetching ephemeral token');
    }
  }

  /**
   * トークンキャッシュをクリア
   */
  clearCache(): void {
    this.tokenCache = null;
    this.refreshPromise = null;
  }

  /**
   * 現在のトークンの有効期限までの残り時間を秒で取得
   */
  getTimeUntilExpiry(): number {
    if (!this.tokenCache) {
      return 0;
    }

    const expiryTime = new Date(this.tokenCache.expires_at).getTime();
    const currentTime = Date.now();
    const remainingTime = Math.max(0, expiryTime - currentTime);

    return Math.floor(remainingTime / 1000);
  }

  /**
   * トークンの強制更新
   */
  async forceRefresh(): Promise<string> {
    this.clearCache();
    return await this.getEphemeralToken();
  }

  /**
   * デバッグ用: 現在のトークン情報を取得
   */
  getCurrentTokenInfo(): {
    hasToken: boolean;
    isValid: boolean;
    expiresAt?: string;
    timeUntilExpiry?: number;
  } {
    if (!this.tokenCache) {
      return { hasToken: false, isValid: false };
    }

    return {
      hasToken: true,
      isValid: this.isTokenValid(this.tokenCache),
      expiresAt: this.tokenCache.expires_at,
      timeUntilExpiry: this.getTimeUntilExpiry(),
    };
  }
}