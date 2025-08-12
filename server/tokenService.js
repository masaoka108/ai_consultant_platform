/**
 * OpenAI公式Node.js Expressサンプルに基づくToken Service
 * Ephemeral Tokenを生成してクライアントに提供
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS設定 (開発環境用)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'], // Viteのデフォルトポート
  credentials: true
}));

app.use(express.json());

/**
 * OpenAI公式の/sessionエンドポイント実装
 * Ephemeral Tokenを生成して返却
 */
app.get('/session', async (req, res) => {
  try {
    // 環境変数からOpenAI API keyを取得
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured on server'
      });
    }

    // OpenAI Realtime API session endpoint
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // model: 'gpt-4o-realtime-preview-2024-10-01',
        model: 'gpt-4o-mini-realtime-preview-2024-12-17',
        voice: 'alloy'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', response.status, errorData);
      return res.status(response.status).json({
        error: 'Failed to create session with OpenAI',
        details: errorData
      });
    }

    const sessionData = await response.json();
    
    // セッション生成成功ログ
    console.log(`📅 New session created: ${sessionData.id}`);
    console.log(`🔑 Token issued: ${sessionData.client_secret?.value?.substring(0, 10)}...`);
    console.log(`⏰ Expires at: ${new Date(sessionData.client_secret?.expires_at * 1000).toISOString()}`);
    
    // クライアントに必要な情報のみを返却 (セキュリティ確保)
    res.json({
      token: sessionData.client_secret.value,
      expires_at: sessionData.client_secret.expires_at,
      created_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token service error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * サーバー状態確認用のヘルスチェックエンドポイント
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'OpenAI Realtime Token Service',
    timestamp: new Date().toISOString(),
    environment: {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

/**
 * 開発環境用のルート情報
 */
app.get('/', (req, res) => {
  res.json({
    message: 'OpenAI Realtime Token Service',
    endpoints: [
      'GET /session - Get ephemeral token',
      'GET /health - Health check',
      'GET / - This message'
    ],
    documentation: 'https://platform.openai.com/docs/guides/realtime'
  });
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Token Service running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Session endpoint: http://localhost:${PORT}/session`);
  
  // 環境変数チェック
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set - service will not work properly');
    console.warn('   Please set OPENAI_API_KEY environment variable');
  }
});