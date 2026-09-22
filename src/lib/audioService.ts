// Web Audio API Synthesizer for Muscat Duty Free Operational Alerts
import { SoundTone } from '../types';

export interface SoundOptionInfo {
  id: SoundTone;
  nameEn: string;
  nameAr: string;
  category: 'chime' | 'alarm' | 'subtle';
  descriptionAr: string;
  descriptionEn: string;
}

export const AVAILABLE_SOUNDS: SoundOptionInfo[] = [
  {
    id: 'chime_dual',
    nameEn: 'Dual Harmonic Chime (MDF Signature)',
    nameAr: 'جرس المطار المزدوج (النغمة الرسمية)',
    category: 'chime',
    descriptionAr: 'نغمة جرس ثنائية متناغمة تنبيهية وواضحة جداً في الصالات',
    descriptionEn: 'Official dual-tone airport chime with high acoustic clarity'
  },
  {
    id: 'bell_soft',
    nameEn: 'Soft Airport Bell',
    nameAr: 'جرس المطار الهادئ',
    category: 'chime',
    descriptionAr: 'نغمة هادئة ومريحة للإشعارات المتكررة',
    descriptionEn: 'Gentle and soothing chime for frequent passenger calls'
  },
  {
    id: 'melody_up',
    nameEn: 'Ascending Tri-Tone',
    nameAr: 'نغمة الصعود الثلاثية',
    category: 'chime',
    descriptionAr: 'ثلاث نغمات متصاعدة سريعة تجذب الانتباه الفوري',
    descriptionEn: 'Quick 3-step upbeat chime for immediate awareness'
  },
  {
    id: 'chime_classic',
    nameEn: 'Classic Airport Ding-Dong',
    nameAr: 'جرس دينغ-دونغ الكلاسيكي',
    category: 'chime',
    descriptionAr: 'نغمة إعلان المسافرين الكلاسيكية بالمطارات',
    descriptionEn: 'Iconic airport terminal ding-dong broadcast tone'
  },
  {
    id: 'siren_tech',
    nameEn: 'Tech Dual Pulse Siren',
    nameAr: 'إنذار تقني مزدوج النبضات',
    category: 'alarm',
    descriptionAr: 'نغمة إنذار إلكترونية مميزة لأعطال الأجهزة والكمبيوتر',
    descriptionEn: 'Distinct digital siren pulse for IT and POS terminals'
  },
  {
    id: 'beep_urgent',
    nameEn: 'Urgent Triple Beep',
    nameAr: 'صافرة ثلاثية عاجلة',
    category: 'alarm',
    descriptionAr: 'صافرات سريعة وقوية للحالات الطارئة جداً',
    descriptionEn: 'High-urgency rapid 3-beep emergency pattern'
  },
  {
    id: 'pulse_alert',
    nameEn: 'Digital Radar Pulse',
    nameAr: 'نبضات رادار إلكترونية',
    category: 'alarm',
    descriptionAr: 'نغمة موجية متتالية للنداءات العاجلة',
    descriptionEn: 'Continuous radar sweep pulse for priority calls'
  },
  {
    id: 'high_pitch',
    nameEn: 'High-Pitch Attention Strobe',
    nameAr: 'تنبيه حاد مرتفع التردد',
    category: 'alarm',
    descriptionAr: 'صوت عالي التردد لا يمكن تفويته حتى في الضوضاء',
    descriptionEn: 'Piercing high-frequency tone for loud departure areas'
  },
  {
    id: 'subtle_ping',
    nameEn: 'Clean Modern Ping',
    nameAr: 'نغمة نقر رقمية ناعمة',
    category: 'subtle',
    descriptionAr: 'صوت نقر زجاجي لطيف للإشعارات الخفيفة',
    descriptionEn: 'Subtle glass click tone for low-noise environments'
  },
];

