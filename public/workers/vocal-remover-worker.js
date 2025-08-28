// Vocal Remover Web Worker
self.onmessage = function(event) {
  const { type, audioBuffer, options } = event.data;
  
  if (type === 'PROCESS_AUDIO') {
    processAudio(audioBuffer, options);
  }
};

async function processAudio(audioBuffer, options) {
  try {
    // Initialize Web Audio API in worker context
    const audioContext = new (self.AudioContext || self.webkitAudioContext)();
    
    // Decode audio data
    const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
    
    // Process based on algorithm
    let result;
    switch (options.algorithm) {
      case 'center-channel':
        result = await centerChannelExtraction(decodedAudio, audioContext);
        break;
      case 'spectral':
        result = await spectralSubtraction(decodedAudio, audioContext);
        break;
      case 'ai-enhanced':
        result = await aiEnhancedSeparation(decodedAudio, audioContext);
        break;
      default:
        throw new Error('Unknown algorithm');
    }
    
    // Convert result to output format
    const outputBuffers = await convertToOutputFormat(result, options);
    
    self.postMessage({
      type: 'COMPLETE',
      data: outputBuffers
    });
    
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      data: { error: error.message }
    });
  }
}

async function centerChannelExtraction(audioBuffer, audioContext) {
  const channels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  
  // Create output buffers
  const vocalsBuffer = audioContext.createBuffer(1, length, sampleRate);
  const instrumentalBuffer = audioContext.createBuffer(channels, length, sampleRate);
  
  const vocalsData = vocalsBuffer.getChannelData(0);
  
  if (channels >= 2) {
    const leftData = audioBuffer.getChannelData(0);
    const rightData = audioBuffer.getChannelData(1);
    const leftOut = instrumentalBuffer.getChannelData(0);
    const rightOut = instrumentalBuffer.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      // Extract center channel (vocals) by taking the common part
      const center = (leftData[i] + rightData[i]) / 2;
      vocalsData[i] = center;
      
      // Create instrumental by subtracting center from each channel
      leftOut[i] = leftData[i] - center * 0.5;
      rightOut[i] = rightData[i] - center * 0.5;
      
      // Update progress
      if (i % 44100 === 0) {
        const progress = (i / length) * 100;
        self.postMessage({
          type: 'PROGRESS',
          data: { progress }
        });
      }
    }
  } else {
    // Mono audio - can't separate vocals effectively
    const monoData = audioBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      vocalsData[i] = monoData[i];
      instrumentalBuffer.getChannelData(0)[i] = monoData[i] * 0.3; // Reduced volume
    }
  }
  
  return {
    vocals: vocalsBuffer,
    instrumental: instrumentalBuffer
  };
}

async function spectralSubtraction(audioBuffer, audioContext) {
  // Simplified spectral subtraction implementation
  // In a real implementation, this would use FFT for frequency domain processing
  
  const channels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  
  const vocalsBuffer = audioContext.createBuffer(1, length, sampleRate);
  const instrumentalBuffer = audioContext.createBuffer(channels, length, sampleRate);
  
  const vocalsData = vocalsBuffer.getChannelData(0);
  
  if (channels >= 2) {
    const leftData = audioBuffer.getChannelData(0);
    const rightData = audioBuffer.getChannelData(1);
    const leftOut = instrumentalBuffer.getChannelData(0);
    const rightOut = instrumentalBuffer.getChannelData(1);
    
    // Apply spectral processing (simplified)
    for (let i = 0; i < length; i++) {
      const left = leftData[i];
      const right = rightData[i];
      
      // Estimate vocals using phase correlation
      const correlation = Math.abs(left - right);
      const vocals = correlation > 0.1 ? (left + right) / 2 : 0;
      
      vocalsData[i] = vocals;
      leftOut[i] = left - vocals * 0.7;
      rightOut[i] = right - vocals * 0.7;
      
      if (i % 44100 === 0) {
        const progress = (i / length) * 100;
        self.postMessage({
          type: 'PROGRESS',
          data: { progress }
        });
      }
    }
  }
  
  return {
    vocals: vocalsBuffer,
    instrumental: instrumentalBuffer
  };
}

async function aiEnhancedSeparation(audioBuffer, audioContext) {
  // Simplified AI-enhanced separation
  // In a real implementation, this would use machine learning models
  
  const channels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  
  const vocalsBuffer = audioContext.createBuffer(1, length, sampleRate);
  const instrumentalBuffer = audioContext.createBuffer(channels, length, sampleRate);
  
  const vocalsData = vocalsBuffer.getChannelData(0);
  
  if (channels >= 2) {
    const leftData = audioBuffer.getChannelData(0);
    const rightData = audioBuffer.getChannelData(1);
    const leftOut = instrumentalBuffer.getChannelData(0);
    const rightOut = instrumentalBuffer.getChannelData(1);
    
    // Enhanced processing with multiple techniques
    for (let i = 0; i < length; i++) {
      const left = leftData[i];
      const right = rightData[i];
      
      // Combine multiple separation techniques
      const centerChannel = (left + right) / 2;
      const sideChannel = (left - right) / 2;
      
      // AI-like processing (simplified heuristics)
      const vocalStrength = Math.abs(centerChannel) / (Math.abs(sideChannel) + 0.001);
      const isVocal = vocalStrength > 2.0;
      
      const vocals = isVocal ? centerChannel : 0;
      const instrumentalGain = isVocal ? 0.3 : 1.0;
      
      vocalsData[i] = vocals;
      leftOut[i] = left * instrumentalGain;
      rightOut[i] = right * instrumentalGain;
      
      if (i % 44100 === 0) {
        const progress = (i / length) * 100;
        self.postMessage({
          type: 'PROGRESS',
          data: { progress }
        });
      }
    }
  }
  
  return {
    vocals: vocalsBuffer,
    instrumental: instrumentalBuffer
  };
}

async function convertToOutputFormat(result, options) {
  // Convert AudioBuffers to ArrayBuffers based on output format
  const vocalsArrayBuffer = await audioBufferToArrayBuffer(result.vocals, options.outputFormat);
  const instrumentalArrayBuffer = await audioBufferToArrayBuffer(result.instrumental, options.outputFormat);
  
  return {
    vocals: vocalsArrayBuffer,
    instrumental: instrumentalArrayBuffer
  };
}

async function audioBufferToArrayBuffer(audioBuffer, format) {
  // Simplified conversion - in reality would use proper encoding
  const length = audioBuffer.length;
  const channels = audioBuffer.numberOfChannels;
  
  // Create WAV format (simplified)
  const arrayBuffer = new ArrayBuffer(44 + length * channels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * channels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * channels * 2, true);
  
  // Audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}