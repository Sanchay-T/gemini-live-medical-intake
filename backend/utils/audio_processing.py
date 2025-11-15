"""
Audio processing utilities for medical intake application

Handles audio format conversion, validation, and processing
"""

import struct
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class AudioProcessor:
    """
    Audio processing utilities

    Supports:
    - Format validation
    - Audio chunk processing
    - Format conversion
    """

    def __init__(self,
                 sample_rate: int = 16000,
                 channels: int = 1,
                 sample_width: int = 2):
        """
        Initialize audio processor

        Args:
            sample_rate: Audio sample rate in Hz (default: 16000)
            channels: Number of audio channels (default: 1 for mono)
            sample_width: Bytes per sample (default: 2 for 16-bit)
        """
        self.sample_rate = sample_rate
        self.channels = channels
        self.sample_width = sample_width

    def validate_audio_chunk(self, audio_data: bytes) -> bool:
        """
        Validate audio chunk format

        Args:
            audio_data: Raw audio bytes

        Returns:
            True if valid, False otherwise
        """
        if not audio_data:
            logger.warning("Empty audio chunk")
            return False

        # Check if size is divisible by sample width
        if len(audio_data) % self.sample_width != 0:
            logger.warning(f"Invalid audio chunk size: {len(audio_data)}")
            return False

        return True

    def get_audio_duration(self, audio_data: bytes) -> float:
        """
        Calculate audio duration in seconds

        Args:
            audio_data: Raw audio bytes

        Returns:
            Duration in seconds
        """
        if not self.validate_audio_chunk(audio_data):
            return 0.0

        num_samples = len(audio_data) // (self.sample_width * self.channels)
        duration = num_samples / self.sample_rate

        return duration

    def convert_to_pcm(self, audio_data: bytes) -> bytes:
        """
        Convert audio to PCM format (if needed)

        Args:
            audio_data: Raw audio bytes

        Returns:
            PCM formatted audio bytes
        """
        # For this implementation, we assume input is already PCM
        # In a real application, you might need to convert from other formats
        return audio_data

    def normalize_volume(self, audio_data: bytes,
                        target_level: float = 0.5) -> bytes:
        """
        Normalize audio volume

        Args:
            audio_data: Raw audio bytes
            target_level: Target volume level (0.0 to 1.0)

        Returns:
            Volume-normalized audio bytes
        """
        if not self.validate_audio_chunk(audio_data):
            return audio_data

        # Convert bytes to samples
        samples = struct.unpack(f"{len(audio_data) // 2}h", audio_data)

        # Find max amplitude
        max_amplitude = max(abs(s) for s in samples)

        if max_amplitude == 0:
            return audio_data

        # Calculate normalization factor
        target_amplitude = 32767 * target_level
        factor = target_amplitude / max_amplitude

        # Normalize samples
        normalized_samples = [int(s * factor) for s in samples]

        # Convert back to bytes
        normalized_data = struct.pack(f"{len(normalized_samples)}h",
                                     *normalized_samples)

        return normalized_data

    def detect_silence(self, audio_data: bytes,
                      threshold: int = 500) -> bool:
        """
        Detect if audio chunk contains mostly silence

        Args:
            audio_data: Raw audio bytes
            threshold: Amplitude threshold for silence detection

        Returns:
            True if mostly silent, False otherwise
        """
        if not self.validate_audio_chunk(audio_data):
            return True

        # Convert bytes to samples
        samples = struct.unpack(f"{len(audio_data) // 2}h", audio_data)

        # Count samples above threshold
        loud_samples = sum(1 for s in samples if abs(s) > threshold)

        # Consider silent if less than 10% of samples are loud
        silence_ratio = loud_samples / len(samples)

        return silence_ratio < 0.1

    def resample_audio(self, audio_data: bytes,
                      source_rate: int,
                      target_rate: int) -> bytes:
        """
        Resample audio to different sample rate

        Args:
            audio_data: Raw audio bytes
            source_rate: Current sample rate
            target_rate: Desired sample rate

        Returns:
            Resampled audio bytes
        """
        if source_rate == target_rate:
            return audio_data

        # For this mock implementation, we just return the original
        # In a real application, you would use a library like scipy or librosa
        logger.warning(f"Resampling not implemented: {source_rate} -> {target_rate}")

        return audio_data

    def get_audio_info(self, audio_data: bytes) -> dict:
        """
        Get information about audio chunk

        Args:
            audio_data: Raw audio bytes

        Returns:
            Dict with audio information
        """
        return {
            "size_bytes": len(audio_data),
            "duration_seconds": self.get_audio_duration(audio_data),
            "sample_rate": self.sample_rate,
            "channels": self.channels,
            "sample_width": self.sample_width,
            "is_valid": self.validate_audio_chunk(audio_data),
            "is_silent": self.detect_silence(audio_data)
        }


# Default processor instance
audio_processor = AudioProcessor()


def validate_audio_format(audio_data: bytes,
                         expected_sample_rate: int = 16000,
                         expected_channels: int = 1) -> Tuple[bool, Optional[str]]:
    """
    Validate audio format meets requirements

    Args:
        audio_data: Raw audio bytes
        expected_sample_rate: Expected sample rate
        expected_channels: Expected number of channels

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not audio_data:
        return False, "Audio data is empty"

    if len(audio_data) < 2:
        return False, "Audio data too short"

    # Check alignment
    if len(audio_data) % 2 != 0:
        return False, "Audio data not properly aligned for 16-bit samples"

    return True, None


def chunk_audio(audio_data: bytes, chunk_size: int = 1024) -> list:
    """
    Split audio into chunks

    Args:
        audio_data: Raw audio bytes
        chunk_size: Size of each chunk in bytes

    Returns:
        List of audio chunks
    """
    chunks = []

    for i in range(0, len(audio_data), chunk_size):
        chunk = audio_data[i:i + chunk_size]
        chunks.append(chunk)

    return chunks
