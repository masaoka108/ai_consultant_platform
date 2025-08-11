import { AudioProcessingConfig, VoiceActivityDetection } from '../types/webrtc';

/**
 * 音声ストリームの詳細処理と可視化クラス
 * Web Audio APIを使用した高度な音声制御を提供
 */
export class AudioStreamProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;
  
  private config: AudioProcessingConfig;
  private isProcessing: boolean = false;
  private vadThreshold: number = 0.01;
  private vadConsecutiveFrames: number = 3;
  private vadFrameCount: number = 0;
  private lastVadState: boolean = false;

  // 可視化用データ
  private frequencyData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;
  
  // イベントハンドラー
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor(config: Partial<AudioProcessingConfig> = {}) {
    this.config = {
      sampleRate: config.sampleRate || 24000,
      channelCount: config.channelCount || 1,
      bufferSize: config.bufferSize || 2048,
      echoCancellation: config.echoCancellation !== false,
      noiseSuppression: config.noiseSuppression !== false,
      autoGainControl: config.autoGainControl !== false,
    };
  }

  /**
   * 音声処理の初期化
   */
  async initialize(): Promise<void> {
    try {
      // AudioContextを作成
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive'
      });

      // Analyserノードを設定
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.bufferSize;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      // Gainノードを設定
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      // MediaStreamDestinationを作成
      this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();

      // データ配列を初期化
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

      this.emit('initialized', {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state
      });

    } catch (error) {
      this.emit('error', {
        type: 'initialization_error',
        message: error instanceof Error ? error.message : 'Failed to initialize audio processor'
      });
      throw error;
    }
  }

  /**
   * 音声ストリームの処理を開始
   */
  startProcessing(inputStream: MediaStream): MediaStream {
    if (!this.audioContext || !this.analyser || !this.gainNode || !this.mediaStreamDestination) {
      throw new Error('AudioStreamProcessor not initialized');
    }

    try {
      // 入力ストリームを接続
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(inputStream);
      
      // 音声処理チェーンを構築: Input -> Analyser -> Gain -> Output
      this.mediaStreamSource.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.mediaStreamDestination);

      this.isProcessing = true;
      this.startAnalysis();

      this.emit('processingstarted', {
        inputTracks: inputStream.getTracks().length,
        outputTracks: this.mediaStreamDestination.stream.getTracks().length
      });

      return this.mediaStreamDestination.stream;

    } catch (error) {
      this.emit('error', {
        type: 'processing_start_error',
        message: error instanceof Error ? error.message : 'Failed to start processing'
      });
      throw error;
    }
  }

  /**
   * リアルタイム音声分析の開始
   */
  private startAnalysis(): void {
    if (!this.isProcessing || !this.analyser || !this.frequencyData || !this.timeData) {
      return;
    }

    const analyze = () => {
      if (!this.isProcessing || !this.analyser || !this.frequencyData || !this.timeData) {
        return;
      }

      // 周波数ドメインデータを取得
      this.analyser.getByteFrequencyData(this.frequencyData);
      // 時間ドメインデータを取得
      this.analyser.getByteTimeDomainData(this.timeData);

      // 音声レベル分析
      const audioLevel = this.calculateAudioLevel(this.frequencyData);
      const rmsLevel = this.calculateRMSLevel(this.timeData);
      
      // Voice Activity Detection
      const vad = this.performVAD(rmsLevel);

      // 可視化データを生成
      const visualizationData = this.generateVisualizationData(this.frequencyData, this.timeData);

      this.emit('audioanalysis', {
        audioLevel,
        rmsLevel,
        vad,
        visualization: visualizationData,
        timestamp: Date.now()
      });

      // 次のフレームを予約
      requestAnimationFrame(analyze);
    };

    analyze();
  }

  /**
   * 音声レベルの計算
   */
  private calculateAudioLevel(frequencyData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i];
    }
    return Math.round((sum / frequencyData.length / 255) * 100);
  }

  /**
   * RMSレベルの計算
   */
  private calculateRMSLevel(timeData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / timeData.length);
  }

  /**
   * Voice Activity Detection (VAD)
   */
  private performVAD(rmsLevel: number): VoiceActivityDetection {
    const isActive = rmsLevel > this.vadThreshold;
    
    // 連続フレームでのVAD判定を行う
    if (isActive) {
      this.vadFrameCount++;
    } else {
      this.vadFrameCount = 0;
    }

    const vadActive = this.vadFrameCount >= this.vadConsecutiveFrames;
    const stateChanged = vadActive !== this.lastVadState;
    
    if (stateChanged) {
      this.lastVadState = vadActive;
      this.emit('vadstatechange', { isActive: vadActive, rmsLevel, confidence: rmsLevel / this.vadThreshold });
    }

    return {
      isActive: vadActive,
      confidence: Math.min(rmsLevel / this.vadThreshold, 1.0),
      audioLevel: Math.round(rmsLevel * 100),
      timestamp: Date.now()
    };
  }

  /**
   * 可視化データの生成
   */
  private generateVisualizationData(frequencyData: Uint8Array, timeData: Uint8Array): {
    frequency: number[];
    waveform: number[];
    spectrum: number[];
  } {
    // 周波数スペクトラムを正規化
    const frequency = Array.from(frequencyData).map(value => value / 255);
    
    // 波形データを正規化
    const waveform = Array.from(timeData).map(value => (value - 128) / 128);
    
    // スペクトラム（低/中/高域の平均）
    const spectrum = [
      this.calculateBandAverage(frequencyData, 0, 4),      // 低域
      this.calculateBandAverage(frequencyData, 4, 16),     // 中域  
      this.calculateBandAverage(frequencyData, 16, 64)     // 高域
    ];

    return { frequency, waveform, spectrum };
  }

  /**
   * 周波数帯域の平均値計算
   */
  private calculateBandAverage(data: Uint8Array, startBin: number, endBin: number): number {
    let sum = 0;
    const actualEnd = Math.min(endBin, data.length);
    
    for (let i = startBin; i < actualEnd; i++) {
      sum += data[i];
    }
    
    return sum / (actualEnd - startBin) / 255;
  }

  /**
   * 音量制御
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      const clampedVolume = Math.max(0, Math.min(2, volume)); // 0-200%
      this.gainNode.gain.setValueAtTime(clampedVolume, this.audioContext?.currentTime || 0);
      
      this.emit('volumechanged', { volume: clampedVolume });
    }
  }

  /**
   * ミュート制御
   */
  setMuted(muted: boolean): void {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : 1, this.audioContext?.currentTime || 0);
      
      this.emit('mutestatechanged', { muted });
    }
  }

  /**
   * VAD閾値の設定
   */
  setVADThreshold(threshold: number): void {
    this.vadThreshold = Math.max(0.001, Math.min(0.1, threshold));
    this.emit('vadthresholdchanged', { threshold: this.vadThreshold });
  }

  /**
   * ノイズゲートの追加
   */
  enableNoiseGate(threshold: number = 0.01, ratio: number = 10): void {
    if (!this.audioContext || !this.mediaStreamSource || !this.gainNode) return;

    // DynamicsCompressorでノイズゲートを実装
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-40, this.audioContext.currentTime);
    compressor.knee.setValueAtTime(0, this.audioContext.currentTime);
    compressor.ratio.setValueAtTime(ratio, this.audioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

    // 音声チェーンを再構築
    this.mediaStreamSource.disconnect();
    this.mediaStreamSource.connect(this.analyser!);
    this.analyser!.connect(compressor);
    compressor.connect(this.gainNode);

    this.emit('noisegateenabled', { threshold, ratio });
  }

  /**
   * 音声品質統計の取得
   */
  getAudioStats(): {
    isProcessing: boolean;
    sampleRate: number;
    contextState: AudioContextState;
    currentTime: number;
  } | null {
    if (!this.audioContext) return null;

    return {
      isProcessing: this.isProcessing,
      sampleRate: this.audioContext.sampleRate,
      contextState: this.audioContext.state,
      currentTime: this.audioContext.currentTime
    };
  }

  /**
   * 処理の停止
   */
  stopProcessing(): void {
    this.isProcessing = false;
    
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    this.emit('processingstopped', {});
  }

  /**
   * リソースのクリーンアップ
   */
  async cleanup(): Promise<void> {
    this.stopProcessing();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.gainNode = null;
    this.mediaStreamDestination = null;
    this.frequencyData = null;
    this.timeData = null;
    
    this.eventHandlers.clear();

    this.emit('cleanup', {});
  }

  // イベントエミッター機能
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in AudioStreamProcessor event handler for ${event}:`, error);
        }
      });
    }
  }
}