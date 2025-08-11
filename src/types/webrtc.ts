// OpenAI Realtime API WebRTC Integration Types

export interface EphemeralToken {
  token: string;
  expires_at: string;
  created_at: string;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  bundlePolicy?: RTCBundlePolicy;
}

export interface RealtimeSession {
  id: string;
  object: 'realtime.session';
  model: string;
  expires_at: number;
  modalities: string[];
  instructions: string;
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription: {
    model: string;
  } | null;
  turn_detection: {
    type: string;
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };
  tools: any[];
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: number | 'inf';
}

export interface MediaStreamInfo {
  stream: MediaStream;
  tracks: MediaStreamTrack[];
  deviceId?: string;
  label?: string;
}

export interface WebRTCConnectionState {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  signalingState: RTCSignalingState;
}

export interface RealtimeMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  audioData?: ArrayBuffer;
  transcription?: string;
  metadata?: {
    eventType?: string;
    audioFormat?: string;
    duration?: number;
  };
}

export interface RealtimeEvent {
  type: string;
  event_id?: string;
  [key: string]: any;
}

export interface SessionUpdateEvent extends RealtimeEvent {
  type: 'session.update';
  session: Partial<RealtimeSession>;
}

export interface ResponseCreateEvent extends RealtimeEvent {
  type: 'response.create';
  response: {
    modalities: string[];
    instructions?: string;
  };
}

export interface ResponseAudioDeltaEvent extends RealtimeEvent {
  type: 'response.audio.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string; // base64 encoded audio data
}

export interface ResponseTextDeltaEvent extends RealtimeEvent {
  type: 'response.text.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface ErrorEvent extends RealtimeEvent {
  type: 'error';
  error: {
    type: string;
    code?: string;
    message: string;
    param?: string;
    event_id?: string;
  };
}

// WebRTC Connection Manager Options
export interface WebRTCManagerOptions {
  tokenServiceUrl: string;
  realtimeApiUrl: string;
  model: string;
  audioSampleRate: number;
  enableFallback: boolean;
}

// Audio Processing Types
export interface AudioProcessingConfig {
  sampleRate: number;
  channelCount: number;
  bufferSize: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface VoiceActivityDetection {
  isActive: boolean;
  confidence: number;
  audioLevel: number;
  timestamp: number;
}

// Fallback Handler Types
export interface FallbackState {
  isActive: boolean;
  reason: string;
  retryCount: number;
  maxRetries: number;
  lastAttempt: number;
}

// Connection Pool Types
export interface PeerConnectionPool {
  active: RTCPeerConnection[];
  idle: RTCPeerConnection[];
  maxConnections: number;
  currentConnections: number;
}