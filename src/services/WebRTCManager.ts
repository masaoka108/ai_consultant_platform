import { 
  WebRTCConnectionState, 
  WebRTCManagerOptions,
  RealtimeEvent 
} from '../types/webrtc';
import { EphemeralTokenManager } from './EphemeralTokenManager';

/**
 * OpenAI公式WebRTC実装パターンに基づくPeerConnection管理クラス
 * RTCPeerConnection、RTCDataChannel、HTML Audio要素を統合管理
 */
export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private localStream: MediaStream | null = null;
  // private remoteStream: MediaStream | null = null;
  private autoMutedByPlayback: boolean = false;
  
  private tokenManager: EphemeralTokenManager;
  private options: WebRTCManagerOptions;
  private connectionState: WebRTCConnectionState;
  
  // イベントハンドラー
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor(options: Partial<WebRTCManagerOptions> = {}) {
    // デフォルト設定とマージ
    this.options = {
      tokenServiceUrl: options.tokenServiceUrl || '/session',
      realtimeApiUrl: options.realtimeApiUrl || 'https://api.openai.com/v1/realtime',
      model: options.model || 'gpt-4o-realtime-preview-2024-10-01',
      //model: options.model || 'gpt-4o-mini-realtime-preview-2024-12-17',
      audioSampleRate: options.audioSampleRate || 24000,
      enableFallback: options.enableFallback !== undefined ? options.enableFallback : true,
    };

    this.tokenManager = new EphemeralTokenManager(this.options.tokenServiceUrl);
    
    this.connectionState = {
      connectionState: 'new',
      iceConnectionState: 'new',
      iceGatheringState: 'new',
      signalingState: 'stable',
    };
  }

  /**
   * OpenAI公式のinit()関数実装パターン
   * WebRTC接続の初期化とセットアップ
   */
  async init(): Promise<void> {
    try {
      // Ephemeral Tokenを取得
      const ephemeralToken = await this.tokenManager.getEphemeralToken();
      
      // RTCPeerConnectionを作成
      this.createPeerConnection();
      
      // HTML Audio要素を作成・設定
      this.setupAudioElement();
      
      // ローカル音声ストリームを取得
      await this.setupLocalAudioStream();
      
      // DataChannelを作成
      this.createDataChannel();
      
      this.emit('initialized', { token: ephemeralToken });
      
    } catch (error) {
      this.emit('error', { 
        type: 'initialization_error', 
        message: error instanceof Error ? error.message : 'Unknown initialization error' 
      });
      throw error;
    }
  }

  /**
   * RTCPeerConnectionの作成と基本設定
   */
  private createPeerConnection(): void {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced'
    };

    this.peerConnection = new RTCPeerConnection(config);
    this.setupPeerConnectionEventHandlers();
    this.setupAdvancedICEHandling();
  }

  /**
   * PeerConnectionイベントハンドラーの設定
   */
  private setupPeerConnectionEventHandlers(): void {
    if (!this.peerConnection) return;

    // 接続状態の監視
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        this.connectionState.connectionState = this.peerConnection.connectionState;
        this.emit('connectionstatechange', this.connectionState);
        
        if (this.peerConnection.connectionState === 'connected') {
          this.emit('connected', this.connectionState);
        } else if (this.peerConnection.connectionState === 'failed') {
          this.emit('connectionfailed', this.connectionState);
        }
      }
    };

    // ICE接続状態の監視（基本）
    // 詳細なICE処理はsetupAdvancedICEHandling()で行う

    // ICEギャザリング状態の監視
    this.peerConnection.onicegatheringstatechange = () => {
      if (this.peerConnection) {
        this.connectionState.iceGatheringState = this.peerConnection.iceGatheringState;
        this.emit('icegatheringstatechange', this.connectionState);
      }
    };

    // シグナリング状態の監視
    this.peerConnection.onsignalingstatechange = () => {
      if (this.peerConnection) {
        this.connectionState.signalingState = this.peerConnection.signalingState;
        this.emit('signalingstatechange', this.connectionState);
      }
    };

    // リモートストリーム受信（詳細処理）
    this.peerConnection.ontrack = (event) => {
      this.handleRemoteTrack(event);
    };
  }

  /**
   * HTML Audio要素の設定
   */
  private setupAudioElement(): void {
    this.audioElement = document.createElement('audio');
    this.audioElement.autoplay = true;
    // playsInline は型定義上 Audio に存在しないため属性で設定
    this.audioElement.setAttribute('playsinline', 'true');
    
    // 音声再生の詳細イベントハンドリング
    this.setupAudioElementEvents();
  }

  /**
   * Audio要素のイベントハンドリング
   */
  private setupAudioElementEvents(): void {
    if (!this.audioElement) return;

    this.audioElement.onplay = () => {
      this.emit('audioplay', {
        currentTime: this.audioElement?.currentTime,
        duration: this.audioElement?.duration,
        volume: this.audioElement?.volume
      });
      // MediaStream はライブで再生継続するため、ここでは自動ミュートしない
    };

    this.audioElement.onpause = () => {
      this.emit('audiopause', {});
    };

    this.audioElement.onended = () => {
      this.emit('audioended', {});
      // MediaStream の onended は通常接続終了時のみ。ここでは何もしない
    };

    this.audioElement.onvolumechange = () => {
      this.emit('audiovolumechange', {
        volume: this.audioElement?.volume,
        muted: this.audioElement?.muted
      });
    };

    this.audioElement.onerror = (error) => {
      this.emit('audioerror', { 
        error,
        networkState: this.audioElement?.networkState,
        readyState: this.audioElement?.readyState
      });
    };

    this.audioElement.oncanplay = () => {
      this.emit('audiocanplay', {
        readyState: this.audioElement?.readyState
      });
    };

    this.audioElement.onloadstart = () => {
      this.emit('audioloadstart', {});
    };
  }

  /**
   * リモートトラックの詳細処理
   */
  private handleRemoteTrack(event: RTCTrackEvent): void {
    const { track, streams } = event;
    
    this.emit('remotetrack', {
      track,
      kind: track.kind,
      id: track.id,
      label: track.label,
      streams: streams
    });

    if (track.kind === 'audio' && streams && streams[0]) {
      this.handleRemoteAudioStream(streams[0], track);
    }
  }

  /**
   * リモート音声ストリームの処理
   */
  private handleRemoteAudioStream(stream: MediaStream, track: MediaStreamTrack): void {
    // this.remoteStream = stream; // 未使用のため保持しない
    
    // Audio要素に接続
    if (this.audioElement) {
      this.audioElement.srcObject = stream;
    }

    // リモート音声トラックのイベント設定
    this.setupRemoteAudioTrackEvents(track);

    this.emit('remotestream', {
      stream,
      tracks: stream.getTracks(),
      audioTrack: track
    });
  }

  /**
   * リモート音声トラックのイベント設定
   */
  private setupRemoteAudioTrackEvents(track: MediaStreamTrack): void {
    track.onended = () => {
      this.emit('remotetrackended', {
        trackId: track.id,
        kind: track.kind,
        label: track.label
      });
    };

    track.onmute = () => {
      this.emit('remotetrackmuted', {
        trackId: track.id,
        muted: track.muted
      });
    };

    track.onunmute = () => {
      this.emit('remotetrackUnmuted', {
        trackId: track.id,
        muted: track.muted
      });
    };
  }

  /**
   * 音声レベルの監視
   */
  startAudioLevelMonitoring(): void {
    if (!this.localStream) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(this.localStream);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    microphone.connect(analyser);

    const monitorLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // 平均音量を計算
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const volume = Math.round((average / 255) * 100);

      this.emit('audiolevel', {
        level: volume,
        timestamp: Date.now(),
        isActive: volume > 10 // 10% を超えたら音声アクティブとみなす
      });

      // 継続的に監視
      if (this.localStream && this.localStream.getAudioTracks().length > 0) {
        requestAnimationFrame(monitorLevel);
      }
    };

    monitorLevel();
  }

  /**
   * リモート音声の音量制御
   */
  setRemoteAudioVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
      this.emit('remoteaudiovolumechanged', {
        volume: this.audioElement.volume
      });
    }
  }

  /**
   * リモート音声のミュート制御
   */
  setRemoteAudioMuted(muted: boolean): void {
    if (this.audioElement) {
      this.audioElement.muted = muted;
      this.emit('remoteaudiomutedchanged', {
        muted: this.audioElement.muted
      });
    }
  }

  /**
   * 音声出力デバイスの切り替え（対応ブラウザのみ）
   */
  async setSpeakerDevice(deviceId: string): Promise<void> {
    if (this.audioElement && 'setSinkId' in this.audioElement) {
      try {
        await (this.audioElement as any).setSinkId(deviceId);
        this.emit('speakerchanged', { deviceId });
      } catch (error) {
        this.emit('error', {
          type: 'speaker_change_error',
          message: error instanceof Error ? error.message : 'Failed to change speaker'
        });
        throw error;
      }
    } else {
      this.emit('error', {
        type: 'speaker_not_supported',
        message: 'Speaker selection not supported in this browser'
      });
    }
  }

  /**
   * ローカル音声ストリームのセットアップ
   * 詳細な権限処理とデバイス管理
   */
  private async setupLocalAudioStream(): Promise<void> {
    try {
      // 利用可能なデバイスを確認
      const devices = await this.getAvailableAudioDevices();
      this.emit('devicesavailable', devices);

      // 音声制約の設定
      const constraints = this.buildAudioConstraints();

      // マイク権限の確認
      await this.checkMicrophonePermission();

      // 音声ストリームを取得
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 音声トラックの詳細設定
      this.configureAudioTracks(this.localStream);
      
      // PeerConnectionに音声トラックを追加
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      this.emit('localstream', {
        stream: this.localStream,
        tracks: this.localStream.getTracks(),
        constraints: constraints
      });

    } catch (error) {
      await this.handleMicrophoneError(error);
      throw error;
    }
  }

  /**
   * 利用可能な音声デバイスを取得
   */
  private async getAvailableAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      this.emit('error', {
        type: 'device_enumeration_error',
        message: 'Failed to enumerate audio devices'
      });
      return [];
    }
  }

  /**
   * 音声制約の構築
   */
  private buildAudioConstraints(): MediaStreamConstraints {
    return {
      audio: {
        sampleRate: { ideal: this.options.audioSampleRate },
        channelCount: { ideal: 1 },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // 追加の品質設定
        sampleSize: { ideal: 16 }
      },
      video: false
    };
  }

  /**
   * マイク権限の事前確認
   */
  private async checkMicrophonePermission(): Promise<void> {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ 
          name: 'microphone' as PermissionName 
        });
        
        this.emit('permissionstatus', {
          state: permission.state,
          name: 'microphone'
        });

        if (permission.state === 'denied') {
          throw new Error('Microphone permission denied');
        }
      }
    } catch (error) {
      // permissions APIが利用できない場合はスキップ
      console.warn('Permissions API not available:', error);
    }
  }

  /**
   * 音声トラックの詳細設定
   */
  private configureAudioTracks(stream: MediaStream): void {
    stream.getAudioTracks().forEach(track => {
      // トラック終了時のイベントハンドラー
      track.onended = () => {
        this.emit('trackended', {
          trackId: track.id,
          kind: track.kind,
          label: track.label
        });
      };

      // トラック設定の情報を取得
      const settings = track.getSettings();
      const capabilities = track.getCapabilities();
      
      this.emit('trackconfigured', {
        trackId: track.id,
        settings,
        capabilities
      });
    });
  }

  /**
   * マイクエラーの詳細ハンドリング
   */
  private async handleMicrophoneError(error: any): Promise<void> {
    let errorType = 'media_access_error';
    let message = 'Failed to access microphone';
    let suggestions: string[] = [];

    if (error instanceof Error) {
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          errorType = 'permission_denied';
          message = 'Microphone permission denied by user';
          suggestions = [
            'Grant microphone permission in browser settings',
            'Click the microphone icon in the address bar',
            'Reload the page and allow microphone access'
          ];
          break;

        case 'NotFoundError':
        case 'DevicesNotFoundError':
          errorType = 'no_device_found';
          message = 'No microphone device found';
          suggestions = [
            'Connect a microphone to your device',
            'Check microphone hardware connection',
            'Restart your browser'
          ];
          break;

        case 'NotReadableError':
        case 'TrackStartError':
          errorType = 'device_busy';
          message = 'Microphone is being used by another application';
          suggestions = [
            'Close other applications using microphone',
            'Check system audio settings',
            'Try restarting your browser'
          ];
          break;

        case 'OverconstrainedError':
          errorType = 'constraints_error';
          message = 'Requested audio constraints cannot be satisfied';
          suggestions = [
            'Try with different audio quality settings',
            'Check if your microphone supports the required sample rate'
          ];
          break;

        case 'SecurityError':
          errorType = 'security_error';
          message = 'Microphone access blocked due to security policy';
          suggestions = [
            'Ensure site is served over HTTPS',
            'Check browser security settings'
          ];
          break;

        default:
          message = error.message || 'Unknown microphone error';
          break;
      }
    }

    this.emit('error', {
      type: errorType,
      message,
      suggestions,
      originalError: error
    });
  }

  /**
   * マイクの手動切り替え
   */
  async switchMicrophone(deviceId: string): Promise<void> {
    try {
      // 現在のストリームを停止
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }

      // 新しいデバイスでストリームを取得
      const constraints = this.buildAudioConstraints();
      if (constraints.audio && typeof constraints.audio === 'object') {
        (constraints.audio as any).deviceId = { exact: deviceId };
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // PeerConnectionの送信者を更新
      if (this.peerConnection && this.localStream) {
        const audioTrack = this.localStream.getAudioTracks()[0];
        const sender = this.peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'audio'
        );
        
        if (sender && audioTrack) {
          await sender.replaceTrack(audioTrack);
        }
      }

      this.emit('microphonechanged', {
        deviceId,
        stream: this.localStream
      });

    } catch (error) {
      await this.handleMicrophoneError(error);
      throw error;
    }
  }

  /**
   * ミュート/アンミュート制御
   */
  setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });

      this.emit('mutedstatechanged', {
        muted,
        trackCount: this.localStream.getAudioTracks().length
      });
    }
  }

  /**
   * 現在のミュート状態を取得
   */
  isMuted(): boolean {
    if (!this.localStream) return true;
    
    const audioTracks = this.localStream.getAudioTracks();
    return audioTracks.length === 0 || audioTracks.some(track => !track.enabled);
  }

  /**
   * DataChannel("oai-events")の作成
   */
  private createDataChannel(): void {
    if (!this.peerConnection) return;

    this.dataChannel = this.peerConnection.createDataChannel('oai-events', {
      ordered: true,
      maxRetransmits: 3
    });

    this.setupDataChannelEventHandlers();
  }

  /**
   * DataChannelイベントハンドラーの設定
   */
  private setupDataChannelEventHandlers(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      this.emit('datachannelopen', {
        label: this.dataChannel?.label,
        readyState: this.dataChannel?.readyState,
        bufferedAmount: this.dataChannel?.bufferedAmount
      });
    };

    this.dataChannel.onclose = () => {
      this.emit('datachannelclose', {
        label: this.dataChannel?.label
      });
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const realtimeEvent = JSON.parse(event.data) as RealtimeEvent;
        this.handleRealtimeEvent(realtimeEvent);
        this.emit('realtimeevent', realtimeEvent);
      } catch (error) {
        this.emit('error', {
          type: 'datachannel_parse_error',
          message: 'Failed to parse DataChannel message',
          rawData: event.data
        });
      }
    };

    this.dataChannel.onerror = (error) => {
      this.emit('error', {
        type: 'datachannel_error',
        message: 'DataChannel error occurred',
        error: error
      });
    };

    // バッファリング監視
    this.dataChannel.onbufferedamountlow = () => {
      this.emit('bufferedamountlow', {
        bufferedAmount: this.dataChannel?.bufferedAmount
      });
    };
  }

  /**
   * Realtime APIイベントのハンドリング
   */
  private handleRealtimeEvent(event: RealtimeEvent): void {
    switch (event.type) {
      case 'error':
        this.emit('realtimeapierror', event);
        break;
      
      case 'session.created':
        this.emit('sessioncreated', event);
        break;
      
      case 'session.updated':
        this.emit('sessionupdated', event);
        break;
      
      case 'response.audio.delta':
        this.emit('audioresponse', event);
        break;
      
      case 'response.text.delta':
        this.emit('textresponse', event);
        break;
      
      case 'response.done':
        this.emit('responsedone', event);
        break;
      
      case 'input_audio_buffer.speech_started':
        this.emit('speechstarted', event);
        break;
      
      case 'input_audio_buffer.speech_stopped':
        this.emit('speechstopped', event);
        break;
      
      default:
        this.emit('unknownrealtimeevent', event);
        break;
    }
  }

  /**
   * ICE接続の詳細監視とエラーハンドリング
   */
  private setupAdvancedICEHandling(): void {
    if (!this.peerConnection) return;

    // ICE候補の収集
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('icecandidate', {
          candidate: event.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid
        });
      } else {
        // ICE候補の収集が完了
        this.emit('icecandidatescomplete', {});
      }
    };

    // ICE接続エラーの詳細ハンドリング
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.iceConnectionState;
        this.connectionState.iceConnectionState = state;
        
        this.emit('iceconnectionstatechange', {
          state,
          connectionState: this.connectionState
        });

        // ICE接続に関する詳細なエラーハンドリング
        switch (state) {
          case 'connected':
            this.emit('iceconnected', {});
            break;
          
          case 'disconnected':
            this.emit('icedisconnected', {});
            // 再接続を試みる
            this.attemptICERestart();
            break;
          
          case 'failed':
            this.emit('icefailed', {});
            break;
          
          case 'closed':
            this.emit('iceclosed', {});
            break;
        }
      }
    };
  }

  /**
   * ICE再接続の試行
   */
  private async attemptICERestart(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      // ICE再起動を実行
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);
      
      // 新しいオファーを送信（実際の実装では必要に応じてシグナリングサーバーを通す）
      this.emit('icerestartneeded', { offer });
      
    } catch (error) {
      this.emit('error', {
        type: 'ice_restart_error',
        message: error instanceof Error ? error.message : 'ICE restart failed'
      });
    }
  }

  /**
   * DataChannelのバッファリング制御
   */
  setDataChannelBuffering(options: {
    bufferedAmountLowThreshold?: number;
    maxRetransmits?: number;
    maxPacketLifeTime?: number;
  }): void {
    if (this.dataChannel) {
      if (options.bufferedAmountLowThreshold !== undefined) {
        this.dataChannel.bufferedAmountLowThreshold = options.bufferedAmountLowThreshold;
      }
    }
  }

  /**
   * 接続品質の監視
   */
  async getConnectionStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) return null;

    try {
      return await this.peerConnection.getStats();
    } catch (error) {
      this.emit('error', {
        type: 'stats_error',
        message: error instanceof Error ? error.message : 'Failed to get connection stats'
      });
      return null;
    }
  }

  /**
   * 音声品質の監視
   */
  async getAudioStats(): Promise<{
    inbound?: any;
    outbound?: any;
  }> {
    const stats = await this.getConnectionStats();
    const audioStats: { inbound?: any; outbound?: any; } = {};

    if (stats) {
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
          audioStats.inbound = report;
        } else if (report.type === 'outbound-rtp' && report.mediaType === 'audio') {
          audioStats.outbound = report;
        }
      });
    }

    return audioStats;
  }

  /**
   * OpenAI Realtime APIとのWebRTC接続を確立
   * SDP Offer/Answer交換を実行
   */
  async connectToRealtimeAPI(): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized. Call init() first.');
    }

    try {
      // SDP Offerを作成
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });

      // Local Description を設定
      await this.peerConnection.setLocalDescription(offer);
      
      this.emit('sdpoffercreated', { offer });

      // OpenAI Realtime APIにSDP Offerを送信
      const sdpAnswer = await this.sendSDPOfferToAPI(offer);
      
      // Remote Description を設定
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription({
          type: 'answer',
          sdp: sdpAnswer
        })
      );

      this.emit('sdpanswereceived', { answer: sdpAnswer });

    } catch (error) {
      this.emit('error', {
        type: 'sdp_exchange_error',
        message: error instanceof Error ? error.message : 'SDP exchange failed'
      });
      throw error;
    }
  }

  /**
   * OpenAI Realtime APIへのSDP Offer送信
   */
  private async sendSDPOfferToAPI(offer: RTCSessionDescriptionInit): Promise<string> {
    try {
      const ephemeralToken = await this.tokenManager.getEphemeralToken();
      
      const url = `${this.options.realtimeApiUrl}?model=${this.options.model}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenAI Realtime API error (${response.status}): ${errorText}`
        );
      }

      const sdpAnswer = await response.text();
      
      if (!sdpAnswer) {
        throw new Error('Empty SDP answer received from OpenAI API');
      }

      return sdpAnswer;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to exchange SDP with OpenAI API: ${error.message}`);
      }
      throw new Error('Unknown error during SDP exchange');
    }
  }

  /**
   * 接続を開始（初期化 + SDP交換）
   */
  async connect(): Promise<void> {
    try {
      // 初期化がまだの場合は実行
      if (!this.peerConnection) {
        await this.init();
      }

      // SDP交換を実行
      await this.connectToRealtimeAPI();

      // 接続完了を待機
      await this.waitForConnection();

    } catch (error) {
      this.emit('error', {
        type: 'connection_error',
        message: error instanceof Error ? error.message : 'Connection failed'
      });
      throw error;
    }
  }

  /**
   * 接続確立まで待機
   */
  private async waitForConnection(timeoutMs: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeoutMs);

      const checkConnection = () => {
        if (this.isConnected()) {
          clearTimeout(timeout);
          resolve();
        }
      };

      // 接続状態の変化を監視
      const handleStateChange = () => {
        if (this.connectionState.connectionState === 'connected' &&
            this.dataChannel?.readyState === 'open') {
          clearTimeout(timeout);
          this.off('connectionstatechange', handleStateChange);
          this.off('datachannelopen', handleStateChange);
          resolve();
        } else if (this.connectionState.connectionState === 'failed') {
          clearTimeout(timeout);
          this.off('connectionstatechange', handleStateChange);
          this.off('datachannelopen', handleStateChange);
          reject(new Error('Connection failed'));
        }
      };

      this.on('connectionstatechange', handleStateChange);
      this.on('datachannelopen', handleStateChange);

      // 既に接続済みかチェック
      checkConnection();
    });
  }

  /**
   * Realtime APIイベントの送信
   */
  sendRealtimeEvent(event: RealtimeEvent): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(event));
      } catch (error) {
        this.emit('error', {
          type: 'send_event_error',
          message: error instanceof Error ? error.message : 'Failed to send event'
        });
      }
    } else {
      this.emit('error', {
        type: 'datachannel_not_ready',
        message: 'DataChannel is not open'
      });
    }
  }

  /**
   * 現在の接続状態を取得
   */
  getConnectionState(): WebRTCConnectionState {
    return { ...this.connectionState };
  }

  /**
   * 接続が確立されているかチェック
   */
  isConnected(): boolean {
    return this.connectionState.connectionState === 'connected' &&
           this.dataChannel?.readyState === 'open';
  }

  /**
   * リソースのクリーンアップ
   */
  async cleanup(): Promise<void> {
    // ローカルストリームのトラックを停止
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // DataChannelを閉じる
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // PeerConnectionを閉じる
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Audio要素をクリーンアップ
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }

    // Token Manager のキャッシュをクリア
    this.tokenManager.clearCache();

    // イベントハンドラーをクリア
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
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}