class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private isUnlocked: boolean = false;

  constructor() {
    // Add interaction listener to unlock AudioContext on iOS Safari seamlessly
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (!this.isUnlocked) {
          try {
            const ctx = this.getContext();
            if (ctx && ctx.state === 'suspended') {
              ctx.resume();
            }
            this.isUnlocked = true;
          } catch (e) {
            // Ignore pre-interaction errors
          }
        }
      };

      window.addEventListener('click', unlockAudio, { once: true, passive: true });
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (e) {
      console.warn('AudioContext creation note:', e);
      return null;
    }
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Generic play tone method by tone ID with optional repeats
  public playTone(soundType: SoundTone, repeat: number = 1) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      
      const repeats = Math.max(1, Math.min(10, repeat));
      for (let r = 0; r < repeats; r++) {
        const offset = r * 0.9;
        this.renderTone(ctx, soundType, offset);
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Play sound for Customer Assistance / Emergency Help Alert
  public playCustomerAssistanceSound(soundType: SoundTone = 'chime_dual', repeat: number = 1) {
    this.playTone(soundType, repeat);
  }

  // Play sound for IT / PC Support Alert
  public playITSupportSound(soundType: SoundTone = 'siren_tech', repeat: number = 1) {
    this.playTone(soundType, repeat);
  }

  // Play sound for General Notifications
  public playGeneralSound(soundType: SoundTone = 'melody_up', repeat: number = 1) {
    this.playTone(soundType, repeat);
  }

  private renderTone(ctx: AudioContext, soundType: SoundTone, delaySec: number = 0) {
    const now = ctx.currentTime + delaySec;

    switch (soundType) {
      case 'bell_soft':
        this.playSineTone(ctx, 587.33, now, 0.4, 0.5); // D5
        this.playSineTone(ctx, 880.00, now + 0.15, 0.6, 0.5); // A5
        break;

      case 'melody_up':
        this.playSineTone(ctx, 523.25, now, 0.15, 0.4); // C5
        this.playSineTone(ctx, 659.25, now + 0.12, 0.15, 0.4); // E5
        this.playSineTone(ctx, 783.99, now + 0.24, 0.45, 0.5); // G5
        break;

      case 'chime_classic':
        this.playChimeBell(ctx, 523.25, now, 0.6); // Ding C5
        this.playChimeBell(ctx, 392.00, now + 0.28, 0.8); // Dong G4
        break;

      case 'beep_urgent':
        for (let i = 0; i < 3; i++) {
          this.playSquareTone(ctx, 987.77, now + i * 0.14, 0.08, 0.45); // B5
        }
        break;

      case 'pulse_alert':
        this.playSawTone(ctx, 440, now, 0.18, 0.5);
        this.playSawTone(ctx, 554.37, now + 0.18, 0.18, 0.5);
        this.playSawTone(ctx, 659.25, now + 0.36, 0.28, 0.6);
        break;

      case 'high_pitch':
        for (let i = 0; i < 2; i++) {
          this.playSineTone(ctx, 1200, now + i * 0.2, 0.12, 0.6);
          this.playSineTone(ctx, 1500, now + i * 0.2 + 0.08, 0.12, 0.6);
        }
        break;

      case 'subtle_ping':
        this.playSineTone(ctx, 1046.50, now, 0.08, 0.4); // C6
        this.playSineTone(ctx, 1318.51, now + 0.06, 0.25, 0.3); // E6
        break;

      case 'siren_tech':
        // Dual tech pulse
        this.playSawTone(ctx, 880, now, 0.12, 0.5);
        this.playSawTone(ctx, 440, now + 0.12, 0.12, 0.5);
        this.playSawTone(ctx, 880, now + 0.24, 0.12, 0.5);
        this.playSawTone(ctx, 440, now + 0.36, 0.2, 0.6);
        break;

      case 'chime_dual':
      default:
        // High harmonic bell pairing (MDF Airport Standard)
        this.playChimeBell(ctx, 659.25, now, 0.8); // E5
        this.playChimeBell(ctx, 880.00, now + 0.18, 1.2); // A5
        break;
    }
  }

  private playChimeBell(ctx: AudioContext, freq: number, startTime: number, duration: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const vol = this.masterVolume * 0.65;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), startTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn('Tone chime bell error:', e);
    }
  }

  private playSineTone(ctx: AudioContext, freq: number, startTime: number, duration: number, volFactor: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const vol = this.masterVolume * volFactor;
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn('Sine tone error:', e);
    }
  }

  private playSquareTone(ctx: AudioContext, freq: number, startTime: number, duration: number, volFactor: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      const vol = this.masterVolume * volFactor * 0.3; // Square is loud
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn('Square tone error:', e);
    }
  }

  private playSawTone(ctx: AudioContext, freq: number, startTime: number, duration: number, volFactor: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      const vol = this.masterVolume * volFactor * 0.25;
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn('Saw tone error:', e);
    }
  }
}

export const audioService = new AudioService();
