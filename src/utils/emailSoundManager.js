/**
 * 邮件音效管理系统
 * 提供邮件发送、接收等操作的音效播放功能
 */

class EmailSoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.5;

    // 加载音效配置
    this.loadSoundConfig();
  }

  /**
   * 加载音效配置
   */
  loadSoundConfig() {
    // 使用 Web Audio API 生成简单的提示音
    // 这样可以避免依赖外部音频文件
    this.audioContext = null;

    // 检查浏览器是否支持 Web Audio API
    if (typeof AudioContext !== 'undefined') {
      this.audioContext = new AudioContext();
    } else if (typeof webkitAudioContext !== 'undefined') {
      this.audioContext = new webkitAudioContext();
    }
  }

  /**
   * 生成发送邮件音效（上升音调）
   */
  playSendSound() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 设置音调从低到高
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      800,
      this.audioContext.currentTime + 0.1
    );

    // 设置音量渐变
    gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.15
    );

    oscillator.type = 'sine';
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  /**
   * 生成接收邮件音效（双音调）
   */
  playReceiveSound() {
    if (!this.enabled || !this.audioContext) return;

    // 第一个音符
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();

    osc1.connect(gain1);
    gain1.connect(this.audioContext.destination);

    osc1.frequency.setValueAtTime(600, this.audioContext.currentTime);
    gain1.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.1
    );

    osc1.type = 'sine';
    osc1.start(this.audioContext.currentTime);
    osc1.stop(this.audioContext.currentTime + 0.1);

    // 第二个音符（稍高）
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();

    osc2.connect(gain2);
    gain2.connect(this.audioContext.destination);

    osc2.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.1);
    gain2.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.25
    );

    osc2.type = 'sine';
    osc2.start(this.audioContext.currentTime + 0.1);
    osc2.stop(this.audioContext.currentTime + 0.25);
  }

  /**
   * 生成通知音效（三音调）
   */
  playNotificationSound() {
    if (!this.enabled || !this.audioContext) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const duration = 0.15;

    notes.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      const startTime = this.audioContext.currentTime + (index * duration);
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(this.volume * 0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        startTime + duration
      );

      osc.type = 'sine';
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * 生成错误音效（低音）
   */
  playErrorSound() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.2
    );

    oscillator.type = 'sawtooth';
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 启用/禁用音效
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * 获取音效状态
   */
  isEnabled() {
    return this.enabled;
  }
}

// 创建单例实例
const emailSoundManager = new EmailSoundManager();

export default emailSoundManager;

// 导出便捷方法
export const playSendSound = () => emailSoundManager.playSendSound();
export const playReceiveSound = () => emailSoundManager.playReceiveSound();
export const playNotificationSound = () => emailSoundManager.playNotificationSound();
export const playErrorSound = () => emailSoundManager.playErrorSound();
export const setEmailSoundVolume = (volume) => emailSoundManager.setVolume(volume);
export const setEmailSoundEnabled = (enabled) => emailSoundManager.setEnabled(enabled);
